const express = require('express');
const router = express.Router();
const midnightService = require('../services/midnightService');

// Demo endpoint to show how Midnight works
router.get('/midnight-demo', async (req, res) => {
    try {
        // Sample product data
        const sampleProductData = {
            ingredients: ['Organic Cotton', 'Recycled Polyester'],
            packagingDetails: {
                materials: ['Biodegradable Plastic', 'Recycled Paper'],
                recyclable: true,
                description: 'Eco-friendly packaging'
            },
            carbonFootprint: {
                score: 85,
                details: {
                    manufacturing: { score: 90, explanation: 'Renewable energy used' },
                    transportation: { score: 80, explanation: 'Local distribution' },
                    packaging: { score: 85, explanation: 'Minimal packaging' },
                    lifecycle: { score: 80, explanation: 'Long product lifespan' }
                }
            }
        };

        // Step 1: Store the data (encryption and proof generation)
        const storageResult = await midnightService.storeProductData(sampleProductData);
        
        // Step 2: Verify the data
        const verificationResult = await midnightService.verifyProductData(
            storageResult.midnightId,
            storageResult.proof
        );

        // Step 3: Retrieve the data
        const retrievedData = await midnightService.retrieveProductData(storageResult.midnightId);

        // Prepare the demonstration response
        const demoResponse = {
            originalData: sampleProductData,
            storageProcess: {
                midnightId: storageResult.midnightId,
                proof: storageResult.proof,
                encryptedData: storageResult.encryptedData
            },
            verification: {
                success: verificationResult,
                message: verificationResult ? 'Data integrity verified' : 'Verification failed'
            },
            retrievedData: retrievedData
        };

        res.json({
            message: 'Midnight Integration Demo',
            timestamp: new Date().toISOString(),
            demo: demoResponse
        });
    } catch (error) {
        console.error('Demo error:', error);
        res.status(500).json({
            message: 'Error in demonstration',
            error: error.message
        });
    }
});

module.exports = router; 