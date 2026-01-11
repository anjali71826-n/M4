import nodemailer from 'nodemailer';
import { getEmailConfig } from './auth';

// Create reusable transporter using Gmail App Password
function createTransporter() {
  const { senderEmail, gmailAppPassword } = getEmailConfig();

  if (!senderEmail || !gmailAppPassword) {
    console.warn('Gmail configuration missing - skipping email notification');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: gmailAppPassword,
    },
  });
}

// Send confirmation email using Nodemailer
export async function sendConfirmationEmail(
  subject: string,
  htmlBody: string
): Promise<boolean> {
  const { senderEmail, advisorEmail } = getEmailConfig();

  if (!senderEmail || !advisorEmail) {
    console.warn('Email configuration missing - skipping email notification');
    return false;
  }

  const transporter = createTransporter();
  if (!transporter) {
    return false;
  }

  try {
    const result = await transporter.sendMail({
      from: `"Appointment Scheduler" <${senderEmail}>`,
      to: advisorEmail,
      subject: subject,
      html: htmlBody,
    });

    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send booking confirmation
export async function sendBookingConfirmation(
  appointmentDateTime: string,
  bookingCode?: string
): Promise<boolean> {
  const subject = '✅ Appointment Booked - Voice Scheduler';
  const bookingCodeSection = bookingCode ? `
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
          <p style="margin: 0; color: #1e40af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Booking Code</p>
          <p style="margin: 5px 0 0; color: #1e3a8a; font-size: 24px; font-weight: 700; font-family: monospace;">${bookingCode}</p>
        </div>` : '';
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Confirmed</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
        <p style="color: #334155; font-size: 16px; margin: 0 0 15px;">A new appointment has been booked via the Voice Scheduler.</p>
        ${bookingCodeSection}
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">Scheduled for:</p>
          <p style="margin: 5px 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${appointmentDateTime}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">This email was sent automatically by the Advisor Appointment Scheduler.</p>
      </div>
    </div>
  `;

  return sendConfirmationEmail(subject, htmlBody);
}

// Send reschedule confirmation
export async function sendRescheduleConfirmation(
  oldDateTime: string,
  newDateTime: string,
  bookingCode?: string
): Promise<boolean> {
  const subject = '📅 Appointment Rescheduled - Voice Scheduler';
  const bookingCodeSection = bookingCode ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
          <p style="margin: 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Booking Code</p>
          <p style="margin: 5px 0 0; color: #78350f; font-size: 24px; font-weight: 700; font-family: monospace;">${bookingCode}</p>
        </div>` : '';
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Rescheduled</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
        <p style="color: #334155; font-size: 16px; margin: 0 0 15px;">An appointment has been rescheduled via the Voice Scheduler.</p>
        ${bookingCodeSection}
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; color: #ef4444; font-size: 14px; text-decoration: line-through;">Previous: ${oldDateTime}</p>
          <p style="margin: 10px 0 0; color: #22c55e; font-size: 18px; font-weight: 600;">New: ${newDateTime}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">This email was sent automatically by the Advisor Appointment Scheduler.</p>
      </div>
    </div>
  `;

  return sendConfirmationEmail(subject, htmlBody);
}

// Send cancellation confirmation
export async function sendCancellationConfirmation(
  appointmentDateTime: string,
  bookingCode?: string
): Promise<boolean> {
  const subject = '❌ Appointment Cancelled - Voice Scheduler';
  const bookingCodeSection = bookingCode ? `
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
          <p style="margin: 0; color: #991b1b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Booking Code</p>
          <p style="margin: 5px 0 0; color: #7f1d1d; font-size: 24px; font-weight: 700; font-family: monospace;">${bookingCode}</p>
        </div>` : '';
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Cancelled</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
        <p style="color: #334155; font-size: 16px; margin: 0 0 15px;">An appointment has been cancelled via the Voice Scheduler.</p>
        ${bookingCodeSection}
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">Cancelled appointment:</p>
          <p style="margin: 5px 0 0; color: #1e293b; font-size: 18px; font-weight: 600; text-decoration: line-through;">${appointmentDateTime}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">This email was sent automatically by the Advisor Appointment Scheduler.</p>
      </div>
    </div>
  `;

  return sendConfirmationEmail(subject, htmlBody);
}
