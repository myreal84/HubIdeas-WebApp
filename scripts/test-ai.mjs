import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const apiKey = process.env.GOOGLE_GENERATION_AI_API_KEY;

console.log(`Checking Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);

if (!apiKey) {
    console.error('❌ GOOGLE_GENERATION_AI_API_KEY is missing in .env.staging');
    process.exit(1);
}

const google = createGoogleGenerativeAI({
    apiKey: apiKey,
});

async function testKey() {
    try {
        console.log('Attempting to generate text...');
        const { text } = await generateText({
            model: google('gemini-2.0-flash-lite'),
            prompt: 'Say "Hello, World!" if you can hear me.',
        });
        console.log('✅ Success! Response:', text);
    } catch (error) {
        console.error('❌ Error testing key:', error);
    }
}

testKey();
