const { z } = require('zod');

const categoryValidator = z.object({
  schema: z.number().default(1),

  image_link: z.string().url({ message: "Invalid image URL" }),

  name: z.string().trim().min(1, { message: "Name is required" }),

  description: z.string().min(1, { message: "Description is required" }),
});

module.exports = categoryValidator;
