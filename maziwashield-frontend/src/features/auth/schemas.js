import { z } from "zod";

const PHONE = /^(?:\+?254|0)?[17]\d{8}$/;
const isPhone = (v) => PHONE.test(v.replace(/\s/g, ""));

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

const credentialsShape = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  phone: z.string().trim().min(1, "Enter your phone number").refine(isPhone, "Enter a valid Kenyan number, e.g. 712 345 678"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address")]),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/\d/, "Add a number"),
  confirmPassword: z.string().min(1, "Confirm your password"),
});

const farmShape = z.object({
  farmName: z.string().trim().min(2, "Enter your farm or shamba name"),
  county: z.string().min(1, "Choose a county"),
  herdSize: z
    .number({ invalid_type_error: "Enter your herd size" })
    .int("Use a whole number")
    .min(1, "At least 1 animal")
    .max(5000, "That looks too large"),
  averageDailyMilkLitres: z.number({ invalid_type_error: "Enter daily milk production in litres" }).positive("Enter a value greater than zero"),
  milkPricePerLitreKes: z.number({ invalid_type_error: "Enter the milk price in KES per litre" }).min(0, "Use zero or a positive amount"),
  latitude: z.preprocess((value) => (value === "" ? "" : Number(value)), z.union([z.literal(""), z.number().min(-90).max(90)])),
  longitude: z.preprocess((value) => (value === "" ? "" : Number(value)), z.union([z.literal(""), z.number().min(-180).max(180)])),
});

const matchPasswords = (v, ctx) => {
  if (v.password !== v.confirmPassword) {
    ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
  }
};

/* Step 1 validates only the credentials; step 2 validates everything */
export const credentialsSchema = credentialsShape.superRefine(matchPasswords);
export const registerSchema = credentialsShape.merge(farmShape).superRefine((values, ctx) => {
  matchPasswords(values, ctx);
  if ((values.latitude === "") !== (values.longitude === "")) {
    ctx.addIssue({ code: "custom", path: ["latitude"], message: "Enter both coordinates or leave both blank" });
  }
});
export const CREDENTIAL_FIELDS = ["fullName", "phone", "email", "password", "confirmPassword"];

export const COUNTIES = [
  { value: "Kiambu", label: "Kiambu (Kabete/Limuru)" },
  { value: "Nakuru", label: "Nakuru (Rongai/Naivasha)" },
  { value: "Uasin Gishu", label: "Uasin Gishu (Eldoret Hub)" },
  { value: "Meru", label: "Meru (Central Dairy Co-op)" },
  { value: "Nyeri", label: "Nyeri (Tetu/Mathira)" },
  { value: "Nyandarua", label: "Nyandarua (Ol Kalou)" },
];
