const axios = require('axios');

async function testAutoImageGeneration() {
    try {
        console.log('Testing automatic image generation in chat...\n');

        const res = await axios.post('http://localhost:3001/api/chat', {
            messages: [
                { role: 'user', content: 'Generate an image of a beautiful sunset over the ocean' }
            ],
            provider: 'groq'
        });

        console.log('✅ Response received!\n');
        console.log('Reply:', res.data.reply);

        if (res.data.imageUrl) {
            console.log('\n🎨 Image URL:', res.data.imageUrl);
            console.log('✅ Automatic image generation working!');
        }
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.error('Data:', e.response.data);
    }
}

testAutoImageGeneration();
