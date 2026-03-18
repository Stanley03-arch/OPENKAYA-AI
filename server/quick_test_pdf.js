const axios = require('axios');

async function quickTest() {
    console.log('🧪 Quick PDF Generation Test\n');

    try {
        const response = await axios.post('http://localhost:3001/api/generate-pdf', {
            title: 'Quick Test Document',
            content: `# Hello from Kaya AI!

This is a **quick test** of the PDF generation feature.

## Features Included:

- Markdown support
- Professional formatting
- Multi-page pagination
- Headers and footers

### Try it yourself!

Ask Kaya AI to generate a PDF and see the magic happen!
`
        });

        console.log('✅ SUCCESS!\n');
        console.log('📄 PDF Generated!');
        console.log('🔗 Download URL:', response.data.url);
        console.log('🆔 Document ID:', response.data.documentId);
        console.log('\n📥 Open this URL in your browser to view the PDF:');
        console.log(response.data.url);
        console.log('\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickTest();
