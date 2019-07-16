export default {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  default: {
    from: 'Equipe GoBarber <noreply@gobarber.com.br',
  },
};

/**
 * Amazon SES
 * Mailgun
 * Sparkpost
 * Mandril (Mailchimp)
 * GMail (não usar pois bloqueia)
 * Mailtrap (Amb de desenvolvimento)
 */
