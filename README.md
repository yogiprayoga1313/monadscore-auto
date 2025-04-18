# Monadscore Auto Bot

An auto-running Node.js bot for Monadscore that automatically updates start time and maintains connection.

## Features

- Auto-updates start time every 30 seconds
- Auto-checks points and node status every 30 seconds
- Multiple wallet support
- Ethereum wallet integration
- Automatic token management
- Error handling and auto-restart
- Development mode with nodemon

## Prerequisites

- Node.js installed
- Ethereum wallet private key(s)
- Monadscore account
- JWT Token from monadscore.xyz

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yogiprayoga1313/monadscore-auto.git
cd monadscore-auto
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# For single wallet
PRIVATE_KEY=your_private_key_here

# For multiple wallets (separate with commas)
PRIVATE_KEYS=private_key1,private_key2,private_key3

# API URL (optional, default is already set)
API_URL=https://mscore.onrender.com

# JWT Token (required, get from monadscore.xyz after login)
JWT_TOKEN=your_jwt_token_here
```

4. Get your JWT Token:
   - Login to monadscore.xyz
   - Open browser developer tools (F12)
   - Go to Application > Local Storage
   - Copy the value of 'token'
   - Paste it as JWT_TOKEN in your .env file

## Usage

To start the bot:
```bash
node index.js
```

## Project Structure

- `index.js` - Main bot implementation and manager
- `.env` - Environment variables configuration

## Features Explanation

1. **Multiple Wallet Support**
   - You can run multiple wallets simultaneously
   - Each wallet runs independently
   - Use PRIVATE_KEYS with comma separation for multiple wallets

2. **Auto Monitoring**
   - Checks node status every 30 seconds
   - Updates points information automatically
   - Shows uptime, total points, and active days
   - Displays last check-in time and next target

3. **Error Handling**
   - Automatic token refresh
   - Connection error recovery
   - Failed request retry mechanism

## Security Notes

- Never share your private keys
- Keep your `.env` file secure and never commit it
- Don't share screenshots that might expose your wallet information or JWT token
- Use a dedicated wallet for the bot
- Regularly update your JWT token if experiencing authentication issues

## Troubleshooting

1. If you see "No private keys found":
   - Make sure your `.env` file exists
   - Check if PRIVATE_KEY or PRIVATE_KEYS is properly set

2. If you see "Access denied" or "Invalid token":
   - Make sure JWT_TOKEN is set in your .env file
   - Get a new JWT token from monadscore.xyz:
     1. Login to monadscore.xyz
     2. Open browser developer tools (F12)
     3. Go to Application > Local Storage
     4. Copy the value of 'token'
     5. Paste it as JWT_TOKEN in .env

3. If connection fails:
   - Check your internet connection
   - Verify the API_URL is correct
   - Make sure your private key(s) are valid

4. If node status shows as not running:
   - The bot will automatically attempt to start it
   - Check if your wallet is properly registered on Monadscore

## Common Issues

1. **Token Expired**
   - The bot will automatically refresh the token
   - If persistent, get a new JWT token from monadscore.xyz

2. **Multiple Wallets Not Working**
   - Ensure PRIVATE_KEYS in .env uses correct comma separation
   - Verify each private key is valid
   - Check each wallet is registered on Monadscore

3. **High CPU Usage**
   - This is normal due to 30-second interval checks
   - Consider increasing the interval if needed

## License

ISC

## Disclaimer

This bot is for educational purposes only. Use at your own risk. Make sure to comply with Monadscore's terms of service. 