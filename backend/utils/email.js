const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

// Initialize SendGrid if API key is provided
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Cached ethereal test account to avoid creating a new one on every email send
let cachedTestAccount = null;

/**
 * Dynamically create and configure a Nodemailer transporter.
 * Picks up environment variables from process.env.
 * Automatically falls back to Ethereal Email if placeholders are detected.
 */
const getTransporter = async () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // Detect placeholder values
  const isPlaceholder = !user || user === "your-email@gmail.com" || !pass || pass === "your-app-password";

  if (isPlaceholder) {
    if (!cachedTestAccount) {
      console.log("ℹ️  [Nodemailer] Placeholder email credentials detected. Generating temporary Ethereal testing account...");
      try {
        cachedTestAccount = await nodemailer.createTestAccount();
        console.log(`✅ [Nodemailer] Temporary test account generated: ${cachedTestAccount.user}`);
      } catch (err) {
        console.error("❌ [Nodemailer] Failed to generate Ethereal test account:", err.message);
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
  }

  // Configuration object for general SMTP with explicit connection timeouts to prevent hanging
  const smtpConfig = {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass,
    },
    connectionTimeout: 10000, // 10 seconds timeout
    greetingTimeout: 10000,
    socketTimeout: 10000
  };

  // Optimization: use built-in "gmail" service config if user is using Gmail
  const isGmailHost = !process.env.EMAIL_HOST || process.env.EMAIL_HOST === "smtp.gmail.com";
  if (isGmailHost && user && user.endsWith("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,
        pass: pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }

  return nodemailer.createTransport(smtpConfig);
};

/**
 * Transporter wrapper for backward compatibility with existing codebase
 */
const transporter = {
  /**
   * Send email with logging (uses SendGrid Web API on Render to bypass SMTP blocks)
   */
    if (process.env.RENDER === "true" && !process.env.SENDGRID_API_KEY) {
      console.warn("⚠️  [Nodemailer] Warning: Running on Render but SENDGRID_API_KEY is not defined in your Render Dashboard. Falling back to direct SMTP which will fail with a Connection Timeout.");
    }

    // Determine whether to use SendGrid HTTPS API instead of direct SMTP
    // Render blocks direct SMTP (ports 25, 465, 587), so we bypass this by calling SendGrid's HTTPS endpoint
    const useSendGrid = process.env.SENDGRID_API_KEY && (process.env.RENDER === "true" || process.env.NODE_ENV === "production");

    if (useSendGrid) {
      try {
        console.log("📧 [SendGrid Bypass] Sending email via SendGrid Web API (HTTPS)...");
        console.log("   To:", mailOptions.to);
        console.log("   Subject:", mailOptions.subject);

        const fromAddress = mailOptions.from || process.env.SENDGRID_FROM_EMAIL || "samyakhospital5678@gmail.com";

        const msg = {
          to: mailOptions.to,
          from: `"Samyak Ayurvedic Hospital" <${fromAddress}>`,
          subject: mailOptions.subject,
          html: mailOptions.html,
          text: mailOptions.text
        };

        if (mailOptions.attachments && mailOptions.attachments.length > 0) {
          msg.attachments = mailOptions.attachments.map(att => {
            let contentStr = "";
            if (Buffer.isBuffer(att.content)) {
              contentStr = att.content.toString("base64");
            } else if (typeof att.content === "string") {
              contentStr = Buffer.from(att.content).toString("base64");
            }
            return {
              filename: att.filename,
              content: contentStr,
              type: att.type || att.contentType,
              disposition: "attachment"
            };
          });
        }

        if (mailOptions.replyTo) {
          msg.replyTo = mailOptions.replyTo;
        }

        const info = await sgMail.send(msg);
        console.log("✅ Email sent successfully via SendGrid Web API");
        return { messageId: info[0]?.headers?.["x-message-id"] || "sg-msg-id" };
      } catch (error) {
        console.error("❌ SendGrid Email send FAILED:");
        console.error("   To:", mailOptions.to);
        console.error("   Subject:", mailOptions.subject);
        console.error("   Error:", error.message || error);
        throw error;
      }
    }

    // Fallback: use standard Nodemailer SMTP (local development)
    try {
      const client = await getTransporter();
      
      console.log("📧 Email send via Nodemailer:");
      console.log("   To:", mailOptions.to);
      console.log("   Subject:", mailOptions.subject);

      const defaultFrom = cachedTestAccount ? cachedTestAccount.user : (process.env.EMAIL_USER || "noreply@samyakhospital.com");
      let fromAddress = mailOptions.from || process.env.EMAIL_FROM || defaultFrom;

      // Force fromAddress to match EMAIL_USER if authenticating via Gmail to pass SPF/DKIM checks
      if (process.env.EMAIL_USER && process.env.EMAIL_USER.endsWith("@gmail.com")) {
        fromAddress = process.env.EMAIL_USER;
      }

      const msg = {
        from: `"Samyak Ayurvedic Hospital" <${fromAddress}>`,
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

      if (mailOptions.replyTo) {
        msg.replyTo = mailOptions.replyTo;
      }

      const info = await client.sendMail(msg);
      console.log("✅ Email sent successfully via Nodemailer");
      console.log("   MessageID:", info.messageId);

      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        console.log(`✉️  [DEVELOPER_NOTICE] Preview the sent email at: ${testUrl}`);
      }

      return info;
    } catch (error) {
      console.error("❌ Email send FAILED:");
      console.error("   To:", mailOptions.to);
      console.error("   Subject:", mailOptions.subject);
      console.error("   Error:", error.message);
      console.error("   Diagnostic Configuration Info:", {
        EMAIL_USER: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 4)}***@${process.env.EMAIL_USER.split('@')[1]}` : "NOT SET",
        EMAIL_PASS_LENGTH: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
        EMAIL_PASS_IS_PLACEHOLDER: process.env.EMAIL_PASS === "your-app-password",
        EMAIL_HOST: process.env.EMAIL_HOST || "NOT SET",
        EMAIL_PORT: process.env.EMAIL_PORT || "NOT SET",
        EMAIL_SECURE: process.env.EMAIL_SECURE || "NOT SET",
        EMAIL_FROM: process.env.EMAIL_FROM || "NOT SET"
      });
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
    // If using SendGrid on production, we bypass Nodemailer verification
    const useSendGrid = process.env.SENDGRID_API_KEY && (process.env.RENDER === "true" || process.env.NODE_ENV === "production");
    if (useSendGrid) {
      if (callback) callback(null, true);
      return Promise.resolve(true);
    }

    try {
      const client = await getTransporter();
      if (callback) {
        client.verify((err, success) => {
          callback(err, success);
        });
      } else {
        return client.verify();
      }
    } catch (err) {
      if (callback) callback(err);
      return Promise.reject(err);
    }
  }
};

module.exports = transporter;
