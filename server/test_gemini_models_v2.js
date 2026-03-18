const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_KEYS.split(',')[0];
const models = [
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-1.5-flash'
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
            break;
        }
    }
}

runTests();
