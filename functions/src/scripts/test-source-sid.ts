
import twilio from 'twilio';

// Expect env vars
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_INTELLIGENCE_SERVICE_SID;
const recordingSid = process.argv[2];

if (!accountSid || !authToken || !serviceSid || !recordingSid) {
    console.error("Usage: node test-source-sid.js <RecordingSid>");
    process.exit(1);
}

const client = twilio(accountSid, authToken);

async function testSourceSid() {
    try {
        console.log(`Attempting to create transcription using source_sid for: ${recordingSid}`);

        const transcript = await client.intelligence.v2.transcripts.create({
            serviceSid: serviceSid!,
            channel: {
                media_properties: {
                    source_sid: recordingSid
                }
            }
        });

        console.log(`Success! Transcript SID: ${transcript.sid}`);
        console.log(`Initial Status: ${transcript.status}`);

        // Poll for a bit to see if it fails immediately?
        // Usually it takes time, but let's see if 400 is thrown synchronously.

    } catch (error: any) {
        console.error("Failed to create transcription with source_sid:");
        console.error(error.message);
        if (error.code) console.error(`Code: ${error.code}`);
    }
}

testSourceSid();
