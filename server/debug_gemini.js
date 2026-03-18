const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function debugGemini() {
    console.log('🔍 Debugging Gemini API Connection...\n');

    // 1. Check API Key
    const rawKey = process.env.GEMINI_KEYS;
    if (!rawKey) {
        console.error('❌ GEMINI_KEYS env var is missing');
        return;
    }

    const keys = rawKey.split(',');
    const apiKey = keys[0].trim();

    console.log(`🔑 Key found: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`📏 Length: ${apiKey.length}`);

    // 2. Call List Models API directly
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log('\n📡 Calling List Models API...');
    try {
        const response = await axios.get(url);
        console.log('✅ API Call Successful!');

        const models = response.data.models;
        console.log(`\n📋 Found ${models.length} models:`);

        models.forEach(m => {
            if (m.name.includes('gemini')) {
                console.log(`- ${m.name} (${m.displayName})`);
            }
        });

    } catch (error) {
        console.error('❌ API Call Failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

debugGemini();
