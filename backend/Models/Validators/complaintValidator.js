const { z } = require('zod');

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const complaintValidator = z.object({
  schema: z.number().default(1),

  order: z.string().regex(objectIdRegex, { message: "Invalid order ID" }),

  type: z.enum(['Missing', 'Damaged', 'Wrong Item', 'Expired', 'Other']).default('Other'),

  status: z.enum(['Pending', 'Resolved', 'Rejected']).default('Pending'),

  resolution: z.object({
    type: z.enum(['Refund', 'Replacement', 'Partial Refund', 'None']).default('None'),
    amount: z
      .number()
      .nonnegative({ message: "Amount must be 0 or more" })
      .nullable()
      .optional()
      .refine((val, ctx) => {
        const resolutionType = ctx?.parent?.type;
        if ((resolutionType === 'Refund' || resolutionType === 'Partial Refund') && (val === null || val === undefined)) {
          return false;
        }
        return true;
      }, { message: "Amount is required for Refund or Partial Refund" }),
    note: z.string().nullable().default(null),
  }),
});

module.exports = complaintValidator;
