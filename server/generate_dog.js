const axios = require('axios');

async function generateDogImage() {
    try {
        const res = await axios.post('http://localhost:3001/api/generate-image', {
            prompt: 'A cute friendly dog, photorealistic, high quality',
            width: 1024,
            height: 1024
        });
        console.log('\n✅ Image generated successfully!\n');
        console.log('Image URL:', res.data.imageUrl);
        console.log('\nYou can open this URL in your browser to view the dog image.\n');
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.error('Data:', e.response.data);
    }
}

generateDogImage();
