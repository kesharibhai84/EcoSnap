export const walletConfig = {
    // Midnight Network Configuration
    network: {
        name: 'midnight',
        chainId: import.meta.env.VITE_MIDNIGHT_CHAIN_ID || '0x1',
        rpcUrl: import.meta.env.VITE_MIDNIGHT_RPC_URL || 'https://rpc.midnight.network',
    },
    
    // Wallet Configuration
    wallet: {
        name: import.meta.env.VITE_MIDNIGHT_WALLET_NAME || 'Midnight Wallet',
        icon: '/images/midnight-wallet-icon.png',
        description: 'Connect with Midnight Wallet for secure transactions',
    },
    
    // Contract Addresses
    contracts: {
        productRegistry: import.meta.env.VITE_MIDNIGHT_PRODUCT_REGISTRY || '0x...',
        carbonFootprint: import.meta.env.VITE_MIDNIGHT_CARBON_FOOTPRINT || '0x...',
    },
    
    // API Configuration
    api: {
        baseUrl: import.meta.env.VITE_MIDNIGHT_API_URL || 'https://api.midnight.network',
        endpoints: {
            verify: '/verify',
            store: '/store',
            retrieve: '/retrieve',
        },
    },
    
    // Default Gas Settings
    gas: {
        defaultGasLimit: 300000,
        defaultGasPrice: 20000000000, // 20 Gwei
    },
    
    // Error Messages
    errors: {
        network: 'Please connect to the Midnight network',
        wallet: 'Please install Midnight Wallet',
        transaction: 'Transaction failed',
    },
}; 