const axios = require('axios');

async function testPdfGeneration() {
    console.log('Testing PDF Generation...');
    try {
        const response = await axios.post('http://localhost:3001/api/markdown-to-pdf', {
            title: 'Test Document',
            content: '# Heading\n\nSome test content.'
        });
        console.log('✅ Success:', response.status);
        console.log('URL:', response.data.pdfUrl);
    } catch (error) {
        console.error('❌ Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testPdfGeneration();
