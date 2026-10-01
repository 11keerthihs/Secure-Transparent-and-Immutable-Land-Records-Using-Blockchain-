# Immutable Land Record Management Using Blockchain Technology

A decentralized, tamper-proof land registry system powered by **Ethereum smart contracts (`LandRegistry.sol`)**, **SHA-256 cryptographic document verification**, and **multi-tier role-based access control** for Government Authorities and Citizens.

---

## 1. Project Overview

Traditional paper and centralized electronic land registries are vulnerable to bureaucratic forgery, double-allocation fraud, unauthorized database alterations, and lack of public provenance.

This application provides:
- **On-Chain Immutability:** Cadastral parcels, survey plots, GPS coordinates, valuation metrics, and title deed SHA-256 digests are permanently committed to an Ethereum-compatible blockchain ledger.
- **SHA-256 Title Deed Integrity:** Documents (PDFs, scans, blueprints) are hashed in the browser using the Web Crypto API. The hash is compared with on-chain records to detect any alteration.
- **Privacy-Preserving Citizen Identification:** Plaintext government IDs are normalized and hashed with SHA-256; only the digest and last 4 digits are stored.
- **Dual-Mode Consensus Engine:** Connects to live local Ganache RPC (`http://127.0.0.1:7545`, Chain ID `1337`), and includes a high-fidelity reactive state-machine fallback so examiners can test the entire workflow immediately in browser previews without crashing.

---

## 2. Technology Stack

- **Frontend:** React 19, React Router v7, Tailwind CSS, Lucide Icons, Recharts
- **Blockchain & Web3:** Solidity `^0.8.20`, Hardhat, ethers.js v6, Ganache (`chainId: 1337`)
- **Authentication & Database:** Firebase Authentication (Google OAuth + Email/Password), Cloud Firestore
- **Cryptography:** Browser Web Crypto API (`crypto.subtle.digest("SHA-256", ...)`)
- **Development Tooling:** Node.js, npm, VS Code

---

## 3. Folder Structure

```
├── contracts/
│   └── LandRegistry.sol          # Solidity 0.8.20 Smart Contract
├── scripts/
│   ├── deploy.cjs                # Automated Hardhat deploy script & address.json writer
│   ├── export-abi.cjs            # Exports artifact ABI to src/blockchain/LandRegistry.abi.json
│   └── reset-and-deploy.cjs      # Clean, recompile, export ABI, and deploy
├── src/
│   ├── blockchain/
│   │   ├── address.json          # Live deployed contract address
│   │   ├── LandRegistry.abi.json # Contract Application Binary Interface
│   │   ├── config.ts             # RPC URL & Chain ID 1337 configuration
│   │   ├── landService.ts        # Ethers.js provider, health check & contract caller
│   │   └── types.ts              # Cadastral record interfaces
│   ├── components/
│   │   ├── BlockchainModal.tsx   # Node connection inspector & diagnostics
│   │   ├── BlockchainStatusBanner.tsx # Live node status indicator
│   │   ├── DocumentHashVerifier.tsx # SHA-256 deed drag & drop hasher
│   │   ├── Footer.tsx            # Official disclaimer & architecture summary
│   │   ├── Navbar.tsx            # Government header & navigation
│   │   └── ProtectedRoute.tsx    # Role-based route guard
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Firebase session & role state
│   │   └── BlockchainContext.tsx # Live node status state
│   ├── firebase/
│   │   ├── config.ts             # Firebase initialization & admin whitelist
│   │   ├── authService.ts        # Google OAuth & Email/Pass authentication
│   │   ├── firestoreService.ts   # Marketplace, interests, & transfer audit logs
│   │   └── types.ts              # Data types for off-chain profiles
│   ├── pages/
│   │   ├── LandingPage.tsx       # Government landing page & public search
│   │   ├── GovLoginPage.tsx      # Government Google OAuth login & whitelist check
│   │   ├── CitizenAuthPage.tsx   # Citizen registration with Gov ID hashing
│   │   ├── GovDashboard.tsx      # Registrar console (17-field form, Recharts, transfers)
│   │   ├── CitizenDashboard.tsx  # Citizen portal (holdings, marketplace, offers)
│   │   └── LandDetailsPage.tsx   # Full cadastral dossier & Blockchain Verifier
│   ├── utils/
│   │   └── crypto.ts             # Web Crypto SHA-256 & Gov ID privacy utilities
│   ├── App.tsx                   # Routes and providers
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Global Tailwind CSS
├── .env.example                  # Environment configuration template
├── firestore.rules               # Firestore security rules
├── hardhat.config.cjs            # Hardhat configuration for Ganache (port 7545, chain 1337)
├── package.json                  # NPM scripts & dependencies
└── README.md                     # Beginner setup and execution manual
```

---

## 4. Quick Start (Run Locally in VS Code)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Ganache Blockchain
Open a terminal in VS Code and run:
```bash
npm run ganache
```
Ganache will start on `http://127.0.0.1:7545` with Network/Chain ID `1337`.

### Step 3: Compile and Deploy Smart Contract
In a second terminal, run:
```bash
npm run reset-and-deploy
```
This single command will:
1. Compile `contracts/LandRegistry.sol` using Solidity `0.8.20`.
2. Export the fresh contract ABI to `src/blockchain/LandRegistry.abi.json`.
3. Deploy `LandRegistry` to your Ganache node.
4. Automatically write the deployed contract address to `src/blockchain/address.json`.

