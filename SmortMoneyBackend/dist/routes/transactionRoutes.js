"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express")); // Import necessary types
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client"); // Import Prisma Client and types
const geminiService_1 = require("../services/geminiService"); // Import Gemini service and its result type
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient(); // Instantiate Prisma Client
// Configure Multer for memory storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size (e.g., 10MB)
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            // Pass an error to cb to reject the file
            cb(new Error('Not an image! Please upload an image file.'));
        }
    },
});
// POST /api/transactions/upload
// The 'screenshot' string should match the key used in the FormData on the frontend
router.post('/upload', upload.single('screenshot'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // --- DEBUGGING ---
    console.log('--- Request Received ---');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    // Use type assertion for req.file as Express.Multer.File
    console.log('req.file:', req.file);
    console.log('req.body:', req.body); // Log any other form fields
    console.log('--- End Request ---');
    // --- END DEBUGGING ---
    try {
        // Use type assertion for req.file
        const file = req.file;
        if (!file) {
            console.error('req.file is undefined or null.');
            res.status(400).json({ message: 'No image file uploaded.' });
            return; // Explicitly return void
        }
        console.log('Image received:', file.originalname, file.mimetype, file.size);
        // 1. Analyze the image using Gemini Service
        // Assuming analyzeTransactionImage returns Promise<GeminiTransactionResult[]>
        const analysisResult = yield (0, geminiService_1.analyzeTransactionImage)(file.buffer, file.mimetype);
        // Validate analysis result
        if (!Array.isArray(analysisResult) || analysisResult.length === 0) {
            throw new Error('Gemini analysis did not return a valid array of transactions.');
        }
        const savedTransactions = []; // Type the array
        const errors = []; // Type the errors array
        // Process each transaction found by Gemini
        for (const transactionData of analysisResult) {
            try {
                // Basic validation for each transaction object
                if (!transactionData || !transactionData.merchant || !transactionData.amount || !transactionData.date) {
                    console.warn('Skipping invalid transaction data from Gemini:', transactionData);
                    errors.push({ message: 'Missing required fields for a transaction.', data: transactionData });
                    continue; // Skip this transaction
                }
                // 2. Find or create the category
                let category = null; // Type the category variable
                if (transactionData.category) {
                    category = yield prisma.category.upsert({
                        where: { name: transactionData.category },
                        update: {},
                        create: { name: transactionData.category },
                    });
                }
                // 3. Save the transaction details using Prisma
                // Validate amount is a number before saving
                if (typeof transactionData.amount !== 'number') {
                    console.warn('Skipping transaction due to invalid amount type:', transactionData);
                    errors.push({ message: 'Invalid amount type received from Gemini.', data: transactionData });
                    continue;
                }
                const newTransaction = yield prisma.transaction.create({
                    data: {
                        merchant: transactionData.merchant,
                        amount: transactionData.amount, // Assign the number directly
                        date: new Date(transactionData.date), // Convert date string to Date object
                        categoryId: category ? category.id : null, // Link to category if found/created
                        // description: transactionData.description, // Add if Gemini provides it
                    },
                });
                savedTransactions.push(newTransaction);
                console.log('Transaction saved:', newTransaction);
            }
            catch (loopError) { // Type the loop error
                console.error(`Error processing transaction item: ${JSON.stringify(transactionData)}`, loopError);
                errors.push({ message: `Error saving transaction for ${transactionData.merchant || 'unknown'}.`, error: loopError === null || loopError === void 0 ? void 0 : loopError.message }); // Use optional chaining
            }
        }
        // Send the response for saved transactions
        if (savedTransactions.length > 0) {
            res.status(201).json({
                message: `Processed ${analysisResult.length} potential transactions. Saved ${savedTransactions.length}.`,
                transactions: savedTransactions,
                errors: errors.length > 0 ? errors : undefined, // Include errors if any occurred
            });
            return; // Explicitly return void
        }
        else {
            // If no transactions were saved, it's likely due to errors or invalid data
            // Let the error be caught by the main catch block
            throw new Error(`Failed to save any transactions. ${errors.length} errors occurred.`);
        }
    }
    catch (error) { // Type the main error
        console.error('Error in /upload route:', error);
        // Handle specific multer errors (like file size limit) if needed
        if (error instanceof multer_1.default.MulterError) {
            res.status(400).json({ message: `Multer error: ${error.message}` });
            return; // Explicitly return void
        }
        else if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.startsWith('Not an image!')) { // Use optional chaining
            res.status(400).json({ message: error.message });
            return; // Explicitly return void
        }
        // Pass other errors to a generic error handler (if implemented) or return 500
        // next(error); // Or handle directly:
        res.status(500).json({ message: 'Server error during upload.' });
        return; // Explicitly return void from catch
    }
}));
// PUT /api/transactions/:id - Update a transaction (specifically category for now)
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Expecting categoryId in the request body, can be string or null
    const { categoryId } = req.body;
    // Basic validation - categoryId must be present (even if null)
    if (categoryId === undefined) {
        res.status(400).json({ message: 'Missing categoryId in request body (can be null to unset).' });
        return; // Explicitly return void
    }
    try {
        // Check if the category exists (if categoryId is not null)
        if (categoryId !== null) {
            const categoryExists = yield prisma.category.findUnique({
                where: { id: categoryId },
            });
            if (!categoryExists) {
                res.status(404).json({ message: `Category with ID ${categoryId} not found.` });
                return; // Explicitly return void
            }
        }
        // Update the transaction
        const updatedTransaction = yield prisma.transaction.update({
            where: { id: id },
            data: {
                categoryId: categoryId, // Update the categoryId (allows null)
            },
            include: {
                category: true,
            },
        });
        console.log(`Transaction ${id} category updated to ${categoryId}`);
        res.json(updatedTransaction);
        return; // Explicitly return void
    }
    catch (error) { // Type the error
        console.error(`Error updating transaction ${id}:`, error);
        // Handle specific Prisma errors, e.g., record not found
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') { // Use optional chaining
            res.status(404).json({ message: `Transaction with ID ${id} not found.` });
            return; // Explicitly return void
        }
        res.status(500).json({ message: 'Server error updating transaction.' });
        return; // Explicitly return void from catch
    }
}));
// GET /api/transactions/summary - Get total spending per category for a given period
router.get('/summary', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Type the query parameters
    const { month, year } = req.query;
    // Validate query parameters
    if (!month || !year) {
        res.status(400).json({ message: 'Missing month or year query parameters.' });
        return; // Explicitly return void
    }
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12 || isNaN(yearNum)) {
        res.status(400).json({ message: 'Invalid month or year query parameters.' });
        return; // Explicitly return void
    }
    try {
        // Calculate start and end dates for the given month/year
        const startDate = new Date(yearNum, monthNum - 1, 1); // Month is 0-indexed
        const endDate = new Date(yearNum, monthNum, 1); // Start of next month (exclusive)
        // Use Prisma aggregation to sum amounts grouped by categoryId
        const spendingSummary = yield prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                date: {
                    gte: startDate, // Greater than or equal to start date
                    lt: endDate, // Less than start of next month
                },
                categoryId: {
                    not: null, // Exclude transactions without a category
                },
            },
            _sum: {
                amount: true, // Sum the amount field
            },
            orderBy: {
                _sum: {
                    amount: 'desc',
                },
            },
        });
        // Fetch category names for the summary
        const categoryIds = spendingSummary.map(item => item.categoryId).filter(id => id !== null);
        const categories = yield prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, iconName: true } // Select needed fields
        });
        const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
        const formattedSummary = spendingSummary.map(item => {
            const category = item.categoryId ? categoryMap.get(item.categoryId) : null;
            return {
                categoryId: item.categoryId,
                categoryName: category === null || category === void 0 ? void 0 : category.name,
                categoryIcon: category === null || category === void 0 ? void 0 : category.iconName,
                totalSpent: item._sum.amount || 0,
            };
        });
        res.json(formattedSummary);
        return; // Explicitly return void
    }
    catch (error) { // Type the error
        console.error(`Error fetching transaction summary for ${year}-${month}:`, error);
        res.status(500).json({ message: 'Server error fetching transaction summary.' });
        return; // Explicitly return void from catch
    }
}));
exports.default = router;
//# sourceMappingURL=transactionRoutes.js.map