import twilio from 'twilio';
import { jwt } from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY;
const apiKeySecret = process.env.TWILIO_API_SECRET;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

export interface TwilioTokenData {
  identity: string;
  roomName: string;
}

export interface RoomParticipant {
  sid: string;
  identity: string;
  status: 'connected' | 'disconnected';
  joinedAt?: Date;
  leftAt?: Date;
}

export interface RoomInfo {
  sid: string;
  name: string;
  status: 'in-progress' | 'completed' | 'failed';
  participants: RoomParticipant[];
  createdAt: Date;
  dateUpdated: Date;
}

export class TwilioService {
  /**
   * Generate an access token for a user to join a video room
   */
  static generateToken(data: TwilioTokenData): string {
    if (!accountSid || !apiKeySid || !apiKeySecret) {
      throw new Error('Twilio API credentials not configured');
    }

    console.log('Generating token for:', {
      identity: data.identity,
      roomName: data.roomName,
      accountSid: accountSid.substring(0, 10) + '...',
      apiKeySid: apiKeySid.substring(0, 10) + '...',
    });

    // Create an access token with the correct parameters
    const token = new jwt.AccessToken(
      accountSid,    // 1st param: Account SID
      apiKeySid,     // 2nd param: API Key SID
      apiKeySecret,  // 3rd param: API Key Secret
      { 
        ttl: 14400,  // 4 hours max session
        identity: data.identity 
      }
    );

    // Create video grant for the room
    const videoGrant = new jwt.AccessToken.VideoGrant({
      room: data.roomName,
    });

    token.addGrant(videoGrant);

    const jwtToken = token.toJwt();
    console.log('Token generated successfully, length:', jwtToken.length);
    
    return jwtToken;
  }

  /**
   * Create a new video room
   */
  static async createRoom(roomName: string): Promise<RoomInfo> {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const room = await client.video.v1.rooms.create({
        uniqueName: roomName,
        type: 'group', // Group rooms allow multiple participants
        recordParticipantsOnConnect: false, // Set to true if you want to record
        maxParticipants: 10, // Adjust based on your needs
      });

      return {
        sid: room.sid,
        name: room.uniqueName || roomName,
        status: room.status as 'in-progress' | 'completed' | 'failed',
        participants: [],
        createdAt: room.dateCreated,
        dateUpdated: room.dateUpdated,
      };
    } catch (error) {
      console.error('Error creating Twilio room:', error);
      throw new Error('Failed to create video room');
    }
  }

  /**
   * Get room information including participants
   */
  static async getRoomInfo(roomSid: string): Promise<RoomInfo | null> {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const room = await client.video.v1.rooms(roomSid).fetch();
      const participants = await this.getRoomParticipants(roomSid);

      return {
        sid: room.sid,
        name: room.uniqueName || room.sid,
        status: room.status as 'in-progress' | 'completed' | 'failed',
        participants,
        createdAt: room.dateCreated,
        dateUpdated: room.dateUpdated,
      };
    } catch (error) {
      console.error('Error fetching room info:', error);
      return null;
    }
  }

  /**
   * Get all participants in a room
   */
  static async getRoomParticipants(roomSid: string): Promise<RoomParticipant[]> {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const participants = await client.video.v1.rooms(roomSid).participants.list();

      return participants.map(participant => ({
        sid: participant.sid,
        identity: participant.identity,
        status: participant.status as 'connected' | 'disconnected',
        joinedAt: participant.dateCreated,
        leftAt: participant.dateUpdated,
      }));
    } catch (error) {
      console.error('Error fetching room participants:', error);
      return [];
    }
  }

  /**
   * Get a specific participant in a room
   */
  static async getParticipant(roomSid: string, participantSid: string): Promise<RoomParticipant | null> {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const participant = await client.video.v1
        .rooms(roomSid)
        .participants(participantSid)
        .fetch();

      return {
        sid: participant.sid,
        identity: participant.identity,
        status: participant.status as 'connected' | 'disconnected',
        joinedAt: participant.dateCreated,
        leftAt: participant.dateUpdated,
      };
    } catch (error) {
      console.error('Error fetching participant:', error);
      return null;
    }
  }

  /**
   * Disconnect a participant from a room
   */
  static async disconnectParticipant(roomSid: string, participantSid: string): Promise<boolean> {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      await client.video.v1
        .rooms(roomSid)
        .participants(participantSid)
        .update({ status: 'disconnected' });

      return true;
    } catch (error) {
      console.error('Error disconnecting participant:', error);
      return false;
    }
  }

  /**
   * Complete a room (end the video session)
   */
  static async completeRoom(roomSid: string): Promise<boolean> {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      await client.video.v1.rooms(roomSid).update({ status: 'completed' });
      return true;
    } catch (error) {
      console.error('Error completing room:', error);
      return false;
    }
  }

  /**
   * Check if a room exists
   */
  static async roomExists(roomName: string): Promise<boolean> {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const rooms = await client.video.v1.rooms.list({
        uniqueName: roomName,
        status: 'in-progress',
      });

      return rooms.length > 0;
    } catch (error) {
      console.error('Error checking room existence:', error);
      return false;
    }
  }

  /**
   * Get active rooms for a specific challenge/team
   */
  static async getActiveRooms(): Promise<RoomInfo[]> {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const rooms = await client.video.v1.rooms.list({
        status: 'in-progress',
      });

      const roomInfos: RoomInfo[] = [];

      for (const room of rooms) {
        const participants = await this.getRoomParticipants(room.sid);
        roomInfos.push({
          sid: room.sid,
          name: room.uniqueName || room.sid,
          status: room.status as 'in-progress' | 'completed' | 'failed',
          participants,
          createdAt: room.dateCreated,
          dateUpdated: room.dateUpdated,
        });
      }

      return roomInfos;
    } catch (error) {
      console.error('Error fetching active rooms:', error);
      return [];
    }
  }

  /**
   * Validate Twilio credentials
   */
  static async validateCredentials(): Promise<boolean> {
    if (!accountSid || !authToken) {
      return false;
    }

    try {
      // Try to list rooms to validate credentials
      await client.video.v1.rooms.list({ limit: 1 });
      return true;
    } catch (error) {
      console.error('Twilio credentials validation failed:', error);
      return false;
    }
  }
} 