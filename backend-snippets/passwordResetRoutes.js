// Drop-in example for your backend API (Express + Mongo/Mongoose style).
// Mount under: /api/v1/users
//
// Endpoints:
//   POST /forgot-password
//   POST /reset-password
//
// Required env:
//   APP_BASE_URL=http://localhost:5173
//   PASSWORD_RESET_TOKEN_TTL_MINUTES=30
//
// Required User fields (schema):
//   passwordResetTokenHash: { type: String, default: null, select: false }
//   passwordResetExpiresAt: { type: Date, default: null, select: false }
//
// Adjust imports for your backend structure.

import crypto from "node:crypto";
import { Router } from "express";
// import { User } from "../models/User.js";
// import { sendEmail } from "../services/emailService.js";

const router = Router();
const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30
);
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";

const isEmail = (value = "") => /\S+@\S+\.\S+/.test(String(value));

const sanitizeEmail = (value = "") => String(value).trim().toLowerCase();

const buildResetLink = (rawToken) =>
  `${APP_BASE_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}`;

const genericForgotPasswordResponse = {
  message: "If an account exists for this email, reset instructions have been sent.",
};

router.post("/forgot-password", async (req, res) => {
  try {
    const email = sanitizeEmail(req.body?.email);
    if (!email || !isEmail(email)) {
      return res.status(400).json({ message: "Valid email is required." });
    }

    // IMPORTANT: replace with your own user lookup
    const user = await User.findOne({ email }).select("+passwordResetTokenHash +passwordResetExpiresAt");

    // Return generic response to avoid account enumeration
    if (!user) {
      return res.status(200).json(genericForgotPasswordResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000
    );

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save({ validateBeforeSave: false });

    const resetLink = buildResetLink(rawToken);

    // Replace with your real mail provider integration.
    // await sendEmail({
    //   to: user.email,
    //   subject: "Reset your password",
    //   text: `Use this link to reset your password: ${resetLink}`,
    // });

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[password-reset] ${user.email}: ${resetLink}`);
    }

    return res.status(200).json(genericForgotPasswordResponse);
  } catch (error) {
    return res.status(500).json({ message: "Failed to process forgot-password request." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = String(req.body?.token || req.body?.resetToken || "").trim();
    const password = String(req.body?.password || req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!token) {
      return res.status(400).json({ message: "Reset token is required." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    if (!confirmPassword || confirmPassword !== password) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // IMPORTANT: replace with your own user lookup
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpiresAt");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    // If your User schema has a pre-save hook to hash password, this is enough.
    // Otherwise hash here before saving.
    user.password = password;
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;

    await user.save();

    // Optional: invalidate active sessions/tokens for this user here.
    // Example: user.tokenVersion += 1;

    return res.status(200).json({ message: "Password reset successful. Please sign in." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reset password." });
  }
});

export default router;

/*
Integration example:

import userPasswordResetRoutes from "./routes/passwordResetRoutes.js";
app.use("/api/v1/users", userPasswordResetRoutes);
*/
