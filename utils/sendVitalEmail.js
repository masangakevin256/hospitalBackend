const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS  // your app password
  }
});

async function sendVitalAlertEmail(patient, alert, docEmail) {
  const mailOptions = {
    from: `"Hospital Monitoring System" <${process.env.EMAIL_USER}>`,
    to: docEmail, // or dynamic email
    subject: `⚠️ Critical Alert for ${patient.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f7f9fc; padding: 20px; border-radius: 10px; color: #333;">
        <h2 style="color: #d9534f;">🚨 Patient Alert Notification</h2>
        <p>Hello Doctor,</p>
        <p>The following alert was triggered for one of your patients:</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">🧍 Patient Name</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${patient.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">🆔 Patient ID</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${patient.patientId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">📋 Alert Type</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${alert.alertType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">💬 Message</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${alert.message}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">⏰ Time</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${alert.timestamp}</td>
          </tr>
        </table>

        <p style="margin-top: 20px;">Please check on your patient immediately.</p>

        <p style="color: #999;">This is an automated message from the Hospital Monitoring System.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Alert email sent successfully!");
  } catch (error) {
    console.error(" Failed to send email:", error.message);
  }
}

module.exports = sendVitalAlertEmail;
