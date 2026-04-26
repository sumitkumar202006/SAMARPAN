const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Brand colors & shared template wrapper ───────────────────────────────────
function emailWrapper(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#0f0f14;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#1a1a2e;border:1px solid #2a2a3e;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;">SAMARPAN</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:3px;">Quiz Arena</p>
        </div>
        <!-- Body -->
        <div style="padding:40px;">
          ${content}
        </div>
        <!-- Footer -->
        <div style="padding:20px 40px;border-top:1px solid #2a2a3e;text-align:center;">
          <p style="color:#555;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} Samarpan Quiz Arena. All rights reserved.</p>
          <p style="color:#555;font-size:11px;margin:4px 0 0;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── OTP / Password Reset Email ───────────────────────────────────────────────
async function sendOTPEmail(toEmail, otp) {
  const html = emailWrapper(`
    <p style="color:#ccc;font-size:16px;margin:0 0 24px;">Hello,</p>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 32px;">
      You requested a password reset. Use the code below to reset your password. 
      This code is valid for <strong style="color:#fff;">10 minutes</strong>.
    </p>
    <div style="background:#0f0f14;border:1px solid #6366f1;border-radius:12px;padding:24px;text-align:center;margin:0 0 32px;">
      <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#6366f1;">${otp}</span>
    </div>
    <p style="color:#777;font-size:13px;">If you did not request this, please ignore this email. Your account remains secure.</p>
  `);

  return _sendMail({ to: toEmail, subject: 'Your Password Reset OTP — SAMARPAN', html });
}

// ─── Subscription Confirmation Email ─────────────────────────────────────────
async function sendSubscriptionConfirmationEmail(toEmail, userName, plan, periodEnd) {
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
  const endDate = periodEnd ? new Date(periodEnd).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : 'N/A';

  const html = emailWrapper(`
    <p style="color:#ccc;font-size:16px;margin:0 0 8px;">Hey ${userName || 'Champion'} 🎉</p>
    <h2 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 24px;">Welcome to <span style="color:#6366f1;">${planDisplay} Plan!</span></h2>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Your subscription has been activated. You now have full access to all ${planDisplay} features including
      AI quiz generation, rated matches, analytics, and more.
    </p>
    <div style="background:#0f0f14;border:1px solid #2a2a3e;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;">Plan</td><td style="color:#fff;font-size:14px;font-weight:700;text-align:right;padding:8px 0;">${planDisplay}</td></tr>
        <tr style="border-top:1px solid #2a2a3e;"><td style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;">Renewal Date</td><td style="color:#fff;font-size:14px;font-weight:700;text-align:right;padding:8px 0;">${endDate}</td></tr>
        <tr style="border-top:1px solid #2a2a3e;"><td style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;">Auto-Pay</td><td style="color:#22c55e;font-size:14px;font-weight:700;text-align:right;padding:8px 0;">✓ Active</td></tr>
      </table>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'https://samarpan-quiz.vercel.app'}/billing" 
         style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:1px;">
        View Dashboard →
      </a>
    </div>
  `);

  return _sendMail({ to: toEmail, subject: `${planDisplay} Plan Activated — SAMARPAN`, html });
}

// ─── Subscription Cancelled Email ─────────────────────────────────────────────
async function sendSubscriptionCancelledEmail(toEmail, userName, periodEnd) {
  const endDate = periodEnd ? new Date(periodEnd).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : 'soon';

  const html = emailWrapper(`
    <p style="color:#ccc;font-size:16px;margin:0 0 8px;">Hi ${userName || 'there'},</p>
    <h2 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 24px;">Your subscription has been cancelled</h2>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Your plan access will remain active until <strong style="color:#fff;">${endDate}</strong>. 
      After that, your account will revert to the free Spark plan.
    </p>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 32px;">
      Changed your mind? You can re-subscribe anytime from the pricing page.
    </p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'https://samarpan-quiz.vercel.app'}/pricing" 
         style="display:inline-block;background:#1e1e2e;border:1px solid #6366f1;color:#6366f1;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:1px;">
        Resubscribe →
      </a>
    </div>
  `);

  return _sendMail({ to: toEmail, subject: 'Subscription Cancelled — SAMARPAN', html });
}

// ─── Payment Failed / Subscription Halted Email ───────────────────────────────
async function sendPaymentFailedEmail(toEmail, userName) {
  const html = emailWrapper(`
    <p style="color:#ccc;font-size:16px;margin:0 0 8px;">Hi ${userName || 'there'},</p>
    <h2 style="color:#f59e0b;font-size:22px;font-weight:900;margin:0 0 24px;">⚠️ Payment Failed</h2>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 24px;">
      We were unable to process your latest subscription renewal. Your plan has been temporarily 
      suspended. Please update your payment method to restore access.
    </p>
    <div style="background:#1c1510;border:1px solid #f59e0b;border-radius:12px;padding:16px 20px;margin:0 0 32px;">
      <p style="color:#f59e0b;font-size:13px;margin:0;font-weight:600;">
        ⚡ Act quickly — your access to premium features has been paused.
      </p>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'https://samarpan-quiz.vercel.app'}/billing" 
         style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:1px;">
        Fix Payment →
      </a>
    </div>
  `);

  return _sendMail({ to: toEmail, subject: '⚠️ Payment Failed — SAMARPAN', html });
}

// ─── Trial Activated Email ────────────────────────────────────────────────────
async function sendTrialActivatedEmail(toEmail, userName, trialDays, trialPlan, trialEndsAt) {
  const planDisplay = trialPlan.charAt(0).toUpperCase() + trialPlan.slice(1);
  const endDate = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : `${trialDays} days from now`;

  const html = emailWrapper(`
    <p style="color:#ccc;font-size:16px;margin:0 0 8px;">Hey ${userName || 'Champion'} 🚀</p>
    <h2 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 24px;">Your <span style="color:#6366f1;">${trialDays}-Day Free Trial</span> is live!</h2>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 24px;">
      You now have full ${planDisplay} access for ${trialDays} days. AI quizzes, rated battles, analytics — all unlocked.
      Your trial ends on <strong style="color:#fff;">${endDate}</strong>.
    </p>
    <p style="color:#777;font-size:13px;margin:0 0 32px;">
      After your trial, you'll be automatically charged the regular plan price. Cancel anytime from your billing page.
    </p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'https://samarpan-quiz.vercel.app'}/dashboard" 
         style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:1px;">
        Start Playing →
      </a>
    </div>
  `);

  return _sendMail({ to: toEmail, subject: `Your ${trialDays}-Day Free Trial is Active — SAMARPAN`, html });
}

// ─── Shared internal mailer ───────────────────────────────────────────────────
async function _sendMail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"SAMARPAN Arena" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent "${subject}" to ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error('[Email] Send error:', error.message);
    return false;
  }
}

module.exports = {
  sendOTPEmail,
  sendSubscriptionConfirmationEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
  sendTrialActivatedEmail,
};
