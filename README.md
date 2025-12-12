# 🎅 Secret Santa App

A festive Secret Santa application built with AWS CDK, featuring a beautiful Christmas-themed UI and SES email notifications.

## Features

- 🎁 **Registration Form** - Participants can sign up with name, email, and wishlist
- 👥 **Participants List** - View all registered participants with remove functionality
- 🎲 **Random Assignment** - Automatically assign Secret Santas ensuring no one gets themselves
- 📧 **Email Notifications** - Beautiful Christmas-styled emails via AWS SES
- ❄️ **Festive UI** - Animated snowflakes, Christmas colors, and holiday decorations

## Architecture

- **Frontend**: Static website hosted on S3 + CloudFront
- **Backend**: API Gateway + Lambda functions
- **Database**: DynamoDB
- **Notifications**: AWS SES

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/participants` | Register a new participant |
| GET | `/participants` | List all participants |
| DELETE | `/participants/{email}` | Remove a participant |
| POST | `/randomize` | Assign Secret Santas and send emails |

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
npx cdk deploy
```

4. Configure SES "From" address:
   - Verify a sender email or domain in SES (e.g., `zambezipro@gmail.com`).
   - Confirm `SES_FROM_EMAIL` in `lib/santa-stack.ts` is set to that verified address before deploying.

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
2. Participants register with their name, email, and wishlist
3. Trigger assignments via POST to `/randomize` (e.g., `curl -X POST "$API_URL/randomize"`)
4. Everyone receives a festive email with their assignment!

## Local Development

```bash
npm run watch    # Watch for TypeScript changes
npm run test     # Run tests
npx cdk synth    # Generate CloudFormation template
```
