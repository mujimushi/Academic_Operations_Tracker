import nodemailer from "nodemailer";
import { prisma } from "./prisma";

async function getSmtpConfig() {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: { in: ["smtp_host", "smtp_port", "smtp_user", "smtp_password", "smtp_from"] },
    },
  });

  const configMap: Record<string, string> = {};
  for (const c of configs) {
    configMap[c.key] = c.value;
  }
  return configMap;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    const config = await getSmtpConfig();

    if (!config.smtp_host || !config.smtp_user) {
      console.warn("SMTP not configured, skipping email");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: parseInt(config.smtp_port || "587", 10),
      secure: parseInt(config.smtp_port || "587", 10) === 465,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
    });

    await transporter.sendMail({
      from: config.smtp_from || config.smtp_user,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.subject,
    });

    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

export function buildTaskEmailHtml(params: {
  heading: string;
  message: string;
  taskCode: string;
  taskTitle: string;
  actionUrl: string;
  actionLabel?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: system-ui, sans-serif; background-color: #F7F8FA; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #003366; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-family: Georgia, serif; font-size: 18px;">
            NUST Academic Operations Tracker
          </h1>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #003366; font-family: Georgia, serif; margin-top: 0;">${params.heading}</h2>
          <p style="color: #333; line-height: 1.6;">${params.message}</p>
          <div style="background: #F7F8FA; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #6B7280; font-size: 12px;">Task</p>
            <p style="margin: 4px 0 0; font-weight: 600; color: #1A1A2E;">${params.taskCode} — ${params.taskTitle}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${params.actionUrl}" style="display: inline-block; background-color: #003366; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              ${params.actionLabel || "View Task"}
            </a>
          </div>
        </div>
        <div style="background: #F7F8FA; padding: 12px; text-align: center; font-size: 12px; color: #6B7280;">
          NUST Academic Operations Tracker — Do not reply to this email
        </div>
      </div>
    </body>
    </html>
  `;
}
