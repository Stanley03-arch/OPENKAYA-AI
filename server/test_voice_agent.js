const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001';

async function testVoiceAgent() {
    console.log('🎤 Starting Voice Agent Test...');

    try {
        // Step 0: Test server connectivity
        console.log('0️⃣ Checking Server Status...');
        try {
            const statusResponse = await axios.get(`${API_URL}/api/voice/test`);
            console.log('✅ Server Online:', statusResponse.data);
        } catch (e) {
            console.error('❌ Server Check Failed:', e.message);
            // Continue anyway to see specific error
        }

        // Step 1: Test TTS (Text-to-Speech)
        console.log('\n1️⃣ Testing TTS (Speak)...');
        const textToSpeak = "Hello, this is Kaya AI testing the voice system.";

        const ttsResponse = await axios.post(`${API_URL}/api/voice/speak`, {
            text: textToSpeak,
            languageCode: 'en-IN',
            speaker: 'kavya'
        });

        if (ttsResponse.data.audio) {
            console.log('✅ TTS Success! Audio received.');
            // console.log(`   Audio length: ${ttsResponse.data.audio.length} chars`);

            // Save to file for inspection if needed
            // fs.writeFileSync('test_audio.wav', Buffer.from(ttsResponse.data.audio, 'base64'));
        } else {
            console.error('❌ TTS Failed: No audio data received');
            return;
        }

        // Step 2: Test STT (Speech-to-Text) using the audio we just generated
        console.log('\n2️⃣ Testing STT (Transcribe)...');
        const audioBase64 = ttsResponse.data.audio;

        const sttResponse = await axios.post(`${API_URL}/api/voice/transcribe`, {
            audio: audioBase64,
            languageCode: 'en-IN'
        });

        if (sttResponse.data.transcript) {
            console.log(`✅ STT Success! Transcript received: "${sttResponse.data.transcript}"`);

            // Loose comparison
            if (sttResponse.data.transcript.toLowerCase().includes('testing')) {
                console.log('✅ Verification Passed: Transcript matches original intent.');
            } else {
                console.warn('⚠️ Verification Warning: Transcript might differ slightly from original.');
            }
        } else {
            console.error('❌ STT Failed: No transcript received');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
    }
}

testVoiceAgent();
