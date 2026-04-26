/**
 * OAuth Passport Configuration
 * Extracted from server.js — domain: auth/social login
 */
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const prisma         = require('../services/db');
const { mapId }      = require('../services/compatibility');
const { generateUniqueUsername } = require('../services/identity');
const jwt            = require('jsonwebtoken');

function createJwtForUser(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://samarpan-quiz.vercel.app';

function setupPassport(app) {
  app.use(passport.initialize());

  // ─── Google OAuth ────────────────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email    = profile.emails?.[0]?.value;
        const name     = profile.displayName;
        const avatar   = profile.photos?.[0]?.value;
        const googleId = profile.id;

        if (!email) return done(new Error('No email from Google'), null);

        let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

        if (!user) {
          const username = await generateUniqueUsername(name);
          user = await prisma.user.create({
            data: {
              name, email: email.toLowerCase(), avatar,
              googleId, provider: 'google', username,
              preferredField: 'General',
            }
          });
        } else if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId, avatar: avatar || user.avatar, provider: 'google' }
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }));

    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'], session: false })
    );
    app.get('/api/auth/google/callback',
      passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/auth?error=google_failed` }),
      (req, res) => {
        const token = createJwtForUser(req.user);
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(mapId(req.user)))}`);
      }
    );
  }

  // ─── Facebook OAuth ──────────────────────────────────────────────────────────
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID:     process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'photos', 'email'],
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email      = profile.emails?.[0]?.value;
        const name       = profile.displayName;
        const avatar     = profile.photos?.[0]?.value;
        const facebookId = profile.id;

        let user;
        if (email) {
          user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        }
        if (!user) {
          user = await prisma.user.findFirst({ where: { facebookId } });
        }

        if (!user) {
          const username = await generateUniqueUsername(name);
          user = await prisma.user.create({
            data: {
              name, email: email?.toLowerCase() || `fb_${facebookId}@samarpan.app`,
              avatar, facebookId, provider: 'facebook', username,
              preferredField: 'General',
            }
          });
        } else if (!user.facebookId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { facebookId, avatar: avatar || user.avatar }
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }));

    app.get('/api/auth/facebook',
      passport.authenticate('facebook', { scope: ['email'], session: false })
    );
    app.get('/api/auth/facebook/callback',
      passport.authenticate('facebook', { session: false, failureRedirect: `${FRONTEND_URL}/auth?error=facebook_failed` }),
      (req, res) => {
        const token = createJwtForUser(req.user);
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(mapId(req.user)))}`);
      }
    );
  }
}

module.exports = { setupPassport };
