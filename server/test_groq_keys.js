const axios = require('axios');
require('dotenv').config();

const groqKeys = process.env.GROQ_KEYS.split(',');

async function testGroqKey(apiKey, index) {
    try {
        console.log(`\n🔍 Testing Groq Key #${index + 1}...`);
        console.log(`Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'user', content: 'Say "Hello" in one word.' }
            ],
            max_tokens: 10
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log(`✅ Key #${index + 1} is WORKING`);
        console.log(`Response: ${response.data.choices[0].message.content}`);
        return { index: index + 1, status: 'WORKING', response: response.data.choices[0].message.content };
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.error?.message || error.message;

            if (status === 429) {
                console.log(`❌ Key #${index + 1} - RATE LIMITED (429)`);
                console.log(`Message: ${message}`);
                return { index: index + 1, status: 'RATE_LIMITED', error: message };
            } else if (status === 401 || status === 403) {
                console.log(`❌ Key #${index + 1} - INVALID/UNAUTHORIZED (${status})`);
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
    console.log('🚀 Testing all Groq API keys...');
    console.log(`Total keys to test: ${groqKeys.length}\n`);
    console.log('='.repeat(60));

    const results = [];

    for (let i = 0; i < groqKeys.length; i++) {
        const result = await testGroqKey(groqKeys[i].trim(), i);
        results.push(result);

        // Wait 1 second between tests to avoid triggering rate limits
        if (i < groqKeys.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(60));

    const working = results.filter(r => r.status === 'WORKING');
    const rateLimited = results.filter(r => r.status === 'RATE_LIMITED');
    const invalid = results.filter(r => r.status === 'INVALID');
    const errors = results.filter(r => r.status === 'ERROR' || r.status === 'NETWORK_ERROR');

    console.log(`✅ Working keys: ${working.length}/${groqKeys.length}`);
    if (working.length > 0) {
        console.log(`   Keys: ${working.map(r => `#${r.index}`).join(', ')}`);
    }

    console.log(`⏳ Rate limited keys: ${rateLimited.length}/${groqKeys.length}`);
    if (rateLimited.length > 0) {
        console.log(`   Keys: ${rateLimited.map(r => `#${r.index}`).join(', ')}`);
    }

    console.log(`❌ Invalid keys: ${invalid.length}/${groqKeys.length}`);
    if (invalid.length > 0) {
        console.log(`   Keys: ${invalid.map(r => `#${r.index}`).join(', ')}`);
    }

    console.log(`⚠️  Error keys: ${errors.length}/${groqKeys.length}`);
    if (errors.length > 0) {
        console.log(`   Keys: ${errors.map(r => `#${r.index}`).join(', ')}`);
    }

    console.log('='.repeat(60));
}

testAllKeys().catch(console.error);
