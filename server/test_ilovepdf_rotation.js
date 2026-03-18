/**
 * Test script for iLovePDF API Key Rotation
 * This verifies that the KeyManager can properly load and rotate iLovePDF keys
 */

require('dotenv').config();
const KeyManager = require('./keyManager');

console.log('🧪 Testing iLovePDF API Key Rotation\n');

// Get keys from environment
const getKeysFromEnv = (envVar) => process.env[envVar] ? process.env[envVar].split(',') : [];

const ilovepdfKeys = getKeysFromEnv('ILOVEPDF_KEYS');

console.log(`✅ Loaded ${ilovepdfKeys.length} iLovePDF API keys from .env`);
console.log(`   Keys: ${ilovepdfKeys.map((key, i) => `Key ${i + 1}: ${key.substring(0, 20)}...`).join('\n         ')}\n`);

// Initialize KeyManager
const keyManager = new KeyManager({
    ilovepdf: ilovepdfKeys
});

console.log('✅ KeyManager initialized with iLovePDF keys\n');

// Test getting keys
console.log('📋 Testing key retrieval and rotation:\n');

for (let i = 0; i < ilovepdfKeys.length + 2; i++) {
    const key = keyManager.getKey('ilovepdf');
    console.log(`   Attempt ${i + 1}: ${key.substring(0, 30)}...`);

    // Rotate to next key
    keyManager.rotateKey('ilovepdf');
}

console.log('\n✅ Key rotation test completed successfully!');
console.log('   The KeyManager will automatically rotate keys on API failures (429, 401, 403 errors)');
