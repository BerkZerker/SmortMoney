# SmortMoney App Development Plan

## Technology Stack

*   **Frontend:** React Native (Expo)
*   **Backend:** Node.js, Express.js
*   **Database:** SQLite (using Prisma)
*   **ORM:** Prisma
*   **AI:** Google Gemini API (`@google/generative-ai`)
*   **Image Handling:** `expo-image-picker` (Frontend), `multer` (Backend)
*   **Navigation:** React Navigation
*   **Icons:** `react-native-vector-icons`
*   **Charts:** `react-native-chart-kit`

## Phases

**Phase 1: Project Setup & Backend Foundation**

*   [X] **1. Initialize React Native Project:**
    *   [X] Use Expo CLI: `npx create-expo-app SmortMoneyApp`
    *   [X] Navigate into the project: `cd SmortMoneyApp` (Note: Will need to `cd` within commands)
*   [ ] **2. Setup Backend (Node.js/Express):**
    *   [X] Create backend directory: `mkdir SmortMoneyBackend` (relative to CWD)
    *   [X] Navigate into backend: `cd SmortMoneyBackend` (Note: Will need to `cd` within commands)
    *   [X] Initialize Node.js project: `npm init -y`
    *   [X] Install core dependencies: `npm install express cors dotenv pg @google/generative-ai` (Note: `pg` will be removed)
    *   [X] Install image upload dependency: `npm install multer`
    *   [X] Install ORM (Prisma): `npm install prisma --save-dev`
    *   [X] Initialize Prisma: `npx prisma init --datasource-provider postgresql` (Provider will be changed to sqlite)
    *   [X] Configure basic Express server (`server.js` or `index.js`).
    *   [X] Set up CORS middleware.
    *   [X] Load environment variables using `dotenv`.
*   [X] **3. Database Setup (SQLite with Prisma):**
    *   [X] Update `prisma/schema.prisma` provider to `sqlite`.
    *   [X] Update `.env` file in backend with `DATABASE_URL` for SQLite (e.g., `file:./dev.db`).
    *   [X] Define schema in `prisma/schema.prisma` (e.g., `User`, `Transaction`, `Category`, `Budget` models).
    *   [X] Run initial migration: `npx prisma migrate dev --name init`
*   [ ] **4. API Key Management:**
    *   [X] Obtain Google AI (Gemini) API key. (User responsibility)
    *   [X] Add `GEMINI_API_KEY=YOUR_API_KEY` to backend `.env`. (User confirmed)
    *   [X] Add `.env` to backend `.gitignore`. (User confirmed)

**Phase 2: Core Feature - Screenshot Analysis**

*   [X] **1. Frontend - Image Picker:**
    *   [X] Install image picker: `npx expo install expo-image-picker` (in app dir)
    *   [X] Request permissions.
    *   [X] Implement UI button.
*   [X] **2. Frontend - API Service:**
    *   [X] Create utility function for API calls (upload image).
*   [X] **3. Backend - Upload Endpoint:**
    *   [X] Configure `multer`.
    *   [X] Create POST route `/api/transactions/upload`.
*   [X] **4. Backend - Gemini Service:**
    *   [X] Create `geminiService.js`.
    *   [X] Initialize Google AI client.
    *   [X] Implement `analyzeTransactionImage(imageData)` function.
    *   [X] Send image & prompt to Gemini API.
    *   [X] Parse response.
*   [X] **5. Backend - Transaction Creation:**
    *   [X] Use Prisma client in upload endpoint.
    *   [X] Create `Transaction` record.
    *   [X] Return created transaction.
*   [X] **6. Frontend - Display Results:**
    *   [X] Update UI state.
    *   [X] Show confirmation/details.

**Phase 3: Budgeting Features**

*   [X] **1. Backend - Category & Budget APIs:**
    *   [X] Define Prisma models (`Category`, `Budget`). (Done in previous task)
    *   [X] Create RESTful endpoints for categories (`/api/categories`). (Done in previous task)
    *   [X] Create endpoints for budgets (`/api/budgets`). (Done in previous task)
*   [X] **2. Frontend - Budget Screens:**
    *   [X] Install React Navigation: `npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context` (in app dir) (Done in previous task)
    *   [X] Develop screens for category management. (Implemented CRUD)
    *   [X] Develop screen for setting budgets. (Implemented view/edit per period)
*   [X] **3. Frontend - Transaction Editing:**
    *   [X] Allow editing transaction category. (Implemented in transaction list)
    *   [X] Implement PUT request to `/api/transactions/:id`. (Backend route and frontend API call added)

**Phase 4: Visualization & UI Polish**

*   [X] **1. Frontend - Styling & Layout:**
    *   [X] Implement card-based layout. (Transaction list)
    *   [X] Apply color palette & typography. (Minor adjustments)
    *   [X] Install & use `react-native-vector-icons`. (Installed, used in Category screen)
*   [X] **2. Frontend - Budget Visualization Components:**
    *   [X] Create `<BudgetProgressBar>` component.
    *   [X] Fetch transaction totals by category. (Backend endpoint + API call)
    *   [X] Integrate progress bar into Budget screen.
*   [X] **3. Frontend - Charts:**
    *   [X] Install charting libraries: `npx expo install react-native-svg react-native-chart-kit` (in app dir)
    *   [X] Implement Pie chart for spending distribution. (Explore screen)
    *   [X] Implement Bar chart for budget comparison. (Explore screen)
*   [ ] **4. Frontend - Animations:**
    *   [ ] Use `Animated` API or `react-native-reanimated`. (Optional - Skipped for now)

## Future Considerations

*   [ ] Migrate backend (`SmortMoneyBackend`) from JavaScript to TypeScript for improved type safety and maintainability.
