const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const auth = require("../controllers/authController");

const router = express.Router();

// uploads/profiles
const profilesDir = path.join(__dirname, "..", "uploads", "profiles");
fs.mkdirSync(profilesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profilesDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "_" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });

router.post("/signup", upload.single("profilePic"), auth.signup);
router.post("/login", auth.login);

// forgot password
router.post("/forgot/request", auth.requestResetCode);
router.post("/forgot/reset", auth.resetPassword);

module.exports = router;
