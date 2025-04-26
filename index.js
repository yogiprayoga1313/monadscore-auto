require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');
const moment = require('moment');

class MonadscoreBot {
    constructor(privateKey, apiUrl) {
        this.provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.walletAddress = this.wallet.address;
        this.apiUrl = 'https://mscore-production.up.railway.app';
        this.token = process.env.JWT_TOKEN;
        if (!this.token) {
            throw new Error('JWT_TOKEN not found in environment variables');
        }
        this.maxRetries = 5;
        this.retryDelay = 3000;
        this.isRunning = false;
        this.lastCheckIn = null;
        this.checkedInToday = false;
        this.lastPoints = 0;
    }

    async signStartMessage() {
        try {
            console.log('Signing start message...');
            const messageToSign = `Sign this message to verify ownership and start mining on monad score!\n\n${this.walletAddress} `;
            console.log('Message to sign:', messageToSign);
            
            const signature = await this.wallet.signMessage(messageToSign);
            console.log('Message signed successfully');
            return signature;
        } catch (error) {
            console.error('Error signing message:', error.message);
            return null;
        }
    }

    async startNode(retryCount = 0) {
        try {
            console.log('Starting node...');
            
            const signature = await this.signStartMessage();
            if (!signature) {
                throw new Error('Failed to sign start message');
            }

            const currentTime = Date.now();
            const response = await axios({
                method: 'put',
                url: `${this.apiUrl}/user/update-start-time`,
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'authorization': `Bearer ${this.token}`,
                    'content-type': 'application/json',
                    'dnt': '1',
                    'origin': 'https://monadscore.xyz',
                    'priority': 'u=1, i',
                    'referer': 'https://monadscore.xyz/',
                    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
                },
                data: {
                    wallet: this.walletAddress,
                    startTime: currentTime,
                    signature: signature
                }
            });

            if (response.data.success) {
                console.log('✓ Node started successfully!');
                return true;
            }
            console.error('Start node failed:', response.data);
            return false;
        } catch (error) {
            console.error('Error starting node:', error.message);
            if (error.response?.data) {
                console.error('API Response:', error.response.data);
                
                if (error.response.data.message === 'Invalid or expired token.') {
                    throw new Error('JWT Token expired. Please update JWT_TOKEN in .env file');
                }
            }

            if ((error.response?.status === 502 || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') && retryCount < this.maxRetries) {
                const waitTime = Math.min(Math.pow(2, retryCount) * this.retryDelay, 30000);
                console.log(`Server error, retrying in ${waitTime/1000} seconds... (Attempt ${retryCount + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.startNode(retryCount + 1);
            }

            throw error;
        }
    }

    async updateStartTime(retryCount = 0) {
        try {
            const currentTime = Date.now();

            const response = await axios({
                method: 'put',
                url: `${this.apiUrl}/user/update-start-time`,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                    'Origin': 'https://monadscore.xyz',
                    'Referer': 'https://monadscore.xyz/',
                    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'DNT': '1'
                },
                data: {
                    wallet: this.walletAddress,
                    startTime: currentTime
                }
            });

            if (response.data.success) {
                console.log('Start time updated successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating start time:', error.message);
            if (error.response?.data) {
                console.error('API Response:', error.response.data);
            }

            if (retryCount < this.maxRetries) {
                console.log(`Retrying in ${this.retryDelay/1000} seconds... (Attempt ${retryCount + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.updateStartTime(retryCount + 1);
            }
            return false;
        }
    }

    async checkIn() {
        try {
            if (this.checkedInToday) {
                console.log('✓ Already checked in today');
                return true;
            }

            console.log('Performing daily check-in...');
            const response = await axios({
                method: 'post',
                url: `${this.apiUrl}/user/check-in`,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                    'Origin': 'https://monadscore.xyz',
                    'Referer': 'https://monadscore.xyz/',
                    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'DNT': '1'
                },
                data: {
                    wallet: this.walletAddress
                }
            });

            if (response.data.success) {
                console.log('✓ Daily check-in successful!');
                this.lastCheckIn = new Date();
                this.checkedInToday = true;
                return true;
            }
            return false;
        } catch (error) {
            if (error.response?.status === 400 && error.response.data.message?.includes('Already checked in')) {
                console.log('✓ Already checked in today');
                this.lastCheckIn = new Date();
                this.checkedInToday = true;
                return true;
            }
            
            console.error('Error in check-in:', error.message);
            return false;
        }
    }

    async resetDailyCheckIn() {
        const now = new Date();
        if (this.lastCheckIn) {
            const lastCheckInDate = new Date(this.lastCheckIn);
            if (lastCheckInDate.toDateString() !== now.toDateString()) {
                console.log('Resetting daily check-in status...');
                this.checkedInToday = false;
                return true;
            }
        }
        return false;
    }

    async checkPoints() {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.apiUrl}/user/login`,
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'authorization': `Bearer ${this.token}`,
                    'content-type': 'application/json',
                    'dnt': '1',
                    'origin': 'https://monadscore.xyz',
                    'priority': 'u=1, i',
                    'referer': 'https://monadscore.xyz/',
                    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
                },
                data: {
                    wallet: this.walletAddress
                }
            });

            if (response.data.success) {
                const userData = response.data;
                if (userData.points !== undefined) {
                    const currentPoints = userData.points;
                    const pointsGained = currentPoints - this.lastPoints;
                    
                    if (this.lastPoints === 0) {
                        console.log(`Current points: ${currentPoints}`);
                    } else if (pointsGained > 0) {
                        console.log(`Points updated: ${this.lastPoints} -> ${currentPoints} (+${pointsGained})`);
                    } else {
                        console.log(`Current points: ${currentPoints} (no change)`);
                    }
                    
                    this.lastPoints = currentPoints;
                    
                    if (userData.token) {
                        this.token = userData.token;
                    }
                    
                    return currentPoints;
                }
            }
            return null;
        } catch (error) {
            console.error('Error checking points:', error.message);
            if (error.response?.data) {
                console.error('API Response:', error.response.data);
            }
            return null;
        }
    }

    async monitorPoints() {
        try {
            console.log('Starting node monitoring...');
            
            const startSuccess = await this.startNode();
            if (!startSuccess) {
                throw new Error('Failed to start node');
            }

            this.isRunning = true;
            console.log('✓ Node is now running!');

            await this.checkPoints();

            setInterval(async () => {
                try {
                    if (this.isRunning) {
                        const updateSuccess = await this.updateStartTime();
                        if (updateSuccess) {
                            console.log('✓ Start time updated successfully');
                            await this.checkPoints();
                        }
                    }
                } catch (error) {
                    console.error('Error in monitoring interval:', error.message);
                }
            }, 30000);

        } catch (error) {
            console.error('Error in point monitoring:', error.message);
            this.isRunning = false;
            
            console.log('Restarting monitoring in 30 seconds...');
            setTimeout(() => this.monitorPoints(), 30000);
        }
    }
}

class BotManager {
    constructor() {
        this.bots = [];
        this.initializeBots();
    }

    initializeBots() {
        const privateKeys = process.env.PRIVATE_KEYS ? 
            process.env.PRIVATE_KEYS.split(',') : 
            [process.env.PRIVATE_KEY];

        if (!privateKeys || privateKeys.length === 0) {
            console.error('No private keys found in .env file');
            process.exit(1);
        }

        privateKeys.forEach(pk => {
            if (pk.trim()) {
                this.bots.push(new MonadscoreBot(pk.trim(), process.env.API_URL || 'https://mscore.onrender.com'));
            }
        });

        console.log(`Initialized ${this.bots.length} bots`);
    }

    async startAll() {
        console.log('Starting all Monadscore Bots...');
        
        for (const bot of this.bots) {
            try {
                await bot.monitorPoints();
            } catch (error) {
                console.error(`Error starting bot for wallet ${bot.walletAddress}:`, error.message);
            }
        }
    }
}

function validateEnv() {
    const required = ['PRIVATE_KEY', 'JWT_TOKEN'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

async function main() {
    try {
        validateEnv();
        const botManager = new BotManager();
        await botManager.startAll();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
}); 