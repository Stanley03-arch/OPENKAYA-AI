const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_KEYS.split(',')[0];

async function listModels() {
    try {
        console.log('Fetching available models...');
        // Try v1beta
        console.log('\n--- v1beta ---');
        try {
            const response = await axios.get(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );
            const models = response.data.models;
            if (models) {
                models.forEach(model => {
                    if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`✅ ${model.name} (supports generateContent)`);
                    } else {
                        console.log(`❌ ${model.name} (no generateContent)`);
                    }
                });
            } else {
                console.log('No models found in response.');
            }
        } catch (e) {
            console.log('Error fetching v1beta:', e.message);
        }

        // Try v1
        console.log('\n--- v1 ---');
        try {
            const response = await axios.get(
                `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
            );
            const models = response.data.models;
            if (models) {
                models.forEach(model => {
                    if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`✅ ${model.name} (supports generateContent)`);
                    } else {
                        console.log(`❌ ${model.name} (no generateContent)`);
                    }
                });
            } else {
                console.log('No models found in response.');
            }
        } catch (e) {
            console.log('Error fetching v1:', e.message);
        }

    } catch (error) {
        console.error('Fatal Error:', error.message);
    }
}

listModels();
