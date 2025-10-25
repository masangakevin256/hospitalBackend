const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, html = null, cc) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Health Monitoring System" <${process.env.EMAIL_USER}>`,
      to,
      cc,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error(" Failed to send email:", error);
  }
};

module.exports = sendEmail;
