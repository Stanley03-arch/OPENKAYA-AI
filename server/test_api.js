
const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:3001/api/chat', {
            messages: [{ role: 'user', content: 'Say hello!' }],
            provider: 'groq'
        });
        console.log('Response:', res.data);
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.error('Data:', e.response.data);
    }
}

test();
