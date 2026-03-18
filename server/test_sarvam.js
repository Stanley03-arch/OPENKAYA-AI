const axios = require('axios');

async function testSarvamTTS() {
    const apiKey = 'sk_9wcb2zq5_9m5mcCnVK65snCPOUP1N8iGP';
    const url = 'https://api.sarvam.ai/text-to-speech';

    const data = {
        inputs: ["Hello, this is a test of the Sarvam AI Text to Speech API."],
        target_language_code: "hi-IN", // Hindi (Indian)
        speaker: "shubh",
        pace: 1.0,
        speech_sample_rate: 16000,
        enable_preprocessing: false,
        model: "bulbul:v3"
    };

    try {
        console.log('Testing Sarvam AI TTS API...');
        const response = await axios.post(url, data, {
            headers: {
                'api-subscription-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            console.log('Success! API Key is valid.');
            console.log('Response data received (audio content length):', response.data.audios ? response.data.audios[0].length : 'N/A');
        } else {
            console.log('Unexpected response status:', response.status);
        }
    } catch (error) {
        console.error('Error testing Sarvam AI API:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testSarvamTTS();
