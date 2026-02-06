# Next.js SaaS Starter

This is a starter template for building a SaaS application using **Next.js** with support for authentication, Stripe integration for payments, and a dashboard for logged-in users.

**Demo: [https://next-saas-start.vercel.app/](https://next-saas-start.vercel.app/)**

## Features

- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) which connects to Stripe Checkout
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Auth**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone https://github.com/nextjs/saas-starter
cd saas-starter
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Copy the example environment file (if available) or create a `.env` file with your keys.

### Option 1: Run with Local Firebase Emulators (Recommended)

This will start the Next.js dev server and the Firebase Emulators (Auth, Firestore) locally. This is the best way to develop without affecting production data.

```bash
npm run dev:emulator
```

- App: [http://localhost:3000](http://localhost:3000)
- Emulator UI: [http://localhost:4000](http://localhost:4000)

#### Seeding the Emulator

Once the emulator is running, you can seed it with default data (User, Team, etc.):

```bash
npm run firestore:seed
```

This will create a default user and team for testing.

To stop the emulators and clean up processes:

```bash
npm run stop:emulator
```

### Option 2: Run with Live Firebase Services

This will connect to the live Firebase project specified in your `.env` file.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

You can listen for Stripe webhooks locally through their CLI to handle subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Testing Payments

To test Stripe payments, use the following test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Going to Production

When you're ready to deploy your SaaS application to production, follow these steps:

### Set up a production Stripe webhook

1. Go to the Stripe Dashboard and create a new webhook for your production environment.
2. Set the endpoint URL to your production API route (e.g., `https://yourdomain.com/api/stripe/webhook`).
3. Select the events you want to listen for (e.g., `checkout.session.completed`, `customer.subscription.updated`).

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up your project.

### Add environment variables

In your Vercel project settings (or during deployment), add all the necessary environment variables. Make sure to update the values for the production environment, including:

1. `BASE_URL`: Set this to your production domain.
2. `STRIPE_SECRET_KEY`: Use your Stripe secret key for the production environment.
3. `STRIPE_WEBHOOK_SECRET`: Use the webhook secret from the production webhook you created in step 1.
4. `FIREBASE_...`: Add your Firebase configuration keys.
5. `AUTH_SECRET`: Set this to a random string. `openssl rand -base64 32` will generate one.

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev


to create tests

npx playwright codegen http://localhost:3000/sign-up




## Local Development

### Prerequisites

1.  **Node.js**: v18+
2.  **Firebase CLI**: `npm install -g firebase-tools`
3.  **Google Cloud SDK**: [Install gcloud](https://cloud.google.com/sdk/docs/install)
4.  **ngrok**: [Install ngrok](https://ngrok.com/download)

### Initial Setup

1. **Authenticate ngrok**:
   Get your authtoken from the [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken) and run:
   ```bash
   ngrok config add-authtoken <YOUR_TOKEN>
   ```

2. **Authenticate with Google Cloud**:
   Required for local functions to access Google Cloud APIs (Video Intelligence, Cloud Tasks).
   ```bash
   gcloud auth application-default login
   ```

3. **Authenticate Firebase CLI**:
   Required for the emulators to run with correct project configuration.
   ```bash
   firebase login
   ```

### Startup Sequence

To start the full local environment (Frontend + Emulators + Webhook Tunnel) in a single command:

```bash
npm run start:local
```

This command will:
1. Start an ngrok tunnel pointing to your local functions.
2. Automatically update `.env` files with the new public `ngrok` URL.
3. Start the Firebase Emulators (Firestore, Functions, Pub/Sub, Auth).
4. Start the Next.js frontend dev server.

- **App**: [http://localhost:3000](http://localhost:3000)
- **Emulator UI**: [http://localhost:4000](http://localhost:4000)

### Stopping

To stop all services and clean up processes:

```bash
npm run stop:local
```




### Environment Variables

Ensure your `.env.local` includes:
- `TWILIO_account_SID`
- `TWILIO_AUTH_TOKEN`
- `NEXT_PUBLIC_FIREBASE_Config`

### Google Secret Manager

Commands to manage string-based secrets using `gcloud`.

**List Secrets**
```bash
gcloud secrets list
```

**Create a Secret**
```bash
# 1. Create the secret (container)
gcloud secrets create MY_SECRET_NAME --replication-policy="automatic"

# 2. Add a secret version (the value)
echo -n "my-super-secret-value" | gcloud secrets versions add MY_SECRET_NAME --data-file=-
```

**Delete a Secret**
```bash
gcloud secrets delete MY_SECRET_NAME
```

## Deployment

### Deploying All Resources (Recommended)

To deploy everything (Functions, Firestore Rules, Storage Rules, Indexes):

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Run the full deployment command:
    ```bash
    firebase deploy
    ```

### Deploying Specific Features

If you only want to update specific parts:

- **Functions only**: `firebase deploy --only functions`
- **Firestore Rules only**: `firebase deploy --only firestore:rules`
- **Storage Rules only**: `firebase deploy --only storage`

### Important Notes
- **Environment Variables**: Ensure your production environment variables (e.g., `TWILIO_AUTH_TOKEN`, `Storage Bucket`) are correctly set in the Firebase Console or via `.env` files if supported by your configuration.
- **Credentials**: The `CloudStorageService` uses Application Default Credentials in production, which are automatically provided by the Cloud Functions environment.




### Important Links

#### DEV

##### Logs

https://console.cloud.google.com/logs/query;query=%2528resource.type%3D%22cloud_function%22%20resource.labels.function_name%3D%2528%22checkSchedules%22%2529%20resource.labels.region%3D%22us-central1%22%2529%20OR%20%2528resource.type%3D%22cloud_run_revision%22%20resource.labels.service_name%3D%2528%22checkschedules%22%2529%20resource.labels.location%3D%22us-central1%22%2529;cursorTimestamp=2025-12-19T23:34:20.990215436Z;duration=PT3H?authuser=0&project=komandra-app06&hl=en-US