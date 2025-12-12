# 🎅 Secret Santa App

A festive Secret Santa application built with AWS CDK, featuring a beautiful Christmas-themed UI and Telegram notifications.

## Features

- 🎁 **Registration Form** - Participants can sign up with name, Telegram handle/chat ID, and wishlist
- 👥 **Participants List** - View all registered participants with remove functionality
- 🎲 **Random Assignment** - Automatically assign Secret Santas ensuring no one gets themselves
- 📱 **Telegram Notifications** - Welcome messages on registration and assignments via Telegram bot
- ❄️ **Festive UI** - Animated snowflakes, Christmas colors, and holiday decorations

## Architecture

- **Frontend**: Static website hosted on S3 + CloudFront
- **Backend**: API Gateway + Lambda functions
- **Database**: DynamoDB
- **Notifications**: Telegram Bot API

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/participants` | Register a new participant (requires Telegram handle/chat ID) |
| GET | `/participants` | List all participants |
| DELETE | `/participants/{telegram}` | Remove a participant |
| POST | `/randomize` | Assign Secret Santas and send Telegram notifications |

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Deploy to AWS:
```bash
export TELEGRAM_BOT_TOKEN=your_bot_token_here
npx cdk deploy
```

4. Configure Telegram bot:
   - Create a bot with @BotFather and grab the bot token.
   - Set `TELEGRAM_BOT_TOKEN` in your shell before deploying (required).

5. After deployment, update `frontend/app.js` with your API URL:
```javascript
const API_URL = 'https://xxxxx.execute-api.us-east-1.amazonaws.com/prod';
```

6. Redeploy to update the frontend:
```bash
npx cdk deploy
```

## Usage

1. Share the CloudFront URL with participants
2. Participants register with their name, Telegram handle/chat ID, and wishlist
3. Trigger assignments via POST to `/randomize` (e.g., `curl -X POST "$API_URL/randomize"`)
4. Everyone receives a Telegram message with their assignment!

## Local Development

```bash
npm run watch    # Watch for TypeScript changes
npm run test     # Run tests
npx cdk synth    # Generate CloudFormation template
```
