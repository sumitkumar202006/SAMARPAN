const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP Email
 * @param {string} toEmail 
 * @param {string} otp 
 */
async function sendOTPEmail(toEmail, otp) {
  const mailOptions = {
    from: `"SAMARPAN Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Password Reset OTP - SAMARPAN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">SAMARPAN</h2>
        <p>Hello,</p>
        <p>You requested a password reset. Use the following code to reset your password. This code is valid for 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1; background: #f3f4f6; padding: 10px 20px; border-radius: 5px;">${otp}</span>
        </div>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">&copy; ${new Date().getFullYear()} SAMARPAN Quiz Arena. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

module.exports = { sendOTPEmail };
