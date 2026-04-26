/**
 * Environment Variable Validator
 * Call validateEnv() at the very top of server.js before anything else.
 * Fails fast with a clear message if critical config is missing.
 */

const REQUIRED = [
  { key: 'DATABASE_URL',         desc: 'PostgreSQL connection string' },
  { key: 'JWT_SECRET',           desc: 'JWT signing secret (min 32 chars)' },
];

const RECOMMENDED = [
  { key: 'GROQ_API_KEY',           desc: 'AI quiz generation (Groq)' },
  { key: 'RAZORPAY_KEY_ID',        desc: 'Payment gateway' },
  { key: 'RAZORPAY_KEY_SECRET',    desc: 'Payment gateway secret' },
  { key: 'EMAIL_USER',             desc: 'Transactional email sender' },
  { key: 'EMAIL_PASS',             desc: 'Email password / app password' },
  { key: 'GOOGLE_CLIENT_ID',       desc: 'Google OAuth' },
  { key: 'GOOGLE_CLIENT_SECRET',   desc: 'Google OAuth secret' },
  { key: 'CLOUDINARY_CLOUD_NAME',  desc: 'Cloud image storage' },
  { key: 'CLOUDINARY_API_KEY',     desc: 'Cloudinary API key' },
  { key: 'CLOUDINARY_API_SECRET',  desc: 'Cloudinary API secret' },
];

function validateEnv() {
  const errors   = [];
  const warnings = [];

  for (const { key, desc } of REQUIRED) {
    if (!process.env[key]) errors.push(`  ❌  ${key.padEnd(30)} — ${desc}`);
  }

  for (const { key, desc } of RECOMMENDED) {
    if (!process.env[key]) warnings.push(`  ⚠️   ${key.padEnd(30)} — ${desc}`);
  }

  const line = '─'.repeat(60);
  if (errors.length) {
    console.error(`\n${line}`);
    console.error('🚨  SAMARPAN — MISSING REQUIRED ENV VARS');
    console.error(line);
    errors.forEach(e => console.error(e));
    console.error(line);
    console.error('   Copy .env.example → .env and fill in the values.\n');
    process.exit(1);
  }

  if (warnings.length) {
    console.warn(`\n${line}`);
    console.warn('⚠️   SAMARPAN — OPTIONAL ENV VARS NOT SET');
    console.warn(line);
    warnings.forEach(w => console.warn(w));
    console.warn(`${line}\n`);
  }

  // JWT_SECRET strength check
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️   JWT_SECRET is shorter than 32 characters — consider a stronger secret.');
  }

  console.log('✅  Environment validated — starting Samarpan...\n');
}

module.exports = { validateEnv };
