import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const app = express();

/* -------------------- */
/* Middleware */
/* -------------------- */
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* -------------------- */
/* Multer Setup */
/* -------------------- */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 10 * 1024 * 1024,
  },
});

/* -------------------- */
/* Mail Transporter */
/* -------------------- */

if (
  !process.env.GMAIL_USER ||
  !process.env.GMAIL_APP_PASSWORD ||
  !process.env.OWNER_EMAIL
) {
  console.error("❌ Missing required environment variables");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/* -------------------- */
/* APPLY ROUTE */
/* -------------------- */

app.post(
  "/apply",
  upload.fields([
    { name: "licenseFile", maxCount: 1 },
    { name: "immigrationFile", maxCount: 1 },
    { name: "otherDocument", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        firstName,
        middleName,
        lastName,
        email,
        primaryPhone,
        license,
      } = req.body;

      if (!firstName || !email || !license) {
        return res.status(400).json({
          message: "Missing required fields",
        });
      }

      if (!req.files?.licenseFile?.[0]) {
        return res.status(400).json({
          message: "License Photo is required",
        });
      }

      if (!req.files?.immigrationFile?.[0]) {
        return res.status(400).json({
          message: "Immigration Document is required",
        });
      }

      if (!req.files?.otherDocument?.[0]) {
        return res.status(400).json({
          message: "Other Document is required",
        });
      }

      /* ---------------- OWNER EMAIL ---------------- */

      await transporter.sendMail({
        from: `"GNM Family" <${process.env.GMAIL_USER}>`,
        replyTo: email,
        to: process.env.OWNER_EMAIL,
        subject: "New Driver Application - GNM Family",

        html: `
          <h2>GNM FAMILY DRIVER APPLICATION</h2>

          <p><b>Name:</b> ${firstName} ${middleName || ""} ${lastName}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Phone:</b> ${primaryPhone}</p>
          <p><b>License Number:</b> ${license}</p>

          <hr>

          <p>Applicant has requested a Google Meet interview.</p>
        `,

        attachments: [
          {
            filename: req.files.licenseFile[0].originalname,
            content: req.files.licenseFile[0].buffer,
          },
          {
            filename: req.files.immigrationFile[0].originalname,
            content: req.files.immigrationFile[0].buffer,
          },
          {
            filename: req.files.otherDocument[0].originalname,
            content: req.files.otherDocument[0].buffer,
          },
        ],
      });

      /* ---------------- APPLICANT CONFIRMATION ---------------- */

      await transporter.sendMail({
        from: `"GNM Family" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Application Received - GNM Family",

        html: `
          <h2>Thank you for applying!</h2>

          <p>Hi ${firstName},</p>

          <p>We have successfully received your application for joining the <b>GNM Family</b>.</p>

          <p>Our recruitment team will review your documents and contact you shortly.</p>

          <br>

          <p>Thank you for choosing GNM.</p>

          <p><b>GNM Family</b></p>
        `,
      });

      console.log("✅ Driver application submitted");

      res.status(200).json({
        message: "Application submitted successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to send application",
      });
    }
  }
);

/* -------------------- */
/* RATE QUOTE */
/* -------------------- */

app.post("/rate-quote", async (req, res) => {
  try {
    const data = req.body;

    await transporter.sendMail({
      from: `"GNM Logistics" <${process.env.GMAIL_USER}>`,
      replyTo: data.email,
      to: process.env.OWNER_EMAIL,

      subject: "New Rate Quote Request - GNM Logistics",

      text: `
GNM RATE QUOTE REQUEST

Company Name: ${data.companyName}
Company Website: ${data.companyWebsite}

Contact Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email}

Customer Type: ${data.customerType}
Commodity: ${data.commodity}
Shipment Value: ${data.shipmentValue}
Shipment Frequency: ${data.shipmentFrequency}

Freight Details:
${data.freightDetails}

SMS Consent: ${data.agreeSms ? "Yes" : "No"}
Email Consent: ${data.agreeEmail ? "Yes" : "No"}
`,
    });

    await transporter.sendMail({
      from: `"GNM Logistics" <${process.env.GMAIL_USER}>`,
      to: data.email,

      subject: "New Rate Quote Request - GNM Logistics",

      html: `
        <h2>Thank you!</h2>

        <p>Hello ${data.name},</p>

        <p>Your freight quote request has been successfully received.</p>

        <p>A member of the GNM Logistics team will contact you soon.</p>

        <br>

        <p>Thank you for choosing GNM Logistics.</p>
      `,
    });

    res.status(200).json({
      message: "Rate quote submitted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to submit quote",
    });
  }
});

/* -------------------- */
/* ROOT */
/* -------------------- */

app.get("/", (req, res) => {
  res.send("🟢 GNM Backend Running");
});

/* -------------------- */
/* START */
/* -------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 GNM Backend running on port ${PORT}`);
});
