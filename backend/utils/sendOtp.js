const { sendEmail } = require('./emailService');

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 */
module.exports = async (email, otp) => {
  console.log(`📧 [sendOtp] Starting OTP email send to: ${email}`);
  console.log(`🔑 [DEVELOPER_NOTICE] The OTP code for ${email} is: ${otp}`);
  
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eaf4ee; border-radius: 12px; overflow: hidden; color: #333;">
      <div style="background-color: #155c3b; color: #fff; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Samyak Ayurvedic Hospital</h2>
      </div>
      <div style="padding: 30px;">
        <p>Dear Patient,</p>
        <p>We received a request to verify your account. Please use the following One-Time Password (OTP) to complete the verification process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #155c3b; background-color: #f3f8f5; padding: 10px 25px; border-radius: 6px; border: 1px solid #dceae2;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #666;">This OTP is valid for the next 5 minutes. If you did not request this code, please ignore this email or contact support.</p>
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="margin: 0; color: #4f6f60; font-weight: 600;">Samyak Ayurvedic Hospital</p>
          <p style="font-size: 12px; color: #888;">Wishing you good health.</p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: "Your OTP Verification Code",
      html: htmlContent,
      text: `Your OTP is: ${otp}. Valid for 5 minutes.`
    });
    console.log(`✅ [sendOtp] OTP email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`❌ [sendOtp] Failed to send OTP to ${email}:`, error.message);
    throw error;
  }
};
