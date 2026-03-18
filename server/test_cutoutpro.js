const axios = require('axios');

/**
 * Test script for Cut Out Pro API integration
 * Tests all image processing endpoints
 */

const BASE_URL = 'http://localhost:3001';

// Test image URL (a sample portrait image)
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400';

async function testEndpoint(name, endpoint, data) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📍 Endpoint: ${endpoint}`);

    try {
        const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
            timeout: 60000 // 60 second timeout
        });

        console.log(`✅ Success: ${response.data.message}`);
        console.log(`📸 Image URL: ${response.data.imageUrl}`);
        console.log(`🆔 Image ID: ${response.data.imageId}`);

        return { success: true, data: response.data };
    } catch (error) {
        console.error(`❌ Failed: ${error.response?.data?.error || error.message}`);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting Cut Out Pro API Tests\n');
    console.log('='.repeat(60));

    const results = [];

    // Test 1: Background Removal
    results.push(await testEndpoint(
        'Background Removal',
        '/api/cutoutpro/remove-background',
        { imageUrl: TEST_IMAGE_URL }
    ));

    // Wait a bit between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Photo Enhancement
    results.push(await testEndpoint(
        'Photo Enhancement',
        '/api/cutoutpro/enhance-photo',
        { imageUrl: TEST_IMAGE_URL }
    ));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Cartoon Conversion
    results.push(await testEndpoint(
        'Cartoon Conversion',
        '/api/cutoutpro/cartoon',
        { imageUrl: TEST_IMAGE_URL }
    ));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Face Cutout
    results.push(await testEndpoint(
        'Face Cutout',
        '/api/cutoutpro/face-cutout',
        { imageUrl: TEST_IMAGE_URL }
    ));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${(successful / results.length * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\n⚠️  Some tests failed. This might be due to:');
        console.log('   - API rate limits');
        console.log('   - Invalid API key');
        console.log('   - Network issues');
        console.log('   - Service unavailability');
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
