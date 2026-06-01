import { z } from "zod";

export const registerSchema = z.object({

  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(100, "Email is too long"),

    password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number, and special character"
    ),

  role: z
    .enum(["user", "admin"])
    .optional(),

});

//login vallidation
export const loginSchema = z.object({

  email: z
    .string()
    .trim()
    .email("Invalid email format"),

  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")

});

// send-otp validation
export const sendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email format"),
});

// verify-otp validation
export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email format"),
  
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

// reset-password validation
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email format"),
  
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number, and special character"
    ),

  confirmPassword: z
    .string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});