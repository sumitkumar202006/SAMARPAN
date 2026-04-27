// routes/contact.js — Handles contact form submissions and emails samarpan.quiz.auth@gmail.com
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // Max 5 contact submissions per IP per 15 min
  message: { error: 'Too many messages. Please wait before sending again.' },
});

// Nodemailer transporter — uses SMTP_USER / SMTP_PASS from .env
// If not configured, falls back to a mailto link fallback (does not crash server)
let transporter = null;
try {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,   // samarpan.quiz.auth@gmail.com
        pass: process.env.SMTP_PASS,   // Gmail App Password (not normal password)
      },
    });
  }
} catch (e) {
  console.warn('[Contact] SMTP not configured — contact form will log to console only.');
}

/**
 * POST /api/contact
 * Body: { name, email, intent, message }
 * Sends an email to samarpan.quiz.auth@gmail.com
 */
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, intent, message } = req.body;

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Sanitize message length
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters).' });
    }

    const subject = `[Samarpan Contact] ${intent || 'General Inquiry'} — from ${name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #020617; color: #f9fafb; padding: 32px; border-radius: 16px;">
        <h2 style="color: #6366f1; margin-bottom: 4px;">New Contact Form Submission</h2>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 0;">Samarpan Arena — samarpan-quiz.vercel.app</p>
        <hr style="border-color: rgba(255,255,255,0.1); margin: 24px 0;" />
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 12px; font-weight: bold; text-transform: uppercase;">Name</td><td style="padding: 8px 0; color: #f9fafb;">${name}</td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 12px; font-weight: bold; text-transform: uppercase;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #6366f1;">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 12px; font-weight: bold; text-transform: uppercase;">Intent</td><td style="padding: 8px 0; color: #f9fafb;">${intent || 'Not specified'}</td></tr>
        </table>
        <hr style="border-color: rgba(255,255,255,0.1); margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Message</p>
        <p style="color: #f9fafb; line-height: 1.6; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; border-left: 3px solid #6366f1;">${message.replace(/\n/g, '<br/>')}</p>
        <hr style="border-color: rgba(255,255,255,0.1); margin: 24px 0;" />
        <p style="color: #4b5563; font-size: 11px;">To reply, send an email to: <a href="mailto:${email}" style="color: #6366f1;">${email}</a></p>
      </div>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: `"Samarpan Arena" <${process.env.SMTP_USER}>`,
        to: 'samarpan.quiz.auth@gmail.com',
        replyTo: email,
        subject,
        html,
      });
      console.log(`[Contact] Email sent from ${email} — "${intent}"`);
    } else {
      // Fallback: just log to console (no SMTP configured)
      console.log(`[Contact] (No SMTP) New message from ${name} <${email}>: ${intent} — ${message.slice(0, 100)}...`);
    }

    return res.json({ ok: true, message: 'Your message has been received. We\'ll reply within 24 hours.' });
  } catch (err) {
    console.error('[Contact] Error sending email:', err);
    return res.status(500).json({ error: 'Failed to send message. Please email us directly at samarpan.quiz.auth@gmail.com.' });
  }
});

module.exports = router;
