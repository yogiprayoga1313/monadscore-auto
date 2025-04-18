require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');
const moment = require('moment');

class MonadscoreBot {
    constructor(privateKey) {
        const wallet = new ethers.Wallet(privateKey);
        this.walletAddress = wallet.address;
        this.token = process.env.JWT_TOKEN || null;
        this.startTime = null;
        this.lastPoints = null;
        this.sessionStartPoints = null;
        this.sessionStartTime = null;
        this.apiUrl = process.env.API_URL || 'https://mscore.onrender.com';
        this.maxRetries = 3;
        this.retryDelay = 10000; // 10 seconds
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async login() {
        try {
            console.log('Attempting to login...');
            const response = await axios({
                method: 'post',
                url: `${this.apiUrl}/user/login`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Origin': 'https://monadscore.xyz',
                    'Referer': 'https://monadscore.xyz/'
                },
                data: {
                    wallet: this.walletAddress
                }
            });

            if (response.data.success && response.data.token) {
                this.token = response.data.token;
                console.log('Login successful');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error.message);
            if (error.response?.data) {
                console.error('API Response:', error.response.data);
            }
            return false;
        }
    }

    async checkNodeStatus() {
        try {
            if (!this.token) {
                await this.login();
            }

            const response = await axios({
                method: 'post',
                url: `${this.apiUrl}/user/login`,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Origin': 'https://monadscore.xyz',
                    'Referer': 'https://monadscore.xyz/'
                },
                data: {
                    wallet: this.walletAddress
                }
            });

            if (response.data.success && response.data.user) {
                const user = response.data.user;
                
                console.log('\nCurrent Status:');
                console.log('- Node Uptime:', user.nodeUptime, 'minutes');
                console.log('- Total Points:', user.totalPoints);
                console.log('- Active Days:', user.activeDays);
                console.log('- Last Check In:', user.lastCheckInDate);
                console.log('- Next Total Points Target:', user.nextTotalPoints);
                
                if (response.data.token) {
                    this.token = response.data.token;
                }

                return { 
                    isRunning: user.nodeUptime > 0, 
                    data: user,
                    startTime: user.startTime
                };
            }
            return { isRunning: false, data: null };
        } catch (error) {
            console.error('Error checking node status:', error.message);
            if (error.response?.status === 401) {
                console.log('Token expired, attempting to login again...');
                await this.login();
                return this.checkNodeStatus();
            }
            if (error.response?.data) {
                console.error('API Response:', error.response.data);
            }
            return { isRunning: false, data: null };
        }
    }

    async updateStartTime(retryCount = 0) {
        try {
            if (!this.token) {
                await this.login();
            }

            console.log(`Attempting to update start time (attempt ${retryCount + 1}/${this.maxRetries})`);

            const response = await axios({
                method: 'put',
                url: `${this.apiUrl}/user/update-start-time`,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Origin': 'https://monadscore.xyz',
                    'Referer': 'https://monadscore.xyz/'
                },
                data: {
                    wallet: this.walletAddress,
                    startTime: Date.now()
                }
            });

            if (response.data.success) {
                console.log('Start time updated successfully:', response.data.message);
                if (response.data.token) {
                    this.token = response.data.token;
                }
                return true;
            } else {
                console.error('Update failed:', response.data);
                return false;
            }
        } catch (error) {
            console.error('Error updating start time:', error.message);
            if (error.response?.status === 401) {
                console.log('Token expired, attempting to login again...');
                await this.login();
                return this.updateStartTime(retryCount);
            }
            if (error.response?.data) {
                console.error('API Response:', error.response.data);
            }

            if (retryCount < this.maxRetries - 1) {
                console.log(`Retrying in ${this.retryDelay/1000} seconds...`);
                await this.sleep(this.retryDelay);
                return this.updateStartTime(retryCount + 1);
            }

            return false;
        }
    }

    async monitorPoints() {
        while (true) {
            const status = await this.checkNodeStatus();
            if (status.data) {
                const user = status.data;
                console.log('\nUpdated Points Information:');
                console.log('- Total Points:', user.totalPoints.toFixed(2));
                console.log('- Node Uptime:', user.nodeUptime, 'minutes');
                console.log('- Active Days:', user.activeDays);
                console.log('- Last Check In:', user.lastCheckInDate);
                console.log('- Next Target:', user.nextTotalPoints);
                console.log('- Start Time:', new Date(user.startTime).toLocaleString());
                console.log('- Last Update:', new Date().toLocaleString());
                console.log('----------------------------------------');
            }
            await this.sleep(30 * 1000); // Diubah menjadi 30 detik
        }
    }

    async start() {
        console.log('Monadscore Bot is running...');
        console.log('Wallet Address:', this.walletAddress);

        // Initial login if no token
        if (!this.token) {
            await this.login();
        }
        console.log('Authentication:', this.token ? 'Successful' : 'Failed');

        // Check initial node status
        const status = await this.checkNodeStatus();
        
        if (status.isRunning) {
            console.log('\nNode is already running!');
            console.log('Current points:', status.data.totalPoints);
            console.log('Current uptime:', status.data.nodeUptime, 'minutes');
            console.log('Active days:', status.data.activeDays);
            console.log('Start time:', new Date(status.data.startTime).toLocaleString());
        } else {
            console.log('\nNode is not running. Starting node...');
            await this.updateStartTime();
        }

        // Start monitoring points in the background
        this.monitorPoints();

        // Schedule regular updates only if node wasn't running
        if (!status.isRunning) {
            setInterval(async () => {
                await this.updateStartTime();
            }, 30 * 1000); // Diubah menjadi 30 detik
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
                this.bots.push(new MonadscoreBot(pk.trim()));
            }
        });

        console.log(`Initialized ${this.bots.length} bots`);
    }

    async startAll() {
        console.log('Starting all Monadscore Bots...');
        
        for (const bot of this.bots) {
            try {
                await bot.start();
            } catch (error) {
                console.error(`Error starting bot for wallet ${bot.walletAddress}:`, error.message);
            }
        }
    }
}

// Main execution
const botManager = new BotManager();
botManager.startAll();

// Handle errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
}); 