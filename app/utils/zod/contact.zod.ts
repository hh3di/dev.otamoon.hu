import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(1, { message: 'required' }).min(2, { message: 'minLength' }).max(100, { message: 'maxLength' }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'required' })
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'emailInvalid' })
    .max(255, { message: 'maxLength' }),
  message: z.string().trim().min(1, { message: 'required' }).min(10, { message: 'minLength' }).max(2000, { message: 'maxLength' }),
});
