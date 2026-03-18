const axios = require('axios');

async function testIntegratedTTS() {
    const url = 'http://localhost:3001/api/tts';
    const data = {
        text: "This is a test of the integrated Sarvam AI Text to Speech endpoint.",
        languageCode: "en-IN",
        speaker: "shubh"
    };

    try {
        console.log('Testing integrated Sarvam AI TTS endpoint...');
        const response = await axios.post(url, data);

        if (response.status === 200 && response.data.audios) {
            console.log('Success! Endpoint is working.');
            console.log('Received audio base64 length:', response.data.audios[0].length);
        } else {
            console.log('Unexpected response:', response.status, response.data);
        }
    } catch (error) {
        console.error('Error testing integrated TTS:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testIntegratedTTS();
