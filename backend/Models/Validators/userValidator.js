const { z } = require('zod');

const userValidator = z.object({
  schema: z.number().default(1),

  name: z.string().trim().min(1, { message: "Name is required" }),

  address: z.object({
    first_line: z.string().min(1, { message: "First line is required" }),
    second_line: z.string().min(1, { message: "Second line is required" }),
    city: z.string().min(1, { message: "City is required" }),
    state: z.string().min(1, { message: "State is required" }),
    pin_code: z.number().int().min(100000, "Invalid pin code").max(999999, "Invalid pin code"),
  }),

  gender: z.enum(['Male', 'Female', 'other']),

  date_of_birth: z.coerce.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Invalid date format",
  }),

  e_mail: z.string().email({ message: "Invalid email format" }),

  password: z.string().min(6, { message: "Password must be at least 6 characters" }),

  phone_no: z.number().int().min(1000000000, "Invalid phone number").max(9999999999, "Invalid phone number"),

  region: z.string().min(1, { message: "Region is required" }),
});

module.exports = userValidator;
