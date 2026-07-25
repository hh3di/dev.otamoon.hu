import nodemailer from 'nodemailer';

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export class FlutryMail {
  public static async sendMail(from: string, to: string, subject: string, html: string, replyTo?: string) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('All SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS environment variables are required.');
    }

    if (!from || !to || !subject || !html) {
      throw new Error('All from, to, subject and html parameters are required.');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions: MailOptions = {
      from,
      to,
      subject,
      html,
    };

    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);
    return info;
  }
}
