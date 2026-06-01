import express from "express";

import {home,register,login,logout,sendOtp,verifyOtp,resetPassword} from "../controllers/auth.controller.js";

import { validate } from "../middleware/validate.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";

import {registerSchema,loginSchema,sendOtpSchema,verifyOtpSchema,resetPasswordSchema} from "../validations/auth.validation.js";

const router = express.Router();

router.get("/", home);

router.post("/register",validate(registerSchema),register);

router.post("/login",validate(loginSchema),login);

router.post("/send-otp", validate(sendOtpSchema), sendOtp);

router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);

router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

router.post("/logout", verifyToken, logout);

export default router;