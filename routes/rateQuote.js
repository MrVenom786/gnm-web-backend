const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

router.post("/", async (req, res) => {
  try {
    const {
      company,
      website,
      name,
      phone,
      email,
      customerType,
      commodity,
      dollarValue,
      frequency,
      details,
    } = req.body;

    /* EMAIL TO OWNER */
    await transporter.sendMail({
      from: `"GNM Logistics" <${process.env.GMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: "🚛 New Rate Quote Request",
      html: `
        <h2>New Rate Quote Request</h2>
        <p><b>Company:</b> ${company}</p>
        <p><b>Website:</b> ${website}</p>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Customer Type:</b> ${customerType}</p>
        <p><b>Commodity:</b> ${commodity}</p>
        <p><b>Dollar Value:</b> ${dollarValue}</p>
        <p><b>Shipment Frequency:</b> ${frequency}</p>
        <p><b>Details:</b> ${details}</p>
      `,
    });

    /* AUTO-REPLY TO CUSTOMER */
    await transporter.sendMail({
      from: `"GNM Logistics" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "We Received Your Rate Quote Request",
      text: `Hello ${name},

Thank you for requesting a rate quote with GNM Logistics.
Our team is reviewing your freight details and will contact you shortly.

– GNM Logistics`,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Rate Quote Error:", error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
