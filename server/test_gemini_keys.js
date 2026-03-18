const axios = require('axios');
require('dotenv').config();

const geminiKeys = process.env.GEMINI_KEYS.split(',');

async function testGeminiKey(apiKey, index) {
    try {
        console.log(`\n🔍 Testing Gemini Key #${index + 1}...`);
        console.log(`Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{ text: 'Say "Hello" in one word.' }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const reply = response.data.candidates[0].content.parts[0].text;
        console.log(`✅ Key #${index + 1} is WORKING`);
        console.log(`Response: ${reply}`);
        return { index: index + 1, status: 'WORKING', response: reply };
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.error?.message || error.message;

            if (status === 429) {
                console.log(`❌ Key #${index + 1} - RATE LIMITED (429)`);
                console.log(`Message: ${message}`);
                return { index: index + 1, status: 'RATE_LIMITED', error: message };
            } else if (status === 400) {
                console.log(`❌ Key #${index + 1} - BAD REQUEST (400)`);
                console.log(`Message: ${message}`);
                return { index: index + 1, status: 'BAD_REQUEST', error: message };
            } else if (status === 401 || status === 403) {
                console.log(`❌ Key #${index + 1} - INVALID/UNAUTHORIZED (${status})`);
                console.log(`Message: ${message}`);
                return { index: index + 1, status: 'INVALID', error: message };
            } else {
                console.log(`❌ Key #${index + 1} - ERROR (${status})`);
                console.log(`Message: ${message}`);
                return { index: index + 1, status: 'ERROR', error: message };
            }
        } else {
            console.log(`❌ Key #${index + 1} - NETWORK ERROR`);
            console.log(`Error: ${error.message}`);
            return { index: index + 1, status: 'NETWORK_ERROR', error: error.message };
        }
    }
}

async function testAllKeys() {
    console.log('🚀 Testing all Gemini API keys...');
    console.log(`Total keys to test: ${geminiKeys.length}\n`);
    console.log('='.repeat(60));

    const results = [];

    for (let i = 0; i < geminiKeys.length; i++) {
        const result = await testGeminiKey(geminiKeys[i].trim(), i);
        results.push(result);

        // Wait 1 second between tests to avoid triggering rate limits
        if (i < geminiKeys.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(60));

    const working = results.filter(r => r.status === 'WORKING');
    const rateLimited = results.filter(r => r.status === 'RATE_LIMITED');
    const invalid = results.filter(r => r.status === 'INVALID');
    const badRequest = results.filter(r => r.status === 'BAD_REQUEST');
    const errors = results.filter(r => r.status === 'ERROR' || r.status === 'NETWORK_ERROR');

    console.log(`✅ Working keys: ${working.length}/${geminiKeys.length}`);
    if (working.length > 0) {
        console.log(`   Keys: ${working.map(r => `#${r.index}`).join(', ')}`);
    }

    console.log(`⏳ Rate limited keys: ${rateLimited.length}/${geminiKeys.length}`);
    if (rateLimited.length > 0) {
        console.log(`   Keys: ${rateLimited.map(r => `#${r.index}`).join(', ')}`);
    }

    console.log(`❌ Invalid keys: ${invalid.length}/${geminiKeys.length}`);
    if (invalid.length > 0) {
        console.log(`   Keys: ${invalid.map(r => `#${r.index}`).join(', ')}`);
    }

    console.log(`⚠️  Bad request keys: ${badRequest.length}/${geminiKeys.length}`);
    if (badRequest.length > 0) {
        console.log(`   Keys: ${badRequest.map(r => `#${r.index}`).join(', ')}`);
    }

    console.log(`⚠️  Error keys: ${errors.length}/${geminiKeys.length}`);
    if (errors.length > 0) {
        console.log(`   Keys: ${errors.map(r => `#${r.index}`).join(', ')}`);
    }

    console.log('='.repeat(60));
}

testAllKeys().catch(console.error);
