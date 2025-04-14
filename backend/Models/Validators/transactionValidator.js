const { z } = require('zod');

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const transactionValidator = z.object({
  schema: z.number().default(1),

  order: z.string().regex(objectIdRegex, { message: "Invalid order ID" }),
});

module.exports = transactionValidator;
