import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)
export const EMAIL_FROM = process.env.EMAIL_FROM!
export const EMAIL_TO = process.env.EMAIL_TO!
