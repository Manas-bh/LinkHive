# LinkHive

LinkHive is a Next.js URL shortener and campaign analytics platform with OAuth auth, QR generation, and admin controls.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with required values:

```bash
MONGODB_URI=<your_mongodb_uri>
AUTH_SECRET=<your_auth_secret>
GITHUB_ID=<github_oauth_client_id>
GITHUB_SECRET=<github_oauth_client_secret>
GOOGLE_CLIENT_ID=<google_oauth_client_id>
GOOGLE_CLIENT_SECRET=<google_oauth_client_secret>
```

3. Run the app:

```bash
npm run dev
```

## Validation

- `npm run lint`
- `npm run build`

## Runtime Smoke Test

1. Start the app in a separate terminal:

```bash
PORT=3015 npm run start
```

2. Run smoke checks:

```bash
BASE_URL=http://127.0.0.1:3015 npm run smoke
```

The smoke suite validates:

- Public URL creation and redirect behavior
- URL and expiry input validation
- Auth guards for protected API routes
- QR generation endpoint health
