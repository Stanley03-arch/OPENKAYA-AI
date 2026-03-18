const fs = require('fs');
const path = require('path');

/**
 * Cut Out Pro API Service
 * Provides AI-powered image and video processing capabilities
 * Documentation: https://www.cutout.pro/api-documentation
 * Using native fetch (Node 18+) for reliable multipart/form-data handling
 */
class CutOutProService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Cut Out Pro API key is required');
        }
        this.apiKey = apiKey;
        this.baseUrl = 'https://www.cutout.pro/api/v1';

        // API endpoints for different services
        this.endpoints = {
            removeBackground: '/matting', // standard
            enhancePhoto: '/photoEnhancer',
            colorize: '/colorize',
            cartoonSelfie: '/cartoonSelfie',
            imageRetouch: '/imageRetouch',
            faceCutout: '/faceCutout',
            aiArt: '/aiArt',
            imageToVideo: '/image2Video'
        };
        console.log(`🔑 Cut Out Pro Service initialized with key: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    }

    /**
     * Helper method to make API requests using native fetch
     * @private
     */
    async makeRequest(endpoint, imageData, additionalParams = {}) {
        try {
            const formData = new global.FormData();

            // Handle image representation
            if (typeof imageData === 'string') {
                if (imageData.startsWith('http')) {
                    formData.append('imageUrl', imageData);
                } else if (imageData.includes('base64,')) {
                    // Extract base64 part if it's a data URL
                    const base64Content = imageData.split('base64,')[1];
                    formData.append('base64', base64Content);
                } else {
                    // Raw base64 or other string data
                    formData.append('base64', imageData);
                }
            } else if (Buffer.isBuffer(imageData)) {
                // Buffer to Blob for native fetch
                const blob = new Blob([imageData]);
                formData.append('file', blob, 'image.png');
            }

            // Add additional parameters
            Object.keys(additionalParams).forEach(key => {
                formData.append(key, additionalParams[key]);
            });

            console.log(`🚀 Sending request to Cut Out Pro: ${this.baseUrl}${endpoint}`);

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'APIKEY': this.apiKey
                },
                body: formData
            });

            const contentType = response.headers.get('content-type') || '';
            console.log(`📡 Response Status: ${response.status}, Content-Type: ${contentType}`);

            if (!response.ok) {
                let errorDetails;
                try {
                    const text = await response.text();
                    try {
                        errorDetails = JSON.parse(text);
                    } catch (e) {
                        errorDetails = { message: text || `HTTP ${response.status}` };
                    }
                } catch (e) {
                    errorDetails = { message: `HTTP ${response.status}` };
                }
                console.error(`❌ Cut Out Pro API Error (${endpoint}):`, errorDetails);
                return {
                    success: false,
                    error: errorDetails.msg || errorDetails.message || `HTTP ${response.status}`,
                    statusCode: response.status
                };
            }

            // Handle binary response (image)
            if (contentType.includes('image/')) {
                console.log(`🖼️ Received binary image response`);
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                return {
                    success: true,
                    data: {
                        data: {
                            imageBase64: base64
                        }
                    }
                };
            }

            // Handle JSON response
            const text = await response.text();
            if (!text) {
                return {
                    success: true,
                    data: { data: {} } // Empty success
                };
            }

            try {
                const result = JSON.parse(text);
                return {
                    success: true,
                    data: result
                };
            } catch (e) {
                console.error(`❌ Non-JSON success response:`, text.substring(0, 100));
                return {
                    success: false,
                    error: 'Received invalid JSON from API'
                };
            }

        } catch (error) {
            console.error(`❌ Request Exception (${endpoint}):`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove background from image
     */
    async removeBackground(imageData, options = {}) {
        const params = {
            mattingType: options.mattingType || 2, // 1=general, 2=human, 3=product
            ...options
        };

        const result = await this.makeRequest(this.endpoints.removeBackground, imageData, params);

        if (result.success && result.data?.data?.imageBase64) {
            return {
                success: true,
                imageBase64: result.data.data.imageBase64,
                message: 'Background removed successfully'
            };
        }

        return result;
    }

    /**
     * Enhance and upscale photo
     */
    async enhancePhoto(imageData, options = {}) {
        const params = {
            sync: 1, // Always sync for simple interface
            ...options
        };

        const result = await this.makeRequest(this.endpoints.enhancePhoto, imageData, params);

        if (result.success && result.data?.data?.imageBase64) {
            return {
                success: true,
                imageBase64: result.data.data.imageBase64,
                message: 'Photo enhanced successfully'
            };
        }

        return result;
    }

    /**
     * Colorize black and white photo
     */
    async colorizePhoto(imageData) {
        const result = await this.makeRequest(this.endpoints.colorize, imageData);

        if (result.success && result.data?.data?.imageBase64) {
            return {
                success: true,
                imageBase64: result.data.data.imageBase64,
                message: 'Photo colorized successfully'
            };
        }

        return result;
    }

    /**
     * Convert photo to cartoon style
     */
    async cartoonSelfie(imageData, options = {}) {
        const params = {
            cartoonType: options.cartoonType || 'anime',
            ...options
        };

        const result = await this.makeRequest(this.endpoints.cartoonSelfie, imageData, params);

        if (result.success && result.data?.data?.imageBase64) {
            return {
                success: true,
                imageBase64: result.data.data.imageBase64,
                message: 'Cartoon conversion successful'
            };
        }

        return result;
    }

    /**
     * Extract face from image
     */
    async faceCutout(imageData) {
        const result = await this.makeRequest(this.endpoints.faceCutout, imageData);

        if (result.success && result.data?.data?.imageBase64) {
            return {
                success: true,
                imageBase64: result.data.data.imageBase64,
                message: 'Face extracted successfully'
            };
        }

        return result;
    }

    /**
     * Generate artistic style from photo
     */
    async generateAiArt(imageData, options = {}) {
        const params = {
            style: options.style || 'water-color',
            ...options
        };

        const result = await this.makeRequest(this.endpoints.aiArt, imageData, params);

        if (result.success && result.data?.data?.imageBase64) {
            return {
                success: true,
                imageBase64: result.data.data.imageBase64,
                message: 'AI Art generated successfully'
            };
        }

        return result;
    }

    /**
     * Helper: Save base64 image to file
     */
    saveBase64ToFile(base64, outputPath) {
        try {
            const buffer = Buffer.from(base64, 'base64');
            fs.writeFileSync(outputPath, buffer);
            console.log(`✅ Image saved to: ${outputPath}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to save image:', error.message);
            return false;
        }
    }
}

module.exports = CutOutProService;
