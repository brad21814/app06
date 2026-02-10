import { VertexAI } from '@google-cloud/vertexai';
import { QuestionEvent } from '../../../types/firestore';

// Initialize Vertex AI
const project = process.env.GCLOUD_PROJECT || 'komandra-app06';
const location = 'us-central1';
const vertexAI = new VertexAI({ project: project, location: location });
const model = vertexAI.preview.getGenerativeModel({
    model: 'gemini-1.5-pro-preview-0409', // Or latest stable
    generationConfig: {
        'maxOutputTokens': 8192,
        'temperature': 0.5,
        'topP': 0.95,
    },
});

export interface AiAnalysisResult {
    summary: string;
    sentimentScore: number;
    interactionBalance: number;
    topics: string[];
    keyTakeaways: string[];
    vibeScore: string;
    questions: {
        question: string;
        sentiment: number;
        topics: string[];
    }[];
}

export class AiAnalysisService {

    static async analyzeConnection(transcriptText: string, questionEvents: QuestionEvent[]): Promise<AiAnalysisResult> {
        if (!transcriptText) {
            throw new Error("No transcript text provided for analysis.");
        }

        const prompt = `
        You are an expert relationship intelligence analyst. 
        Analyze the following transcript from a video connection between two colleagues.
        
        Context:
        - The goal is to build trust and connection in remote teams.
        - Questions asked during the session: ${JSON.stringify(questionEvents.map(q => q.question))}
        
        Transcript:
        "${transcriptText.substring(0, 50000)}" // Truncate if too long, though Gemini keeps huge context
        
        Output valid JSON with this exact schema:
        {
            "summary": "2-3 sentences summarizing the conversation flow.",
            "sentimentScore": 0-100 (integer, where 0 is negative, 100 is positive),
            "interactionBalance": 0-100 (integer, 50 means perfect balance between speakers),
            "topics": ["topic1", "topic2", ...],
            "keyTakeaways": ["point 1", "point 2", ...],
            "vibeScore": "Thriving" | "Neutral" | "Concern",
            "questions": [
                {
                    "question": "The question asked",
                    "sentiment": 0-100,
                    "topics": ["topic related to answer"]
                }
            ]
        }
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = result.response;
            if (!response.candidates || response.candidates.length === 0) throw new Error("No candidates generated");
            const candidate = response.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) throw new Error("No content parts generated");

            const text = candidate.content.parts[0].text;

            if (!text) throw new Error("No content generated");

            // Clean markdown code blocks if present
            const jsonStr = text.replace(/```json\n|\n```/g, "");
            return JSON.parse(jsonStr) as AiAnalysisResult;

        } catch (error) {
            console.error("AI Analysis Failed:", error);
            throw error;
        }
    }
}
