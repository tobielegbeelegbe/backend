const { z } = require("zod");

const redistributionSchema = z
  .object({
    participantId: z.string().min(1, "participantId is required"),

    amount: z.number().positive("Amount must be greater than zero").optional(),

    percentage: z
      .number()
      .min(0, "Percentage must be at least 0")
      .max(100, "Percentage cannot exceed 100")
      .optional(),
  })
  .superRefine((entry, ctx) => {
    if (!entry.amount && !entry.percentage) {
      ctx.addIssue({
        code: z.custom,
        message: "Either amount or percentage must be provided",
        path: ["amount", "percentage"],
      });
    }
  });

const participantSchema = z
  .object({
    type: z.enum(["USER", "GUEST"]),
    userId: z.number().optional(),
    name: z.string().min(2).max(50).optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number")
      .optional(),
    amount: z.number().positive().optional(),
    percentage: z.number().min(0).max(100).optional(),
    redistribution: z.array(redistributionSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "USER") {
      if (!data.userId) {
        ctx.addIssue({
          code: z.custom,
          message: "Registered users must provide a valid userId",
          path: ["userId"],
        });
      }
    }

    if (data.type === "GUEST") {
      if (!data.name) {
        ctx.addIssue({
          code: z.custom,
          message: "Guest participants must have a name",
          path: ["name"],
        });
      }

      if (!data.phone) {
        ctx.addIssue({
          code: z.custom,
          message: "Guests must provide a phone number",
          path: ["phone"],
        });
      }
    }
    if (data.redistribution && data.redistribution.length === 0) {
      ctx.addIssue({
        code: z.custom,
        message: "Redistribution array cannot be empty",
        path: ["redistribution"],
      });
    }
  });

// Main Create Bill Schema
const createBillSchema = z
  .object({
    title: z.string().min(3, "Title too short").max(100),
    description: z.string().max(500).optional(),
    currency: z.string().length(3).default("NGN"),
    amount: z.number().positive("Amount must be greater than 0"),
    creatorId: z.uuid().optional(),
    imageUrl: z.string().optional(),
    splitMethod: z.enum(["EVEN", "MANUAL", "RANDOM_PICK"]),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .optional()
      .refine(
        (date) => (date ? new Date(date) > new Date() : true),
        "Due date must be in the future"
      ),
    participants: z
      .array(participantSchema)
      .min(1, "At least one participant required"),
  })
  .superRefine((data, ctx) => {
    if (data.splitMethod === "MANUAL") {
      let sum = 0;
      let hasAmounts = true;

      data.participants.forEach((p, index) => {
        if (p.amount === undefined) {
          hasAmounts = false;
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Manual split requires an amount for every participant",
            path: ["participants", index, "amount"],
          });
        } else {
          sum += p.amount;
        }
      });

      if (hasAmounts) {
        const diff = Math.abs(sum - data.amount);
        if (diff > 0.1) {
          ctx.addIssue({
            code: z.custom,
            message: `Participant amounts sum to ${sum}, but total bill is ${data.amount}`,
            path: ["amount"],
          });
        }
      }
    }
  });

const applyPaymentSchema = z.object({
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive({ message: "Amount must be greater than zero" }),
  paymentDetails: z.object({
    payment_method: z.enum(
      ["wallet", "card", "bank_transfer", "cash", "other"],
      {
        required_error: "Payment method is required",
      }
    ),
  }),
});

module.exports = { createBillSchema, participantSchema, applyPaymentSchema };
