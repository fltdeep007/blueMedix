const { z } = require('zod');

const productValidator = z.object({
  schema: z.number().default(1),

  name: z.string().trim().min(1, { message: "Product name is required" }),

  image_link: z.string().url({ message: "Invalid image URL" }),

  price: z.preprocess((val) => {
    if (typeof val === 'string' || typeof val === 'number') return parseFloat(val);
    return val;
  }, z.number().nonnegative({ message: "Price must be 0 or more" })),

  description: z.string().min(1, { message: "Description is required" }),

  discount: z.number().min(0, { message: "Discount can't be negative" }).max(100, { message: "Discount can't exceed 100%" }).default(0),

  quantity: z.number().int().nonnegative({ message: "Quantity must be 0 or more" }),

  category: z.string().regex(/^[a-fA-F0-9]{24}$/, { message: "Invalid category ID" }).optional(),

  seller: z.string().regex(/^[a-fA-F0-9]{24}$/, { message: "Invalid seller ID" }),
});

module.exports = productValidator;
