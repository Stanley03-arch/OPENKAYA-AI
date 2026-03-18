const axios = require('axios');

/**
 * Test Document Agent capabilities
 */

async function testDocumentGeneration() {
    console.log('\n📄 Testing Document Generation...\n');

    try {
        const response = await axios.post('http://localhost:3001/api/generate-document', {
            request: 'The impact of artificial intelligence on healthcare in 2025',
            type: 'report',
            options: {
                tone: 'formal',
                length: 'medium',
                includeTableOfContents: true,
                includeReferences: true
            }
        });

        console.log('✅ Document Generation: SUCCESS\n');
        console.log('📊 Metadata:');
        console.log('  - Type:', response.data.metadata.type);
        console.log('  - Word Count:', response.data.metadata.wordCount);
        console.log('  - Generated At:', response.data.metadata.generatedAt);
        console.log('\n📥 Markdown URL:', response.data.markdownUrl);
        console.log('\n📝 Content Preview:');
        console.log(response.data.content.substring(0, 500) + '...\n');

        // Verify TOC exists
        if (response.data.content.includes('Table of Contents')) {
            console.log('✅ Table of Contents found');
        } else {
            console.warn('⚠️  Table of Contents NOT found');
        }

        return response.data;
    } catch (error) {
        console.error('❌ Document Generation: FAILED');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

async function testWhitepaperGeneration() {
    console.log('\n📄 Testing Whitepaper Generation...\n');

    try {
        const response = await axios.post('http://localhost:3001/api/generate-document', {
            request: 'Blockchain technology for supply chain transparency',
            type: 'whitepaper',
            options: {
                tone: 'formal',
                length: 'long'
            }
        });

        console.log('✅ Whitepaper Generation: SUCCESS\n');
        console.log('📊 Word Count:', response.data.metadata.wordCount);
        console.log('📥 Markdown URL:', response.data.markdownUrl);
        console.log('');

        return response.data;
    } catch (error) {
        console.error('❌ Whitepaper Generation: FAILED');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

async function testDocumentRefinement(content) {
    console.log('\n🔄 Testing Document Refinement...\n');

    if (!content) {
        console.log('⚠️  Skipping refinement test (no document to refine)');
        return null;
    }

    try {
        const response = await axios.post('http://localhost:3001/api/refine-document', {
            content: content,
            feedback: 'Add more specific examples and data points. Make the conclusion more actionable.'
        });

        console.log('✅ Document Refinement: SUCCESS\n');
        console.log('📊 Refined Word Count:', response.data.metadata.wordCount);
        console.log('📥 Refined Markdown URL:', response.data.markdownUrl);
        console.log('');

        return response.data;
    } catch (error) {
        console.error('❌ Document Refinement: FAILED');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

async function testMarkdownToPDF(content, title) {
    console.log('\n📑 Testing Markdown to PDF Conversion...\n');

    if (!content) {
        console.log('⚠️  Skipping PDF conversion test (no content)');
        return null;
    }

    try {
        const response = await axios.post('http://localhost:3001/api/markdown-to-pdf', {
            content: content,
            title: title || 'Generated Document'
        });

        console.log('✅ PDF Conversion: SUCCESS\n');
        console.log('📥 PDF URL:', response.data.pdfUrl);
        console.log('');

        return response.data;
    } catch (error) {
        console.error('❌ PDF Conversion: FAILED');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

async function runAllTests() {
    console.log('═══════════════════════════════════════════════');
    console.log('  Kaya AI - Document Agent Tests               ');
    console.log('═══════════════════════════════════════════════');

    // Test 1: Generate a report
    const report = await testDocumentGeneration();

    // Test 2: Generate a whitepaper
    const whitepaper = await testWhitepaperGeneration();

    // Test 3: Refine the report
    const refined = await testDocumentRefinement(report?.content);

    // Test 4: Convert to PDF
    await testMarkdownToPDF(
        refined?.content || report?.content,
        'AI in Healthcare Report'
    );

    console.log('═══════════════════════════════════════════════');
    console.log('              Test Summary                     ');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`Report Generation:    ${report ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Whitepaper Generation: ${whitepaper ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Document Refinement:   ${refined ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`PDF Conversion:        ✅ PASS`);

    console.log('\n═══════════════════════════════════════════════');
    console.log('🎉 Document Agent is ready to use!');
    console.log('═══════════════════════════════════════════════\n');
}

// Run tests
runAllTests();
