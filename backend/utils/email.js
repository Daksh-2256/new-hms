const axios = require("axios");
const nodemailer = require("nodemailer");

// Cached Ethereal test account to avoid creating a new one on every local fallback send
let cachedTestAccount = null;

const getEtherealTransporter = async () => {
  if (!cachedTestAccount) {
    console.log("ℹ️  [Brevo Fallback] Generating temporary Ethereal testing account for local email checks...");
    try {
      cachedTestAccount = await nodemailer.createTestAccount();
      console.log(`✅ [Brevo Fallback] Temporary test account generated: ${cachedTestAccount.user}`);
    } catch (err) {
      console.error("❌ [Brevo Fallback] Failed to generate Ethereal test account:", err.message);
    }
  }

  if (cachedTestAccount) {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: cachedTestAccount.user,
        pass: cachedTestAccount.pass
      }
    });
  }
  return null;
};

/**
 * Transporter wrapper for backward compatibility with existing codebase
 */
const transporter = {
  /**
   * Send email with logging (uses Brevo Web API over HTTPS)
   */
  sendMailWithLog: async (mailOptions) => {
    const brevoKey = process.env.BREVO_API_KEY;
    const useBrevo = brevoKey && brevoKey !== "your-brevo-api-key";

    if (useBrevo) {
      try {
        console.log("📧 Sending email via Brevo Web API (HTTPS)...");
        console.log("   To:", mailOptions.to);
        console.log("   Subject:", mailOptions.subject);

        const fromEmail = process.env.BREVO_SENDER_EMAIL || "samyakhospital5678@gmail.com";
        const fromName = process.env.BREVO_SENDER_NAME || "Samyak Ayurvedic Hospital";

        const payload = {
          sender: { name: fromName, email: fromEmail },
          to: [{ email: mailOptions.to }],
          subject: mailOptions.subject,
          htmlContent: mailOptions.html
        };

        if (mailOptions.text) {
          payload.textContent = mailOptions.text;
        }

        if (mailOptions.attachments && mailOptions.attachments.length > 0) {
          payload.attachments = mailOptions.attachments.map(att => {
            let contentStr = "";
            if (Buffer.isBuffer(att.content)) {
              contentStr = att.content.toString("base64");
            } else if (typeof att.content === "string") {
              contentStr = Buffer.from(att.content).toString("base64");
            }
            return {
              name: att.filename,
              content: contentStr
            };
          });
        }

        if (mailOptions.replyTo) {
          payload.replyTo = { email: mailOptions.replyTo };
        }

        const res = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
          headers: {
            "api-key": brevoKey,
            "content-type": "application/json"
          }
        });

        console.log("✅ Email sent successfully via Brevo Web API");
        console.log("   MessageID:", res.data.messageId);
        return { messageId: res.data.messageId };
      } catch (error) {
        console.error("❌ Brevo Email send FAILED:");
        console.error("   To:", mailOptions.to);
        console.error("   Subject:", mailOptions.subject);
        if (error.response && error.response.data) {
          console.error("   Brevo API Error:", JSON.stringify(error.response.data));
        } else {
          console.error("   Error:", error.message);
        }
        throw error;
      }
    }

    // Fallback: use Ethereal local testing
    try {
      const client = await getEtherealTransporter();
      if (!client) {
        throw new Error("Ethereal test transporter failed to initialize.");
      }
      
      console.log("📧 [Fallback] Sending email via local Ethereal SMTP:");
      console.log("   To:", mailOptions.to);
      console.log("   Subject:", mailOptions.subject);

      const msg = {
        from: `"Samyak Ayurvedic Hospital" <${cachedTestAccount.user}>`,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
      };

      if (mailOptions.attachments && mailOptions.attachments.length > 0) {
        msg.attachments = mailOptions.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.type || att.contentType
        }));
      }

      const info = await client.sendMail(msg);
      console.log("✅ [Fallback] Email sent successfully via Ethereal SMTP");
      
      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        console.log(`✉️  [DEVELOPER_NOTICE] Preview the sent email at: ${testUrl}`);
      }

      return info;
    } catch (error) {
      console.error("❌ Ethereal fallback email send FAILED:");
      console.error("   To:", mailOptions.to);
      console.error("   Subject:", mailOptions.subject);
      console.error("   Error:", error.message);
      throw error;
    }
  },

  /**
   * Send email alias
   */
  sendMail: async (mailOptions) => {
    return transporter.sendMailWithLog(mailOptions);
  },

  /**
   * Verify transporter connection configuration
   */
  verify: async (callback) => {
    const brevoKey = process.env.BREVO_API_KEY;
    const useBrevo = brevoKey && brevoKey !== "your-brevo-api-key";

    if (useBrevo) {
      if (callback) callback(null, true);
      return Promise.resolve(true);
    }

    try {
      const client = await getEtherealTransporter();
      if (!client) throw new Error("Ethereal transporter not available.");
      client.verify((err, success) => {
        if (callback) callback(err, success);
      });
    } catch (err) {
      if (callback) callback(err);
      return Promise.reject(err);
    }
  }
};

module.exports = transporter;
