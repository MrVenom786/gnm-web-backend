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
app.use(express.urlencoded({ extended: true })); // REQUIRED
app.use(express.json());

/* -------------------- */
/* Multer Setup */
/* -------------------- */
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    fieldSize: 10 * 1024 * 1024, // 10 MB
  }
});

/* -------------------- */
/* Mail Transporter */
/* -------------------- */

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.OWNER_EMAIL) {
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
/* APPLY TODAY ROUTE */
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

      // Validate required fields
      if (!firstName || !email || !license) {
        console.error("Missing required fields:", { firstName, email, license });
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate files are present
      if (!req.files || !req.files.licenseFile || !req.files.licenseFile[0]) {
        console.error("Missing licenseFile");
        return res.status(400).json({ message: "License Photo is required" });
      }

      if (!req.files.immigrationFile || !req.files.immigrationFile[0]) {
        console.error("Missing immigrationFile");
        return res.status(400).json({ message: "Immigration Document is required" });
      }

      if (!req.files.otherDocument || !req.files.otherDocument[0]) {
        console.error("Missing otherDocument");
        return res.status(400).json({ message: "Other Documents are required" });
      }

      console.log("✅ Files received:", {
        licenseFile: req.files.licenseFile[0].originalname,
        immigrationFile: req.files.immigrationFile[0].originalname,
        otherDocument: req.files.otherDocument[0].originalname,
      });

      const mailOptions = {
        from: `"RGM Family" <${process.env.GMAIL_USER}>`,
        to: process.env.OWNER_EMAIL,
        subject: "New Driver Application - RGM Family",
        html: `
          <h2>RGM FAMILY DRIVER APPLICATION</h2>
          <p><b>Name:</b> ${firstName} ${middleName || ""} ${lastName}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Primary Phone:</b> ${primaryPhone}</p>
          <p><b>License Number:</b> ${license}</p>
          <p>Applicant has requested a virtual meeting via Google Meet.</p>
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
      };

      await transporter.sendMail(mailOptions);

      console.log("✅ Application email sent successfully");
      res.status(200).json({ message: "Application sent successfully" });
    } catch (error) {
      console.error("❌ Apply Error:", error.message || error);
      res.status(500).json({ 
        message: "Failed to send application",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
);

/* -------------------- */
/* RATE QUOTE ROUTE */
/* -------------------- */
app.post("/rate-quote", async (req, res) => {
  try {
    const data = req.body;

    const mailOptions = {
      from: `"RGM Rate Quote" <${process.env.GMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: "New Rate Quote Request - RGM",
      text: `
RGM RATE QUOTE REQUEST

Company Name: ${data.companyName}
Company Website: ${data.companyWebsite}
Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email}

Customer Type: ${data.customerType}
Commodity: ${data.commodity}
Dollar Value of Shipment: ${data.shipmentValue}
Shipment Frequency: ${data.shipmentFrequency}
Freight Details: ${data.freightDetails}

Agreed to SMS: ${data.agreeSms ? "Yes" : "No"}
Agreed to Email: ${data.agreeEmail ? "Yes" : "No"}
`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Rate quote submitted successfully" });
  } catch (error) {
    console.error("Rate Quote Error:", error);
    res.status(500).json({ message: "Failed to send rate quote" });
  }
});

/* -------------------- */
/* ROOT ROUTE */
/* -------------------- */
app.get("/", (req, res) => {
  res.send("🟢 Backend is running.");
});

/* -------------------- */
/* START SERVER */
/* -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
