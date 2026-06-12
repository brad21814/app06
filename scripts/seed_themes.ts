import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
    initializeApp({
        projectId: process.env.GCLOUD_PROJECT || 'komandra-app06',
    });
}

const db = getFirestore();

const STANDARD_THEMES = [
    {
        name: 'Team Building',
        description: 'Questions designed to strengthen team bonds and understanding.',
        questions: [
            "What is your clear definition of a successful team?",
            "What determines a successful team member?",
            "What is the most important quality of a team leader?",
            "How do you prefer to receive feedback?",
            "What is one skill you want to improve this year?",
            "What is your preferred working style?",
            "How do you handle conflict in a team?",
            "What motivates you to do your best work?",
            "What is the best team you have ever been a part of?",
            "What is one thing you appreciate about your current team?",
            "How do you like to celebrate wins?",
            "What is your biggest professional challenge right now?",
            "What is one thing you would change about our team communication?",
            "How do you prioritize your tasks?",
            "What is your favorite way to decompress after work?",
            "What is the most valuable lesson you've learned in your career?",
            "What is one goal you have for the next month?",
            "How do you define work-life balance?",
            "What is one thing you are proud of accomplishing recently?",
            "What does 'trust' mean to you in a workplace context?"
        ]
    },
    {
        name: 'General Knowledge',
        description: 'Fun trivia and general knowledge questions to spark conversation.',
        questions: [
            "What is the capital of Australia?",
            "Who wrote '1984'?",
            "What is the chemical symbol for Gold?",
            "What is the largest planet in our solar system?",
            "In what year did the Titanic sink?",
            "Who painted the Mona Lisa?",
            "What is the hardest natural substance on Earth?",
            "How many continents are there?",
            "What is the speed of light?",
            "Who discovered penicillin?",
            "What is the smallest prime number?",
            "What is the currency of Japan?",
            "Who was the first person to walk on the moon?",
            "What is the longest river in the world?",
            "What is the main ingredient in guacamole?",
            "How many bones are in the adult human body?",
            "What is the capital of Canada?",
            "Who wrote 'Romeo and Juliet'?",
            "What is the largest ocean on Earth?",
            "What is the boiling point of water at sea level?"
        ]
    },
    {
        name: 'Industry/Work',
        description: 'Discussions about industry trends, work habits, and professional growth.',
        questions: [
            "What is the biggest trend currently affecting our industry?",
            "How do you stay updated with industry news?",
            "What is one tool you couldn't work without?",
            "How do you see our industry evolving in the next 5 years?",
            "What is the biggest challenge facing our industry today?",
            "What is one piece of advice you would give to someone entering this field?",
            "How has technology changed your role in the last few years?",
            "What is the most innovative company in our space right now?",
            "What allows a company to stay competitive?",
            "How important is networking in our industry?",
            "What is a common misconception about our work?",
            "What is the most rewarding part of working in this industry?",
            "How do you balance innovation with stability?",
            "What is the role of automation in our future?",
            "How do you handle rapid changes in the market?",
            "What skill is becoming increasingly important in our field?",
            "How do you approach problem-solving in your work?",
            "What is the impact of remote work on our industry?",
            "How do you foster creativity in a corporate environment?",
            "What is the biggest risk you've taken professionally?"
        ]
    },
    {
        name: 'Fun/Social',
        description: 'Lighthearted questions about hobbies, preferences, and life outside work.',
        questions: [
            "What is your favorite movie of all time?",
            "If you could have dinner with any historical figure, who would it be?",
            "What is your go-to karaoke song?",
            "What is your favorite food?",
            "If you could travel anywhere in the world, where would you go?",
            "What is your favorite book?",
            "Do you have any hidden talents?",
            "What is your favorite season?",
            "If you were a superhero, what power would you have?",
            "What is the best concert you've ever been to?",
            "What is your favorite childhood memory?",
            "Do you prefer coffee or tea?",
            "What is your dream car?",
            "If you could live in any era, which would it be?",
            "What is your favorite board game?",
            "Do you have any pets?",
            "What is your favorite holiday?",
            "What is the best gift you've ever received?",
            "If you won the lottery, what is the first thing you would buy?",
            "What is your favorite way to spend a weekend?"
        ]
    }
];

async function seedThemes() {
    console.log('Seeding Standard Themes...');
    
    // Get existing system themes to avoid duplicates
    const existingThemesSnap = await db.collection('themes')
        .where('accountId', '==', null)
        .get();
    
    const existingNames = new Set(existingThemesSnap.docs.map(doc => doc.data().name));
    
    const batch = db.batch();
    let count = 0;

    for (const theme of STANDARD_THEMES) {
        if (existingNames.has(theme.name)) {
            console.log(`Theme "${theme.name}" already exists, skipping.`);
            continue;
        }

        const themeRef = db.collection('themes').doc();
        batch.set(themeRef, {
            accountId: null, // System theme
            name: theme.name,
            description: theme.description,
            questions: theme.questions,
            createdBy: 'system',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        count++;
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Successfully seeded ${count} new standard themes.`);
    } else {
        console.log('No new themes to seed.');
    }
}

async function main() {
    try {
        await seedThemes();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding themes:', error);
        process.exit(1);
    }
}

main();
