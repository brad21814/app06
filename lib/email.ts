import { ServerClient } from 'postmark';

const postmarkToken = process.env.POSTMARK_SERVER_API_TOKEN || process.env.POSTMARK_API_TEST || 'POSTMARK_API_TEST';
const client = new ServerClient(postmarkToken);

const FROM_EMAIL = process.env.POSTMARK_FROM_ADDRESS || 'admin@example.com'; // Replace with verified sender signature
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const emailService = {
    sendWelcomeEmail: async (to: string, name: string) => {
        try {
            await client.sendEmail({
                "From": FROM_EMAIL,
                "To": to,
                "Subject": "Welcome to TeamPulp!",
                "HtmlBody": `
          <h1>Welcome, ${name}!</h1>
          <p>We're excited to have you on board.</p>
          <p>Get started by exploring your dashboard.</p>
          <a href="${BASE_URL}/dashboard">Go to Dashboard</a>
        `,
                "TextBody": `Welcome, ${name}! We're excited to have you on board. Get started by exploring your dashboard: ${BASE_URL}/dashboard`,
                "MessageStream": "outbound"
            });
            console.log(`Welcome email sent to ${to}`);
        } catch (error) {
            console.error('Error sending welcome email:', error);
            // Don't throw, just log. We don't want to break the flow if email fails.
        }
    },

    sendInviteEmail: async (to: string, inviterName: string, inviteLink: string) => {
        try {
            await client.sendEmail({
                "From": FROM_EMAIL,
                "To": to,
                "Subject": "You've been invited to join a team on TeamPulp",
                "HtmlBody": `
          <h1>You've been invited!</h1>
          <p>${inviterName} has invited you to join their team on TeamPulp.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${inviteLink}">Accept Invitation</a>
        `,
                "TextBody": `You've been invited! ${inviterName} has invited you to join their team on TeamPulp. Click the link below to accept the invitation: ${inviteLink}`,
                "MessageStream": "outbound"
            });
            console.log(`Invite email sent to ${to}`);
        } catch (error) {
            console.error('Error sending invite email:', error);
        }
    },

    sendPasswordResetEmail: async (to: string, resetLink: string) => {
        try {
            await client.sendEmail({
                "From": FROM_EMAIL,
                "To": to,
                "Subject": "Reset your password",
                "HtmlBody": `
          <h1>Reset your password</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        `,
                "TextBody": `Reset your password. You requested a password reset. Click the link below to reset your password: ${resetLink} . If you didn't request this, please ignore this email.`,
                "MessageStream": "outbound"
            });
            console.log(`Password reset email sent to ${to}`);
        } catch (error) {
            console.error('Error sending password reset email:', error);
        }
    },
    sendProposalEmail: async (to: string, proposerName: string, link: string) => {
        try {
            await client.sendEmail({
                "From": FROM_EMAIL,
                "To": to,
                "Subject": "New times proposed for your connection",
                "HtmlBody": `
          <h1>New Proposal!</h1>
          <p>${proposerName} has proposed new times for your connection.</p>
          <p>Please click the link below to verify and confirm a time that works for you:</p>
          <a href="${link}">View Proposals</a>
        `,
                "TextBody": `New Proposal! ${proposerName} has proposed new times for your connection. Please click the link below to verify and confirm a time that works for you: ${link}`,
                "MessageStream": "outbound"
            });
            console.log(`Proposal email sent to ${to}`);
        } catch (error) {
            console.error('Error sending proposal email:', error);
        }
    },

    sendCalendarInvite: async (to: string, participantName: string, partnerName: string, icsContent: string) => {
        try {
            // Encode ICS content to base64
            const icsBase64 = Buffer.from(icsContent).toString('base64');

            await client.sendEmail({
                "From": FROM_EMAIL,
                "To": to,
                "Subject": `Scheduled Connection: ${participantName} & ${partnerName}`,
                "HtmlBody": `
          <h1>Connection Confirmed!</h1>
          <p>Your connection with ${partnerName} has been confirmed.</p>
          <p>A calendar invite is attached to this email.</p>
        `,
                "TextBody": `Connection Confirmed! Your connection with ${partnerName} has been confirmed. A calendar invite is attached to this email.`,
                "MessageStream": "outbound",
                "Attachments": [
                    {
                        "Name": "connection.ics",
                        "Content": icsBase64,
                        "ContentType": "text/calendar",
                        "ContentID": null
                    }
                ]
            });
            console.log(`Calendar invite sent to ${to}`);
        } catch (error) {
            console.error('Error sending calendar invite:', error);
        }
    }
};
