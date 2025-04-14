const { z } = require('zod');

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const orderValidator = z.object({
  schema: z.number().default(1),

  customer: z.string().regex(objectIdRegex, { message: "Invalid customer ID" }),

  seller: z.string().regex(objectIdRegex, { message: "Invalid seller ID" }),

  items: z.array(
    z.object({
      product: z.string().regex(objectIdRegex, { message: "Invalid product ID" }),
      quantity: z.number().int().positive({ message: "Quantity must be greater than 0" }),
    })
  ).min(1, { message: "Order must contain at least one item" }),

  payment_method: z.enum(['credit_card', 'UPI', 'netbanking', 'cash_on_delivery', 'debit_card']),

  status: z.enum(['pending', 'shipped', 'delivered', 'cancelled']).default('pending'),

  doctor: z.string().min(1, { message: "Doctor's name is required" }),

  prescription_image: z.string().url({ message: "Invalid prescription image URL" }),
});

module.exports = orderValidator;
