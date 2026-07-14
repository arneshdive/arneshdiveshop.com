/**
 * Admin invitation email templates
 */

import { sendEmail } from './resend';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Generate HTML email for admin invitation
 */
export function generateAdminInviteEmail(
  role: string,
  isExistingUser: boolean,
  inviteToken?: string
): { html: string; text: string } {
  const roleLabel = role === 'super_admin' ? 'Super Admin' : 'Admin';
  const acceptUrl = inviteToken ? `${APP_URL}/accept-invite?token=${inviteToken}` : `${APP_URL}/admin`;

  const text = isExistingUser
    ? `Anda telah diundang menjadi ${roleLabel} di Arnesh Dive. Silakan login untuk mengakses panel admin.`
    : `Anda telah diundang menjadi ${roleLabel} di Arnesh Dive. Gunakan link berikut untuk menyelesaikan pendaftaran: ${acceptUrl}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Undangan Admin - Arne's Dive Shop</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 8px 0; text-align: center;">Arnesh Dive</h1>
    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 32px 0;">Toko Perlengkapan Selam</p>
    
    <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0;">Undangan ${roleLabel}</h2>
    <p style="color: #4b5563; font-size: 16px; margin: 0 0 24px 0;">
      Anda telah diundang untuk menjadi <strong>${roleLabel}</strong> di Arnesh Dive.
    </p>
    
    ${isExistingUser ? `
      <p style="color: #4b5563; font-size: 16px; margin: 0 0 24px 0;">
        Silakan login ke akun Anda untuk mengakses panel admin.
      </p>
      <a href="${APP_URL}/admin" style="display: inline-block; background-color: #171717; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
        Buka Panel Admin
      </a>
    ` : `
      <p style="color: #4b5563; font-size: 16px; margin: 0 0 24px 0;">
        Klik tombol di bawah untuk menyelesaikan pendaftaran dan mengatur password akun Anda.
      </p>
      <a href="${acceptUrl}" style="display: inline-block; background-color: #171717; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
        Terima Undangan
      </a>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0 0 0;">
        Link ini akan kadaluarsa dalam 7 hari.
      </p>
    `}
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      Email ini dikirim dari Arnesh Dive. Jika Anda tidak mengetahui undangan ini, Anda dapat mengabaikannya.
    </p>
  </div>
</body>
</html>
`;

  return { html, text };
}

/**
 * Send admin invite email
 */
export async function sendAdminInviteEmail(
  email: string,
  role: string,
  isExistingUser: boolean,
  inviteToken?: string
): Promise<{ success: boolean; error?: string }> {
  const { html, text } = generateAdminInviteEmail(role, isExistingUser, inviteToken);

  return sendEmail({
    to: email,
    subject: `Undangan Admin - Arnesh Dive`,
    html,
    text,
  });
}
