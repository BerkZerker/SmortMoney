import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { Express, Request, Response, NextFunction } from 'express'; // Import types
import cors from 'cors';

// Import routes (will need conversion later, using require for now if they are still .js)
// Note: Using require might cause issues with TS type checking across modules.
// It's better to convert imported files to TS as well.
import budgetRoutes from './routes/budgetRoutes'; // Use import for the TS file
import categoryRoutes from './routes/categoryRoutes'; // Use import for the TS file
import transactionRoutes from './routes/transactionRoutes'; // Use import for the TS file


const app: Express = express(); // Type the app instance
const PORT: number = parseInt(process.env.PORT || '3000', 10); // Ensure PORT is number, default 3000

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing for all origins
app.use(express.json()); // Parse incoming JSON requests

// Basic test route with types
app.get('/', (req: Request, res: Response) => {
  res.send('SmortMoney Backend is running!');
});

// API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes); // Mount category routes
app.use('/api/budgets', budgetRoutes); // Mount budget routes

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
