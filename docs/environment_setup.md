# Environment Setup Guide: komandra-app06

This document outlines the steps required to stand up a completely new environment (e.g., Staging or Production) for the `komandra-app06` project.

## 1. Firebase Project Foundation
- **Create Project:** Create a new project in the [Firebase Console](https://console.firebase.google.com/).
- **Enable Services:**
  - **Authentication:** Enable Google Sign-In (or other providers used).
  - **Firestore:** Create a database in Native mode.
  - **Storage:** Enable Cloud Storage.
- **Update Local Config:**
  - Add the new project ID to `.firebaserc` with a meaningful alias (e.g., `stg`).
  ```json
  "projects": {
    "stg": "your-new-project-id"
  }
  ```

## 2. GitHub Repository Secrets
To enable automated deployments, add the following secrets to your GitHub repository (**Settings > Secrets and variables > Actions**):
- `FIREBASE_TOKEN_<ALIAS>`: Generate this using `firebase login:ci`. (e.g., `FIREBASE_TOKEN_STG`).

## 3. Secret Manager Provisioning (GCP)
Sensitive keys must be stored in the Google Cloud Secret Manager for the specific project.
Run the following command for each secret:
```bash
echo -n 'secret-value' | firebase apphosting:secrets:set <SECRET_NAME> --data-file - -f --project <ALIAS>
```

### Required Secrets List:
1. `secretAuthSecret`: Random 32-byte string (`openssl rand -base64 32`).
2. `secretTwilioApiKey`: Twilio API Key SID.
3. `secretTwilioApiSecret`: Twilio API Key Secret.
4. `secretTwilioAccountSid`: Twilio Account SID.
5. `secretTwilioAuthToken`: Twilio Auth Token.
6. `secretPostmarkServerApiToken`: Postmark Server API Token.
7. `secretStripeSecretKey`: Stripe Secret Key (`sk_...`).
8. `secretStripeWebhookSecret`: Stripe Webhook Signing Secret (`whsec_...`).
9. `secretGoogleRecaptchaV3SecretKey`: Recaptcha V3 Secret Key.

## 4. App Hosting Backend Setup
1. **Create Backend:** In the Firebase Console, go to **App Hosting** and create a new backend.
2. **Connect Repository:** Link your GitHub repo and select the branch (e.g., `main` for prod, `dev` for dev).
3. **Environment Name:** In **Settings > Environment**, set the **Environment name** to match your config file suffix (e.g., `prd` for `apphosting.prd.yaml`).
4. **Environment Variables (Cloud Functions):**
   Set the following directly on the Cloud Functions environment:
   ```bash
   firebase functions:secrets:set FUNCTIONS_URL --project <ALIAS>
   # Value: https://us-central1-<PROJECT_ID>.cloudfunctions.net/
   ```

## 5. Configuration Overrides
Create a new `apphosting.<ALIAS>.yaml` and `functions/.env.<ALIAS>` file in the root and `functions/` directories respectively.
- Copy values from the `.dev` versions and replace them with project-specific URLs and IDs.

## 6. Third-Party Webhooks
- **Stripe:** Create a new webhook in the Stripe Dashboard pointing to `https://<YOUR_APP_URL>/api/stripe/webhook`.
- **Twilio:** 
  - Update the **Status Callback URL** for Video in the Twilio Console.
  - Create a new **Intelligence Service** and set its callback to your `twilioTranscriptionWebhook` URL.

## 7. Initial Deployment
1. **Rules & Indexes:** Push a change to the tracked branch to trigger the GitHub Action.
2. **Functions:** Run `firebase deploy --only functions --project <ALIAS>`.
3. **App Hosting:** The first rollout will trigger automatically upon backend creation.
