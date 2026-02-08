import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.TWILIO_API_KEY;
const apiKeySecret = process.env.TWILIO_API_SECRET;

export interface TokenRequest {
    identity: string;
    roomName: string;
}

export class TwilioService {
    /**
     * Generate an access token for a user to join a video room
     */
    static generateToken(data: TokenRequest): string {
        if (!accountSid || !apiKeySid || !apiKeySecret) {
            throw new Error('Twilio API credentials not configured');
        }

        const AccessToken = twilio.jwt.AccessToken;
        const VideoGrant = AccessToken.VideoGrant;

        // Create an access token which we will sign and return to the client,
        // containing the grant we just created
        const token = new AccessToken(
            accountSid,
            apiKeySid,
            apiKeySecret,
            {
                identity: data.identity,
                ttl: 14400 // 4 hours
            }
        );

        // Grant the access token Twilio Video capabilities
        const grant = new VideoGrant({
            room: data.roomName
        });

        token.addGrant(grant);

        // Serialize the token to a JWT string
        return token.toJwt();
    }
    /**
     * Complete (End) a video room by its unique name
     * Returns the Room SID if successful, or null if not found/already closed
     */
    static async completeRoom(roomName: string): Promise<string | null> {
        // Authenticate with Account SID and Auth Token (Required for REST API)
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            console.error("Twilio credentials missing for REST API");
            throw new Error('Twilio Auth Token missing');
        }

        const client = twilio(accountSid, authToken);

        try {
            const room = await client.video.v1.rooms(roomName).update({ status: 'completed' });
            return room.sid;
        } catch (error: any) {
            // If room not found or already completed, consider it success or specific error
            if (error.code === 20404 || error.status === 404) {
                console.warn(`Room ${roomName} not found or already closed.`);
                return null;
            }
            console.error("Error completing room:", error);
            throw error;
        }
    }

    /**
     * Create a video room ensuring recording is enabled
     */
    static async createRoom(roomName: string): Promise<string> {
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            throw new Error('Twilio Auth Token missing');
        }

        const client = twilio(accountSid, authToken);

        try {
            // Check if room exists first
            try {
                const existingRoom = await client.video.v1.rooms(roomName).fetch();
                return existingRoom.sid;
            } catch (error: any) {
                if (error.code !== 20404) throw error;
            }

            // Create new room
            const room = await client.video.v1.rooms.create({
                uniqueName: roomName,
                type: 'group',
                recordParticipantsOnConnect: true,
                unusedRoomTimeout: 5, // Room closes if no one joins in 5 mins
                emptyRoomTimeout: 1,  // Room closes 1 min after last person leaves
                ...(process.env.FUNCTIONS_URL ? {
                    statusCallback: `${process.env.FUNCTIONS_URL}/twilioWebhook`,
                    statusCallbackMethod: 'POST'
                } : {})
            });
            return room.sid;
        } catch (error) {
            console.error("Error creating room:", error);
            throw error;
        }
    }
}
