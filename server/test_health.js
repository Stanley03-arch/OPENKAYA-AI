const axios = require('axios');
const FormData = require('form-data');

async function checkHealth() {
    console.log('🏥 Checking server health...');
    try {
        const response = await axios.get('http://localhost:3001/health', { timeout: 2000 });
        console.log('✅ Health Check: UP');
    } catch (error) {
        console.error('❌ Health Check: DOWN', error.message);
    }

    console.log('\n🎙️ Checking Voice Endpoint (/api/speak)...');
    try {
        const response = await axios.post('http://localhost:3001/api/speak', {}, {
            validateStatus: status => true
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        if (response.status === 400) {
            console.log('✅ Voice Agent Active (Returned 400 for missing text)');
        } else if (response.status === 503) {
            console.error('❌ Voice Agent Disabled (Returned 503 - API Key missing/invalid?)');
        } else {
            console.log(`⚠️  Unexpected status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Voice Check Failed:', error.message);
    }
}

checkHealth();
