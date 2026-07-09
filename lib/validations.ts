import { z } from "zod";

export const signUpSchema = z.object({
  companyName: z.string().min(2, "Company name is too short").max(80),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const createQrSchema = z.object({
  label: z.string().min(1, "Label is required").max(120),
  targetUrl: z.string().url("Must be a valid URL"),
  tags: z.array(z.string()).default([]),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateQrInput = z.infer<typeof createQrSchema>;
