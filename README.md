# SmortMoney - Personal Finance Tracker

SmortMoney is a mobile application designed to help users manage their personal finances effectively. It features intelligent transaction analysis from screenshots using the Google Gemini API, along with robust budget tracking and category management capabilities.

## Technology Stack

*   **Frontend (SmortMoneyApp):**
    *   React Native (Expo)
    *   TypeScript
    *   React Navigation
    *   Axios (for API calls)
    *   Expo Image Picker
*   **Backend (SmortMoneyBackend):**
    *   Node.js
    *   Express.js
    *   TypeScript
    *   Prisma (ORM)
    *   SQLite (Database)
    *   Google Gemini API (`@google/generative-ai`)
    *   Multer (for image uploads)
    *   CORS

## Features

*   **Screenshot Analysis:** Upload transaction screenshots for automatic data extraction (merchant, amount, date, category suggestion) via Gemini AI.
*   **Transaction Management:** View and categorize transactions.
*   **Category Management:** Create, read, update, and delete spending categories.
*   **Budgeting:** Set monthly budgets per category and track progress.
*   **Spending Summary:** Visualize spending distribution by category.

## Prerequisites

*   Node.js (LTS version recommended)
*   npm (usually comes with Node.js)
*   Expo Go app (for testing on physical mobile devices - optional)
*   A Google Gemini API Key

## Setup Instructions

1.  **Clone the Repository:** (If you haven't already)
    ```bash
    git clone <repository-url>
    cd SmortMoney
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd SmortMoneyBackend
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd ../SmortMoneyApp
    npm install
    ```

4.  **Configure Backend Environment:**
    *   Navigate to the `SmortMoneyBackend` directory: `cd ../SmortMoneyBackend`
    *   Create a `.env` file in this directory.
    *   Add the following lines to the `.env` file, replacing `YOUR_API_KEY` with your actual Google Gemini API key:
        ```dotenv
        DATABASE_URL="file:./dev.db"
        GEMINI_API_KEY="YOUR_API_KEY"
        # PORT=3000 (Optional - defaults to 3000 if not set)
        ```
    *   Ensure the `.env` file is added to `SmortMoneyBackend/.gitignore` (it should be).

5.  **Run Database Migrations:**
    *   Make sure you are in the `SmortMoneyBackend` directory.
    *   Run the Prisma migrations to set up the SQLite database schema:
        ```bash
        npx prisma migrate dev
        ```

## Running the Application

You need to run both the backend and frontend servers simultaneously.

1.  **Start the Backend Server:**
    *   Navigate to the backend directory: `cd SmortMoneyBackend`
    *   Compile the TypeScript code:
        ```bash
        npx tsc
        ```
    *   Start the server (it will listen on port 3000 by default):
        ```bash
        node dist/index.js
        ```
    *   Keep this terminal window open.

2.  **Start the Frontend Server:**
    *   Open a **new** terminal window/tab.
    *   Navigate to the frontend directory: `cd SmortMoneyApp`
    *   Start the Expo development server:
        ```bash
        npx expo start
        ```
    *   Expo will provide instructions in the terminal:
        *   Scan the QR code with the Expo Go app (Android/iOS) to run on your phone.
        *   Press `w` to open the app in your web browser.
        *   Press `a` to attempt opening on a connected Android device/emulator.
        *   Press `i` to attempt opening on an iOS simulator (macOS only).

The application should now be running, with the frontend communicating with the backend server.
