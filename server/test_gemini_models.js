const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_KEYS.split(',')[0]; // Use the first key for testing
const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro-001',
    'gemini-1.0-pro',
    'gemini-1.0-pro-latest',
    'gemini-1.0-pro-001',
    'gemini-pro'
];

async function testModel(modelName) {
    try {
        console.log(`Testing model: ${modelName}...`);
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{ text: 'Say "Hello"' }]
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            }
        );
        console.log(`✅ ${modelName}: WORKING`);
        return modelName;
    } catch (error) {
        console.log(`❌ ${modelName}: FAILED (${error.response?.status || error.message}) - ${error.response?.data?.error?.message || ''}`);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Testing Gemini Models...\n');
    for (const model of models) {
        const result = await testModel(model);
        if (result) {
            console.log(`\n🎉 Found working model: ${result}`);
            break; // Stop after finding the first working model
        }
    }
}

runTests();
