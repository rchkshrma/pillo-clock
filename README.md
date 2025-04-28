# Pill O'Clock
Rochak Sharma 220563998

### 1. Clone the Repository

### 2. Install Frontend Dependencies

Navigate to the **pill-reminder-frontend** directory and install the required dependencies:

```bash
cd pill-reminder-frontend
npm install
```

### 3. Install Backend Dependencies

Navigate to the **pill-reminder-backend** directory and install the required backend dependencies:

```bash
cd ../pill-reminder-backend
npm install
```

### 4. Generate Web Push Keys

Generate the **VAPID keys** for Web Push notifications in the **pill-reminder-backend** directory:

```bash
npx web-push generate-vapid-keys
```

### 5. Replace VAPID Keys in Code

Once you’ve generated the keys, **replace the public and private key values** in the following files:

- **In the frontend**: 
  - Open `pill-reminder-frontend/src/pushNotifications.js` and replace the `VAPID_PUBLIC_KEY` variables with the generated values.

- **In the backend**:
  - Open `pill-reminder-backend/server.js` and replace the `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` variables with the generated values.

### 5. Running the web-app

Navigate to the **pill-reminder-backend** directory:

```bash
cd ../pill-reminder-backend
node server.js
```

Navigate to the **pill-reminder-frontend** directory:
```bash
cd pill-reminder-frontend
npm start
```