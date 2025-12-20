import { ServerClient } from 'postmark';

const postmarkToken = process.env.POSTMARK_SERVER_API_TOKEN || process.env.POSTMARK_API_TEST || 'POSTMARK_API_TEST';
const client = new ServerClient(postmarkToken);

const FROM_EMAIL = process.env.POSTMARK_FROM_ADDRESS || 'admin@example.com';


export const emailService = {
    sendConnectionRequestEmail: async (to: string, userName: string, partnerName: string, connectionUrl: string, roomUrl: string) => {
        try {
            await client.sendEmail({
                "From": FROM_EMAIL,
                "To": to,
                "Subject": `Action Required: Plan your connection with ${partnerName}`,
                "HtmlBody": `
          <h1>Hi ${userName},</h1>
          <p>It's time to connect with <strong>${partnerName}</strong>!</p>
          <p>Please propose some times that work for you.</p>
          <a href="${connectionUrl}">Plan Connection</a>
          <br/>
          <p>Or if you prefer to meet now, you can jump straight into the video room:</p>
          <a href="${roomUrl}">Join Video Room</a>
        `,
                "TextBody": `Hi ${userName}. It's time to connect with ${partnerName}! Please propose some times that work for you: ${connectionUrl}. Or join the video room directly: ${roomUrl}`,
                "MessageStream": "outbound"
            });
            console.log(`Connection request email sent to ${to}`);
        } catch (error) {
            console.error('Error sending connection request email:', error);
        }
    }
};
