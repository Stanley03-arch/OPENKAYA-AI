const axios = require('axios');

async function testImageGeneration() {
    try {
        const res = await axios.post('http://localhost:3001/api/generate-image', {
            prompt: 'A beautiful sunset over mountains',
            width: 512,
            height: 512
        });
        console.log('Image Generation Response:', res.data);
        console.log('Image URL:', res.data.imageUrl);
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.error('Data:', e.response.data);
    }
}

testImageGeneration();
