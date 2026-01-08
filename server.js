require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const db = require("./db");
const { client, service_id}=require('./twilioConfig');
const { Message } = require('twilio/lib/twiml/MessagingResponse');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (!file) return cb(null, true);
    const allowedExt = /jpg|jpeg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.test(ext)) return cb(new Error("Only image files allowed"));
    cb(null, true);
  },
});

const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
const validatePhone = (phone) => /^\+?\d{10,15}$/.test(phone);
const validatePassword = (password) => password && password.length >= 6;

app.post("/register_user", upload.single("image"), async (req, res) => {
  try {
    const { username, email, password, contact } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!username || !email || !password || !contact)
      return res.status(400).json({ status: false, message: "All fields required" });
    if (!validateEmail(email))
      return res.status(400).json({ status: false, message: "Invalid email" });
    if (!validatePhone(contact))
      return res.status(400).json({ status: false, message: "Invalid phone number" });
    if (!validatePassword(password))
      return res.status(400).json({ status: false, message: "Password must be at least 6 characters" });

    const [rows] = await db.promise().execute("SELECT id FROM users WHERE email=?", [email]);
    if (rows.length > 0)
      return res.status(400).json({ status: false, message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.promise().execute(
      "INSERT INTO users (username,email,password,contact,image,is_active) VALUES (?,?,?,?,?,0)",
      [username, email, hash, contact, image]
    );

    return res.json({
      status: true,
      message: "Registered successfully",
      data: { id: result.insertId, username, email, image },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: "Server error", error: err.message });
  }
});

app.post("/login", (req, res) => {
  console.log("LOGIN BODY =>", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: false,
      message: "Email and password required",
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({
        status: false,
        message: "Server error",
      });
    }

    if (result.length === 0) {
      return res.status(401).json({
        status: false,
        message: "Invalid credentials",
      });
    }

    const user = result[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error("❌ Bcrypt Error:", err);
        return res.status(500).json({
          status: false,
          message: "Server error",
        });
      }

      if (!isMatch) {
        return res.status(401).json({
          status: false,
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        { id: user.id },
        "SevaSathi@123",
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        status: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          contact: user.contact,
          image: user.image,
        },
      });
    });
  });
});


app.post("/send-otp", async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: false,
        message: "Phone required (+91 format)",
      });
    }

    if (!phone.startsWith("+")) {
      phone = "+91" + phone; 
    }

    const result = await client.verify.v2
      .services(service_id)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    res.json({
      status: true,
      message: "OTP sent successfully",
      sid: result.sid,
    });
  } catch (error) {
    console.error("OTP SEND ERROR:", error);
    res.status(500).json({
      status: false,
      message: "OTP send failed",
    });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        status: false,
        message: "Phone & OTP required",
      });
    }

    const formattedPhone = phone.startsWith("+91")
      ? phone
      : `+91${phone}`;

    console.log("VERIFY OTP FOR:", formattedPhone);

    const verify = await client.verify.v2
      .services(service_id)
      .verificationChecks.create({
        to: formattedPhone,
        code: otp,
      });

    if (verify.status === "approved") {
      return res.json({
        status: true,
        message: "Phone verified",
      });
    }

    return res.status(400).json({
      status: false,
      message: "Invalid OTP",
    });
  } catch (error) {
    console.error("OTP VERIFY ERROR:", error);
    res.status(500).json({
      status: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
});






const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
