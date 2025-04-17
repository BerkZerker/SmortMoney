"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables from .env file
const express_1 = __importDefault(require("express")); // Import types
const cors_1 = __importDefault(require("cors"));
// Import routes (will need conversion later, using require for now if they are still .js)
// Note: Using require might cause issues with TS type checking across modules.
// It's better to convert imported files to TS as well.
const budgetRoutes_1 = __importDefault(require("./routes/budgetRoutes")); // Use import for the TS file
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes")); // Use import for the TS file
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes")); // Use import for the TS file
const app = (0, express_1.default)(); // Type the app instance
const PORT = parseInt(process.env.PORT || '3000', 10); // Ensure PORT is number, default 3000
// Middleware
app.use((0, cors_1.default)()); // Enable Cross-Origin Resource Sharing for all origins
app.use(express_1.default.json()); // Parse incoming JSON requests
// Basic test route with types
app.get('/', (req, res) => {
    res.send('SmortMoney Backend is running!');
});
// API Routes
app.use('/api/transactions', transactionRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default); // Mount category routes
app.use('/api/budgets', budgetRoutes_1.default); // Mount budget routes
// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map