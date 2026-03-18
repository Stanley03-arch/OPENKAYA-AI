const axios = require('axios');

class SarvamService {
    constructor(apiKey) {
        this.apiKey = Array.isArray(apiKey) ? apiKey[0] : apiKey;
        this.baseUrl = 'https://api.sarvam.ai';
    }

    /**
     * Converts text to speech using Sarvam AI Bulbul v3 model.
     * @param {string} text The text to convert.
     * @param {string} languageCode The language code (e.g., 'hi-IN', 'bn-IN', 'en-IN').
     * @param {string} speaker The speaker name (e.g., 'shubh', 'meera').
     * @returns {Promise<string[]>} Array of base64 encoded audio strings.
     */
    async textToSpeech(text, languageCode = 'hi-IN', speaker = 'shubh') {
        const url = `${this.baseUrl}/text-to-speech`;
        const data = {
            inputs: [text],
            target_language_code: languageCode,
            speaker: speaker,
            pace: 1.0,
            sample_rate: 16000,
            model: "bulbul:v3"
        };

        console.log('🤖 Sarvam TTS Payload:', JSON.stringify(data, null, 2));

        try {
            const response = await axios.post(url, data, {
                headers: {
                    'api-subscription-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data.audios) {
                return response.data.audios;
            } else {
                throw new Error(`Sarvam TTS failed with status ${response.status}`);
            }
        } catch (error) {
            console.error('Sarvam TTS Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Converts speech to text using Sarvam AI ASR.
     * @param {string} audioBase64 Base64 encoded audio file.
     * @param {string} languageCode The language code (e.g., 'hi-IN', 'en-IN', 'bn-IN').
     * @returns {Promise<string>} Transcribed text.
     */
    async speechToText(audioBase64, languageCode = 'en-IN') {
        const FormData = require('form-data');
        const { Readable } = require('stream');

        const url = `${this.baseUrl}/speech-to-text`;

        const form = new FormData();
        // Convert base64 to buffer and then to a readable stream for form-data
        const buffer = Buffer.from(audioBase64, 'base64');
        const stream = Readable.from(buffer);

        form.append('file', stream, {
            filename: 'audio.wav',
            contentType: 'audio/wav'
        });
        form.append('language_code', languageCode);
        form.append('model', "saaras:v3");

        try {
            const response = await axios.post(url, form, {
                headers: {
                    'api-subscription-key': this.apiKey,
                    ...form.getHeaders()
                }
            });

            if (response.status === 200 && response.data.transcript) {
                return response.data.transcript;
            } else {
                throw new Error(`Sarvam STT failed with status ${response.status}`);
            }
        } catch (error) {
            console.error('Sarvam STT Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Detects language from text and returns appropriate Sarvam language code.
     * @param {string} text The text to analyze.
     * @returns {string} Sarvam language code.
     */
    detectLanguageCode(text) {
        const lowerText = text.toLowerCase();

        // Check for Indian languages
        if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Hindi/Devanagari
        if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'; // Bengali
        if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada
        if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'; // Malayalam
        if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
        if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
        if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'; // Gujarati
        if (/[\u0A00-\u0A7F]/.test(text)) return 'pa-IN'; // Punjabi

        // Default to English for all other languages
        return 'en-IN';
    }
}

module.exports = SarvamService;
