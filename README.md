# MonadScore Auto Bot

Bot for automating Monadscore node running and daily check-in.

## Requirements
- Node.js v16 or higher
- NPM or Yarn
- Wallet registered on [MonadScore](https://monadscore.xyz/signup/r/KMFIeETE)

## Installation

1. Clone this repository:
```bash
git clone <repository_url>
cd monadscore-auto
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Setup environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` file and fill in your information:
     ```env
     # Your wallet private key (without 0x prefix)
     PRIVATE_KEY=your_private_key_here

     # JWT Token from Monadscore (get from browser after login)
     JWT_TOKEN=your_jwt_token_here

     # Working API URL
     API_URL=https://mscore-production.up.railway.app
     ```

## How to Get Private Key and JWT Token

### Private Key
1. Open MetaMask
2. Click three dots in the top right corner
3. Go to Account Details
4. Click Export Private Key
5. Enter your MetaMask password
6. Copy the private key (without 0x prefix)

### JWT Token
1. Open [MonadScore](https://monadscore.xyz)
2. Login with your wallet
3. Open Developer Tools (F12)
4. Go to Network tab
5. Look for requests containing 'login' or 'update-start-time'
6. Check Headers > Authorization
7. Copy the token after 'Bearer '

## Usage

1. Make sure all environment variables are properly set in `.env` file

2. Run the bot:
```bash
node index.js
```

3. The bot will automatically:
   - Start the node
   - Perform daily check-in
   - Update start time every 30 seconds
   - Display status in terminal

## Features
- ✅ Auto start node
- ✅ Auto daily check-in
- ✅ Auto update start time
- ✅ Error handling and auto-retry
- ✅ Status monitoring in terminal

## Troubleshooting

### Invalid or Expired Token
If you get "Invalid or expired token" error:
1. Open [MonadScore](https://monadscore.xyz)
2. Login again with your wallet
3. Get new JWT token (see instructions above)
4. Update token in `.env` file
5. Restart the bot

### Connection Error
If you get connection errors:
1. Ensure your internet connection is stable
2. The bot will automatically retry every 30 seconds
3. If error persists, check server status on [MonadScore Discord](https://discord.gg/monad)

## Security
- ⚠️ NEVER share your private key
- Keep your private key and JWT token secure
- Use a dedicated wallet for Monadscore, not your main wallet
- Always backup your `.env` file in a secure location

## Disclaimer
This bot is not affiliated with Monad team or Monadscore. Use at your own risk. 