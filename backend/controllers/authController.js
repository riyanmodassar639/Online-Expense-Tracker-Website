const db = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/* ========= Email transport (optional) =========
   .env me set karo:
   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
   Agar SMTP set na ho to test mode me code response me aa jayega.
*/
function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });
}

async function sendResetEmail(to, code) {
  const transport = getTransport();
  if (!transport) return false;

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "ExpenseTracker Password Reset Code",
    text: `Your 6-digit reset code is: ${code}\nThis code expires in 10 minutes.`,
  });

  return true;
}

/* =========================
   SIGNUP
   - new user => inactive
   - profilePic required (frontend already forced)
========================= */
exports.signup = async (req, res) => {
  try {
    const { email, firstName, lastName, username, password, phone } = req.body;

    if (!email || !firstName || !lastName || !username || !password || !phone) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Profile picture required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // store public path
    const profilePic = `/uploads/profiles/${req.file.filename}`;

    db.run(
      `INSERT INTO users (email, firstName, lastName, username, password, profilePic, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'inactive')`,
      [email, firstName, lastName, username, hashedPassword, profilePic, phone],
      function (err) {
        if (err) {
          return res.status(500).json({ message: "User already exists or invalid data" });
        }
        return res.json({ message: "Signup successful. Wait for admin approval." });
      }
    );
  } catch (e) {
    return res.status(500).json({ message: "Signup failed" });
  }
};

/* =========================
   LOGIN
   Rules:
   - inactive => 403 Admin approval required
   - blocked  => 423 Account blocked
   - active   => success
========================= */
exports.login = (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username=?", [username], async (err, user) => {
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.status !== "active") {
      return res.status(403).json({ message: "Admin approval required" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        profilePic: user.profilePic,
        email: user.email,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan || null,
        subscriptionEnd: user.subscriptionEnd || null,
      },
    });
  });
};


/* =========================
   FORGOT PASSWORD - REQUEST
========================= */
exports.requestResetCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  db.get("SELECT id,email FROM users WHERE email=?", [email], async (err, user) => {
    if (!user) return res.status(404).json({ message: "No account found on this email" });

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiry = Date.now() + 10 * 60 * 1000;

    db.run(
      "UPDATE users SET resetCodeHash=?, resetCodeExpiry=? WHERE id=?",
      [codeHash, expiry, user.id],
      async (e) => {
        if (e) return res.status(500).json({ message: "Failed to create reset code" });

        const sent = await sendResetEmail(user.email, code);

        if (!sent) {
          // test mode
          return res.json({
            message: "SMTP not configured. Test mode enabled.",
            testCode: code,
          });
        }

        return res.json({ message: "Reset code sent to your email." });
      }
    );
  });
};

/* =========================
   FORGOT PASSWORD - RESET
========================= */
exports.resetPassword = (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "Email, code and newPassword required" });
  }

  db.get(
    "SELECT id, resetCodeHash, resetCodeExpiry FROM users WHERE email=?",
    [email],
    async (err, user) => {
      if (!user) return res.status(404).json({ message: "No account found" });

      if (!user.resetCodeHash || !user.resetCodeExpiry) {
        return res.status(400).json({ message: "No reset request found" });
      }

      if (Date.now() > Number(user.resetCodeExpiry)) {
        return res.status(400).json({ message: "Code expired. Request again." });
      }

      const ok = await bcrypt.compare(code, user.resetCodeHash);
      if (!ok) return res.status(400).json({ message: "Invalid code" });

      const hashed = await bcrypt.hash(newPassword, 10);

      db.run(
        "UPDATE users SET password=?, resetCodeHash=NULL, resetCodeExpiry=NULL WHERE id=?",
        [hashed, user.id],
        (e) => {
          if (e) return res.status(500).json({ message: "Failed to update password" });
          return res.json({ message: "Password updated successfully." });
        }
      );
    }
  );
};
