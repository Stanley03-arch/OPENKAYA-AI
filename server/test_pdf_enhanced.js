const axios = require('axios');

/**
 * Test script for enhanced PDF generation
 * Tests markdown support, formatting, and API endpoints
 */

async function testBasicPDF() {
    console.log('\n📄 Testing Basic PDF Generation...\n');

    try {
        const response = await axios.post('http://localhost:3001/api/generate-pdf', {
            title: 'Test Document',
            content: `# Welcome to Kaya AI

This is a test document to verify PDF generation capabilities.

## Features Tested

- **Markdown Support**: Headers, bold, italic
- **Lists**: Bullet points and numbered lists
- **Formatting**: Proper spacing and typography

### Bullet List Example

* First item
* Second item
* Third item

### Numbered List Example

1. First step
2. Second step
3. Third step

## Code Example

Here's some inline code: \`console.log('Hello World')\`

## Conclusion

This PDF demonstrates the enhanced generation capabilities of Kaya AI!
`,
            options: {
                fontSize: 12,
                includeHeader: true,
                includeFooter: true,
                includePageNumbers: true
            }
        });

        console.log('✅ Basic PDF Generation: SUCCESS');
        console.log('📥 Download URL:', response.data.url);
        console.log('🆔 Document ID:', response.data.documentId);
        console.log('');

        return true;
    } catch (error) {
        console.error('❌ Basic PDF Generation: FAILED');
        console.error('Error:', error.response?.data || error.message);
        return false;
    }
}

async function testChatPDF() {
    console.log('\n💬 Testing Chat-based PDF Generation...\n');

    try {
        const response = await axios.post('http://localhost:3001/api/chat', {
            messages: [
                { role: 'user', content: 'Generate a PDF about artificial intelligence' }
            ],
            provider: 'groq'
        });

        if (response.data.pdfUrl) {
            console.log('✅ Chat PDF Generation: SUCCESS');
            console.log('📥 Download URL:', response.data.pdfUrl);
            console.log('💬 Reply:', response.data.reply);
            console.log('');
            return true;
        } else {
            console.log('⚠️  Chat PDF Generation: No PDF URL returned');
            console.log('Response:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Chat PDF Generation: FAILED');
        console.error('Error:', error.response?.data || error.message);
        return false;
    }
}

async function testLongContent() {
    console.log('\n📚 Testing Multi-page PDF (Long Content)...\n');

    const longContent = `# Long Document Test

## Introduction

This document tests the pagination and multi-page support of the PDF generator.

${'## Section\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n'.repeat(20)}

## Conclusion

This concludes the long document test.
`;

    try {
        const response = await axios.post('http://localhost:3001/api/generate-pdf', {
            title: 'Multi-page Test Document',
            content: longContent
        });

        console.log('✅ Multi-page PDF Generation: SUCCESS');
        console.log('📥 Download URL:', response.data.url);
        console.log('');
        return true;
    } catch (error) {
        console.error('❌ Multi-page PDF Generation: FAILED');
        console.error('Error:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('═══════════════════════════════════════════');
    console.log('  Kaya AI - Enhanced PDF Generation Tests  ');
    console.log('═══════════════════════════════════════════');

    const results = {
        basic: await testBasicPDF(),
        chat: await testChatPDF(),
        multipage: await testLongContent()
    };

    console.log('\n═══════════════════════════════════════════');
    console.log('              Test Summary                 ');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Basic PDF:      ${results.basic ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Chat PDF:       ${results.chat ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Multi-page PDF: ${results.multipage ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r);

    console.log('\n═══════════════════════════════════════════');
    console.log(allPassed ? '🎉 All tests PASSED!' : '⚠️  Some tests FAILED');
    console.log('═══════════════════════════════════════════\n');

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests();
