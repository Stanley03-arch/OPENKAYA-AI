const axios = require('axios');

// Example text to convert to PDF
const sampleText = `# Converting Text to PDF with Kaya AI

## Overview

Kaya AI has built-in PDF generation capabilities that make it easy to convert any text or markdown into a professional PDF document.

## Features

- **Markdown Support**: Use headers, lists, bold, italic, and more
- **Professional Formatting**: Automatic headers, footers, and page numbers
- **Multi-page Documents**: Handles long content with automatic pagination
- **Easy to Use**: Simple API call or chat command

## How to Use

### Method 1: API Call
Simply send your text to the /api/generate-pdf endpoint.

### Method 2: Chat Interface
Ask Kaya AI: "Generate a PDF about [your topic]"

### Method 3: Export Button
Click the "Export PDF" button to save your conversation.

## Benefits

- ✅ No need for Word or Google Docs
- ✅ No online conversion tools required
- ✅ Professional formatting automatically applied
- ✅ Instant download

## Conclusion

With Kaya AI's PDF generation, you can convert any text to a professional PDF in seconds!
`;

async function convertTextToPDF() {
    console.log('📄 Converting text to PDF using Kaya AI...\n');

    try {
        const response = await axios.post('http://localhost:3001/api/generate-pdf', {
            title: 'Converting Text to PDF with Kaya AI',
            content: sampleText
        });

        console.log('✅ SUCCESS!\n');
        console.log('📥 Your PDF is ready!');
        console.log('🔗 Download URL:', response.data.url);
        console.log('\n💡 Open this URL in your browser to view/download the PDF\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

convertTextToPDF();
