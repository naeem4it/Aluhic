import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function createEmailMessage(to: string, subject: string, htmlBody: string): string {
  const fromEmail = 'fromaluhic@gmail.com';
  const messageParts = [
    `From: Alhuic <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody
  ];
  
  const message = messageParts.join('\r\n');
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  try {
    const gmail = await getGmailClient();
    const raw = createEmailMessage(to, subject, htmlBody);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: raw
      }
    });
    
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendVerificationEmail(to: string, firstName: string, verificationToken: string): Promise<boolean> {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://www.aluhic.com' 
    : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  
  const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify Your Alhuic Account';
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Alhuic!</h1>
        </div>
        <div class="content">
          <p>Hello ${firstName},</p>
          <p>Thank you for registering with Alhuic Healthcare Management Platform. Please verify your email address to activate your account.</p>
          <p style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with Alhuic, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Alhuic Healthcare Management Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, subject, htmlBody);
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetToken: string): Promise<boolean> {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://www.aluhic.com' 
    : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const subject = 'Reset Your Alhuic Password';
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${firstName},</p>
          <p>We received a request to reset your password for your Alhuic account. Click the button below to set a new password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Alhuic Healthcare Management Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, subject, htmlBody);
}

export async function sendInvitationEmail(to: string, organizationName: string, role: string, invitationToken: string): Promise<boolean> {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://www.aluhic.com' 
    : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  
  const invitationLink = `${baseUrl}/accept-invitation?token=${invitationToken}`;
  
  const subject = `You're invited to join ${organizationName} on Alhuic`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .role-badge { display: inline-block; background: #2563eb; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have been invited to join <strong>${organizationName}</strong> on Alhuic Healthcare Management Platform as a <span class="role-badge">${role}</span>.</p>
          <p>Click the button below to accept the invitation and set up your account:</p>
          <p style="text-align: center;">
            <a href="${invitationLink}" class="button">Accept Invitation</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${invitationLink}</p>
          <p>This invitation will expire in 7 days.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Alhuic Healthcare Management Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, subject, htmlBody);
}
