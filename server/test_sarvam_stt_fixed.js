const SarvamService = require('./sarvamService');
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.SARVAM_AI_API_KEY;

async function testSTT() {
    const sarvam = new SarvamService(API_KEY);

    // We need a valid audio. I'll use the one from the TTS test in test_voice_agent.js
    // but here I'll just use a dummy base64 and see if it STILL gives the "field required" error.
    // Actually, if it's form-data, it should at least hit the API.

    // Valid WAV header but empty data
    const dummyAudio = "UklGRiQAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

    console.log('Testing SarvamService.speechToText...');
    try {
        const transcript = await sarvam.speechToText(dummyAudio, 'en-IN');
        console.log('Transcript:', transcript);
    } catch (error) {
        console.error('STT Error:', error.response?.data || error.message);
    }
}

testSTT();
