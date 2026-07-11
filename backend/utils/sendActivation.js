const { sendEmail } = require('./emailService');

/**
 * Send account activation email
 * @param {string} email - Recipient email
 * @param {string} token - Activation token
 * @param {string} host - Host
 */
module.exports = async (email, token, host) => {
  console.log(`📧 [sendActivation] Starting activation email send to: ${email}`);
  
  // Construct activation link using request host or FRONTEND_URL as fallback
  let baseUrl = process.env.FRONTEND_URL;
  if (host && (host.includes("localhost") || host.includes("127.0.0.1"))) {
    baseUrl = `http://${host}`;
  }
  const link = `${baseUrl}/activate.html?token=${token}&email=${email}`;

  console.log(`🔗 [DEVELOPER_NOTICE] The activation link for ${email} is: ${link}`);

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eaf4ee; border-radius: 12px; overflow: hidden; color: #333;">
      <div style="background-color: #155c3b; color: #fff; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Samyak Ayurvedic Hospital</h2>
      </div>
      <div style="padding: 30px;">
        <p>Dear Patient,</p>
        <p>A patient record has been successfully created for you at Samyak Ayurvedic Hospital.</p>
        <p>To finalize your registration, set your password, and activate your account, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="display: inline-block; padding: 12px 30px; background-color: #155c3b; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(21, 92, 59, 0.15);">Activate Account</a>
        </div>
        <p style="font-size: 13px; color: #666;">This activation link is valid for 24 hours. If you need any assistance, please contact our support desk.</p>
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
      subject: "Activate Your Patient Account",
      html: htmlContent,
      text: `Welcome to Samyak Hospital. Please click the link to activate your account: ${link}`
    });
    console.log(`✅ [sendActivation] Activation email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`❌ [sendActivation] Failed to send activation email to ${email}:`, error.message);
    throw error;
  }
};