### Step 4: Start the Web Application
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 5. Setting Up Firebase (Authentication & Firestore)

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Give your project a name (e.g., `blockchain-land-registry`) and create the project.
3. In the project dashboard, click the Web icon (`</>`) to add a Web app.
4. Copy the `firebaseConfig` object values.
5. In your project root, create a file named `.env` by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
6. Paste your credentials into `.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-app
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

   # For Create React App compatibility if using CRA:
   REACT_APP_FIREBASE_API_KEY=AIzaSy...
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-app
   ```
7. Enable Authentication Providers:
   - In the Firebase Console, navigate to **Build > Authentication > Sign-in method**.
   - Enable **Google**.
   - Enable **Email/Password**.
   - Under **Authorized domains**, ensure `localhost` is listed.
8. Enable Cloud Firestore:
   - Navigate to **Build > Firestore Database > Create database**.
   - Copy the contents of `firestore.rules` from this repository into the Firebase Rules editor and click **Publish**.

---

## 6. Configuring Government Administrators

To protect government administrative functions, the application uses an authorized email whitelist.

In your `.env` file, specify authorized administrator emails (comma-separated):
```env
VITE_ADMIN_EMAILS=admin@example.com,gov.admin@landregistry.gov,your_email@gmail.com
REACT_APP_ADMIN_EMAILS=admin@example.com,gov.admin@landregistry.gov,your_email@gmail.com
```

### Access Denied Security Flow
1. Official navigates to **Government Login** (`/login`).
2. Signs in with Google account.
3. If the email is in `VITE_ADMIN_EMAILS`, access is granted to `/dashboard`.
4. If unauthorized, access is immediately revoked with:
   > `"Access denied. You are not authorized to access this system."`

---

## 7. Testing Citizen Authentication

1. Navigate to `/citizen/login`.
2. Click **Register Citizen Account**:
   - Legal Name: `Anita Vikram Rao`
   - Email: `anita@example.com`
   - Password: `Password123`
   - Government ID: `9876-5432-1098`
3. Notice that the Government ID is immediately encrypted via SHA-256. The plaintext is never stored.
4. Click **Complete Citizen Registration**.
5. You are redirected to the **Citizen Dashboard** (`/citizen/dashboard`) where you can view holdings, browse the marketplace, submit purchase offers, and track approvals.

---

## 8. Testing Land Registration on Blockchain

1. Log in to the **Government Dashboard** (`/dashboard`).
2. Click **Register New Land** tab.
3. Fill in all cadastral fields:
   - Parcel ID: `MH-PUN-HAV-2024-099`
   - Survey No: `142/2A`
   - Plot No: `Plot 14`
   - Owner Name: `Anita Vikram Rao`
   - Owner Government ID: `9876-5432-1098`
   - Land Use: `Residential`
   - Area: `3200 Sq.Ft`
   - Valuation: `₹5,800,000`
4. Attach a title deed in the **Title Deed Cryptographic Digest (SHA-256)** box. The Web Crypto API computes the exact SHA-256 hash.
5. Click **Sign & Register Land on Smart Contract**.
6. The transaction is broadcast to Ganache, and a success banner displays:
   - Assigned Land ID
   - Block Number
   - Full 64-character Ethereum Transaction Receipt Hash.

---

## 9. Common Errors and Fixes

### Error 1: `"No contract code found at [address] on the connected network"`
- **Cause:** Ganache is running, but the `LandRegistry` smart contract has not been deployed to that specific Ganache session, or Ganache was restarted (clearing in-memory state).
- **Fix:**
  1. Ensure Ganache is running:
     ```bash
     npm run ganache
     ```
  2. Deploy the contract:
     ```bash
     npm run deploy:ganache
     ```
  3. The script will write the new address to `src/blockchain/address.json`.
  4. In the app, click the **Check Node** button on the top banner or refresh the page.

### Error 2: `"Access denied. You are not authorized to access this system."`
- **Cause:** The Google email used to log in at `/login` is not listed in `VITE_ADMIN_EMAILS` or `REACT_APP_ADMIN_EMAILS`.
- **Fix:** Add your Google email address to `VITE_ADMIN_EMAILS` in `.env` and restart the dev server:
  ```env
  VITE_ADMIN_EMAILS=your.email@gmail.com,admin@example.com
  ```

### Error 3: `"This Government ID is already registered to another account."`
- **Cause:** To prevent identity duplication, each unique normalized Government ID can only be registered once.
- **Fix:** Use a different Government ID number when registering another citizen account.

---

## 10. Summary of NPM Commands

| Command | Purpose |
|---|---|
| `npm start` | Starts React development server on port 3000 |
| `npm run build` | Builds production-ready bundle |
| `npm run ganache` | Starts local Ganache blockchain on port 7545 with chainId 1337 |
| `npm run compile:contracts` | Compiles `LandRegistry.sol` using Hardhat (Solidity 0.8.20) |
| `npm run export:abi` | Exports contract ABI to `src/blockchain/LandRegistry.abi.json` |
| `npm run deploy:ganache` | Deploys contract to Ganache and writes `address.json` |
| `npm run reset-and-deploy` | Cleans artifacts, recompiles, exports ABI, and deploys |

---
*Developed for National Land Cadastral Modernization & Academic Blockchain Research.*
