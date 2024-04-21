import dotenv from 'dotenv'
import { z, ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default(process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  TMDB_AUTH_TOKEN: z.string(),
})

export const env = (() => {
  if (process.env.NODE_ENV === 'test') {
    return process.env as z.infer<typeof envSchema>
  }
  dotenv.config()
  try {
    return envSchema.parse(process.env)
  } catch (err) {
    if (err instanceof ZodError) {
      throw fromZodError(err)
    } else {
      throw err
    }
  }
})()
