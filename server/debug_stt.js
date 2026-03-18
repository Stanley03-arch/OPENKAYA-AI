const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.SARVAM_AI_API_KEY;

async function debugSTT() {
    console.log('Testing Sarvam STT directly...');

    // We need some audio. Let's use a dummy base64 or a real file if available.
    // For now, I'll try to find a wav file or use a very short valid base64.

    const url = 'https://api.sarvam.ai/speech-to-text';
    const data = {
        audio: "UklGRiQAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=", // Very short invalid wav
        language_code: "en-IN",
        model: "saaras:v1"
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'api-subscription-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

debugSTT();
