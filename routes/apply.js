const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;

    await transporter.sendMail({
      from: `"GNM Family" <${process.env.GMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: "New Driver Application - GNM Family",
      text: `
New Driver Application

Name: ${data.firstName} ${data.lastName}
Phone: ${data.primaryPhone}
Email: ${data.email}
License: ${data.license}

Applicant requests Google Meet interview.
`
    });

    await transporter.sendMail({
      from: `"GNM Family" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: "Application Received",
      text: `Thank you ${data.firstName}, we received your application.`
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
