require("dotenv").config();
const { sendEmail } = require("./utils/emailService");

// Send a test email to the configured sender email or fallback email
const targetEmail = process.env.BREVO_SENDER_EMAIL && process.env.BREVO_SENDER_EMAIL !== "your-email@gmail.com" 
  ? process.env.BREVO_SENDER_EMAIL 
  : "dakshk5610@gmail.com";

console.log(`🧪 Running email test... Target email: ${targetEmail}`);

sendEmail({
  to: targetEmail,
  subject: "TEST EMAIL (Brevo Migration)",
  html: "<h3>If you receive this, Brevo is working correctly!</h3><p>Samyak Ayurvedic Hospital Management System</p>",
  text: "If you receive this, Brevo is working correctly! Samyak Ayurvedic Hospital Management System"
})
.then(() => {
  console.log("🚀 Test execution call completed successfully.");
})
.catch(err => {
  console.error("❌ Test execution failed:", err);
});
