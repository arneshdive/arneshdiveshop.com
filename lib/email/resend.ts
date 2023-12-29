/**
 * Resend email sending utility
 * Used for transactional emails: OTP verification, password reset, order notifications
 */

import { Resend } from 'resend';

const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// Lazy-initialize Resend to avoid build-time errors when API key is missing
let resendInstance: InstanceType<typeof Resend> | null = null;
function getResend() {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn('Resend API key not configured - email would have been sent to:', options.to);
    if (process.env.NODE_ENV !== 'production') {
      return { success: true, id: 'dev-mock-id' };
    }
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Generate HTML email for password reset OTP
 */
export function generatePasswordResetEmail(otp: string, expiresInMinutes: number): { html: string; text: string } {
  const text = `Kode OTP untuk reset password Anda: ${otp}. Kode ini berlaku selama ${expiresInMinutes} menit. Jika Anda tidak meminta reset password, abaikan email ini.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Arnes Dive</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #171717; font-size: 24px; margin: 0;">ARNES DIVE</h1>
  </div>
  
  <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #171717; font-size: 20px; margin-top: 0;">Reset Password</h2>
    <p style="margin-bottom: 20px;">Anda menerima email ini karena ada permintaan untuk reset password akun Anda.</p>
    
    <div style="background: #fff; border: 2px solid #171717; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #737373;">Kode OTP Anda:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; color: #171717;">${otp}</p>
    </div>
    
    <p style="font-size: 14px; color: #737373; margin-bottom: 0;">Kode ini berlaku selama <strong>${expiresInMinutes} menit</strong>.</p>
  </div>
  
  <p style="font-size: 14px; color: #737373;">Jika Anda tidak meminta reset password, Anda dapat mengabaikan email ini dengan aman.</p>
  
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #a3a3a3; text-align: center;">
    © ${new Date().getFullYear()} Arnes Dive. All rights reserved.
  </p>
</body>
</html>
`;

  return { html, text };
}

/**
 * Send password reset OTP email
 */
export async function sendPasswordResetEmail(to: string, otp: string, expiresInMinutes: number = 15): Promise<{ success: boolean; error?: string }> {
  const { html, text } = generatePasswordResetEmail(otp, expiresInMinutes);
  
  return sendEmail({
    to,
    subject: 'Reset Password - Arnes Dive',
    html,
    text,
  });
}

/**
 * Generate HTML email for email verification
 */
export function generateVerificationEmail(otp: string, expiryMinutes: number): { html: string; text: string } {
  const text = `
Arne's Dive Shop - Verifikasi Email

Gunakan kode berikut untuk memverifikasi alamat email Anda:
${otp}

Kode ini akan kedaluwarsa dalam ${expiryMinutes} menit.

Jika Anda tidak meminta kode ini, Anda dapat mengabaikan email ini.
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Email - Arne's Dive Shop</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 8px 0; text-align: center;">Arne's Dive Shop</h1>
    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 32px 0;">Toko Perlengkapan Selam</p>
    
    <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0;">Verifikasi Email Anda</h2>
    <p style="color: #4b5563; font-size: 16px; margin: 0 0 24px 0;">
      Terima kasih telah mendaftar! Gunakan kode berikut untuk memverifikasi alamat email Anda:
    </p>
    
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;">
      Kode ini akan kedaluwarsa dalam ${expiryMinutes} menit.
    </p>
    
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 32px 0;">
      Jika Anda tidak meminta kode ini, Anda dapat mengabaikan email ini.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      Email ini dikirim dari Arne's Dive Shop. Jangan balas email ini.
    </p>
  </div>
</body>
</html>
`;

  return { html, text };
}

/**
 * Send verification OTP email
 */
export async function sendVerificationEmail(
  email: string,
  otp: string,
  expiryMinutes: number = 15
): Promise<{ success: boolean; error?: string }> {
  const { html, text } = generateVerificationEmail(otp, expiryMinutes);

  return sendEmail({
    to: email,
    subject: "Verifikasi Email - Arne's Dive Shop",
    html,
    text,
  });
}
