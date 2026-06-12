import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email").max(255);
export const phoneSchema = z.string().trim().regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number");
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[0-9]/, "Add a number")
  .regex(/[^A-Za-z0-9]/, "Add a symbol");

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Required").max(60),
    lastName: z.string().trim().min(1, "Required").max(60),
    email: emailSchema,
    phone: phoneSchema,
    country: z.string().min(2, "Select your country"),
    password: passwordSchema,
    confirmPassword: z.string(),
    referralCode: z.string().trim().max(32).optional().or(z.literal("")),
    acceptTerms: z.boolean().refine((v) => v === true, "You must accept the Terms"),
    acceptPrivacy: z.boolean().refine((v) => v === true, "You must accept the Privacy Policy"),
    marketingOptIn: z.boolean().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or phone").max(320),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const otpSchema = z.object({ code: z.string().regex(/^[0-9]{6}$/, "Enter the 6-digit code") });
