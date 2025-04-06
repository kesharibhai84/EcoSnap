const crypto = require('crypto');
const axios = require('axios');
const { walletConfig } = require('../../config/walletConfig');

class MidnightService {
    constructor() {
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'your-secret-key';
        this.config = walletConfig;
    }

    async storeProductData(productData) {
        try {
            // Encrypt the data
            const encryptedData = this.encryptData(productData);
            
            // Generate proof
            const proof = this.generateProof(encryptedData);
            
            // Store on Midnight network
            const response = await axios.post(
                `${this.config.api.baseUrl}${this.config.api.endpoints.store}`,
                {
                    data: encryptedData,
                    proof: proof,
                    contractAddress: this.config.contracts.productRegistry
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.MIDNIGHT_API_KEY}`
                    }
                }
            );

            return {
                midnightId: response.data.midnightId,
                proof: proof,
                encryptedData: encryptedData
            };
        } catch (error) {
            console.error('Error storing data on Midnight:', error);
            throw new Error('Failed to store data on Midnight network');
        }
    }

    async verifyProductData(midnightId, proof) {
        try {
            const response = await axios.post(
                `${this.config.api.baseUrl}${this.config.api.endpoints.verify}`,
                {
                    midnightId,
                    proof,
                    contractAddress: this.config.contracts.productRegistry
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.MIDNIGHT_API_KEY}`
                    }
                }
            );

            return response.data.verified;
        } catch (error) {
            console.error('Error verifying data on Midnight:', error);
            throw new Error('Failed to verify data on Midnight network');
        }
    }

    async retrieveProductData(midnightId) {
        try {
            const response = await axios.get(
                `${this.config.api.baseUrl}${this.config.api.endpoints.retrieve}/${midnightId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.MIDNIGHT_API_KEY}`
                    }
                }
            );

            // Decrypt the data
            const decryptedData = this.decryptData(response.data.encryptedData);
            return decryptedData;
        } catch (error) {
            console.error('Error retrieving data from Midnight:', error);
            throw new Error('Failed to retrieve data from Midnight network');
        }
    }

    // Helper methods
    encryptData(data) {
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decryptData(encryptedData) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }

    generateProof(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = new MidnightService(); 