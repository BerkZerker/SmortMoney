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
const express_1 = require("express"); // Import Request, Response, NextFunction
const client_1 = require("@prisma/client"); // Import Prisma for types if needed
const multer_1 = __importDefault(require("multer"));
// Correct the import name based on geminiService.ts
const geminiService_1 = require("../services/geminiService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size (adjust as needed)
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            // Reject file
            cb(new Error('Only image files are allowed for receipts!'));
        }
    }
});
// Upload and analyze receipt image
// POST /api/transactions/upload - Upload and analyze a transaction receipt
router.post('/upload', upload.single('screenshot'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Log received request
    console.log('Processing upload request');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    // Multer adds the file info to the request object
    console.log('File info', req.file); // Type inference should work now
    console.log('Body info', req.body); // Any other form fields
    console.log('Analyzing receipt...');
    // Process the upload
    try {
        // Check if file was provided
        const file = req.file; // Use inferred type
        if (!file) {
            console.error('No file uploaded or file invalid');
            res.status(400).send({ message: 'Please upload a receipt' });
            return; // Early return on error
        }
        console.log('File received:', file.originalname, file.mimetype, file.size);
        // Send to Google Gemini Vision for analysis
        // This might return an array of potential transactions based on the image
        const extractedFields = yield (0, geminiService_1.analyzeTransactionImage)(file.buffer, file.mimetype); // Use correct function name
        // Validate extraction results
        if (!Array.isArray(extractedFields) || extractedFields.length === 0) {
            throw new Error('Could not extract any transaction data from the uploaded receipt');
        }
        const savedTransactions = []; // Array to store
        const errors = []; // Store any errors
        // Process each extracted transaction
        for (const extractedField of extractedFields) {
            try {
                // Basic validation for required transaction fields
                if (!extractedField || !extractedField.merchant || !extractedField.amount || !extractedField.date) {
                    console.warn('Skipping invalid transaction from extraction:', extractedField);
                    errors.push({ message: 'Transaction missing required fields (merchant/amount/date)', data: extractedField });
                    continue; // Skip to next extraction
                }
                // Check if category exists first
                let category = null; // Should be a Category type
                if (extractedField.category) {
                    // Simplified findFirst - just need the ID if it exists
                    // Ensure correct syntax for case-insensitive search
                    category = yield prisma.category.findFirst({
                        where: {
                            name: {
                                equals: extractedField.category // Removed mode: 'insensitive' for now
                            }
                        },
                        select: { id: true } // Only select the ID
                    });
                }
                // Validate amount is numeric before saving to database
                // This should be handled by Prisma schema, but let's be safe
                if (typeof extractedField.amount !== 'number') {
                    console.warn('Amount is not a number, cannot save transaction:', extractedField);
                    errors.push({ message: 'Transaction amount must be a number value', data: extractedField });
                    continue;
                }
                const newTransaction = yield prisma.transaction.create({
                    data: {
                        merchant: extractedField.merchant,
                        amount: extractedField.amount, // This should be a number
                        date: new Date(extractedField.date), // Convert string date to Date object
                        categoryId: category ? category.id : null, // Link to category if found
                        // description: We could add additional fields as needed
                    }
                });
                savedTransactions.push(newTransaction);
                console.log('Saved transaction:', newTransaction);
            }
            catch (innerError) { // Keep 'any' for now, consider 'unknown' later
                console.error(`Error saving extracted transaction ${JSON.stringify(extractedField)}:`, innerError);
                // Remove invalid 'error' property
                errors.push({ message: `Failed to save transaction ${extractedField.merchant}: ${innerError === null || innerError === void 0 ? void 0 : innerError.message}` }); // Store error info
            }
        }
        // Return success with saved transactions
        if (savedTransactions.length > 0) {
            res.status(201).json({
                message: `Processed ${extractedFields.length} potential transactions, successfully saved ${savedTransactions.length}`,
                transactions: savedTransactions,
                errors: errors.length > 0 ? errors : undefined, // Only include errors if any
            });
            return; // Early return on success
        }
        else {
            // If we couldn't save any transactions but tried to extract some, report error
            // with details about what went wrong for each extraction
            throw new Error(`Failed to save any transactions. ${errors.length} errors occurred.`);
        }
    }
    catch (error) { // Need to type this
        console.error('Receipt analysis error:', error);
        // Handle specific error types with appropriate status codes
        if (error instanceof multer_1.default.MulterError) {
            res.status(400).json({ message: `File upload error: ${error.message}` });
            return; // Early return on error
        }
        else if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.startsWith('Invalid file')) { // File-related errors
            res.status(400).json({ message: error.message });
            return; // Early return on error
        }
        // Catch-all for other server errors - don't expose internal details to client
        // but log them on the server side
        res.status(500).json({ message: 'Server error processing receipt' });
        return; // Explicit return for clarity
    }
}));
// GET all transactions - GET /api/transactions - Returns all transactions
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactions = yield prisma.transaction.findMany({
            orderBy: {
                date: 'desc', // Most recent transactions first
            },
            include: {
                category: true, // Include related category data
            }
        });
        res.json(transactions);
        return; // Explicit return for clarity
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Failed to retrieve transactions' });
        return; // Explicit return for clarity
    }
}));
// Update a transaction - PUT /api/transactions/:id
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Extract fields from request body
    const { merchant, amount, date, categoryId, description } = req.body;
    // Basic request validation
    if (!merchant || amount === undefined || !date) {
        res.status(400).json({ message: 'Merchant, amount, and date are required fields' });
        return; // Explicit return for clarity
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
        res.status(400).json({ message: 'Amount must be a number' });
        return; // Explicit return for clarity
    }
    const dateValue = new Date(date);
    if (isNaN(dateValue.getTime())) {
        res.status(400).json({ message: 'Invalid date format' });
        return; // Explicit return for clarity
    }
    // Category validation
    try {
        // Verify category exists if provided (to avoid foreign key constraint errors)
        if (categoryId) {
            const categoryExists = yield prisma.category.findUnique({
                where: { id: categoryId }
            });
            if (!categoryExists) {
                res.status(404).json({ message: `Category with ID ${categoryId} not found` });
                return; // Explicit return for clarity
            }
        }
        // Update the transaction
        const updatedTransaction = yield prisma.transaction.update({
            where: { id: id },
            data: {
                merchant: merchant,
                amount: amountNum,
                date: dateValue,
                categoryId: categoryId !== undefined ? categoryId : null, // Handle null categoryId
                description: description !== undefined ? description : null, // Same for description if provided
            },
            include: {
                category: true,
            }
        });
        console.log('Updated TX:', description);
        res.json(updatedTransaction);
        return; // Explicit return for clarity
    }
    catch (error) { // Type the error
        console.error(`Error updating transaction ${id}:`, error);
        // Handle not found error specifically
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') { // Prisma not found error
            res.status(404).json({ message: `Transaction with ID ${id} not found` });
            return; // Explicit return for clarity
        }
        res.status(500).json({ message: 'Failed to update transaction' });
        return; // Explicit return for clarity
    }
}));
// Delete a transaction - DELETE /api/transactions/:id
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.transaction.delete({
            where: { id: id }
        });
        console.log('Deleted TX:', id);
        // Return 204 No Content for successful deletion
        res.status(204).send();
        return; // Explicit return for clarity
    }
    catch (error) { // Type the error
        console.error(`Error deleting transaction ${id}:`, error);
        // Handle not found error specifically
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') { // Prisma not found error
            res.status(404).json({ message: `Transaction with ID ${id} not found` });
            return; // Explicit return for clarity
        }
        res.status(500).json({ message: 'Failed to delete transaction' });
        return; // Explicit return for clarity
    }
}));
// Get monthly spending summary grouped by category - GET /api/transactions/summary
router.get('/summary', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract query parameters
    // Type assertion should work correctly now with `Request` type
    const { month, year } = req.query;
    // Validate month and year
    if (!month || !year) {
        res.status(400).json({ message: 'Month and year parameters are required' });
        return; // Explicit return for clarity
    }
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12 || isNaN(yearNum)) {
        res.status(400).json({ message: 'Invalid month or year parameters' });
        return; // Explicit return for clarity
    }
    try {
        // Calculate start and end dates for the given month
        const startDate = new Date(yearNum, monthNum - 1, 1); // Month is 0-indexed
        const endDate = new Date(yearNum, monthNum, 0); // Last day of the month
        // Find all transactions for the given month with their categories
        const monthTransactions = yield prisma.transaction.findMany({
            where: {
                date: {
                    gte: startDate, // Greater than or equal to start date
                    lte: endDate // Less than or equal to end date
                },
                categoryId: {
                    not: null, // Only include categorized transactions (optional)
                }
            },
            select: {
                amount: true, // We need the amount
                date: true, // Include date for debugging/reference
                categoryId: true, // Include the category ID
            },
            orderBy: {
                // Correct orderBy syntax
                date: 'desc'
            }
        });
        // Get all category IDs from transactions
        const categoryIds = monthTransactions.map(item => item.categoryId).filter(id => id !== null);
        const categories = yield prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, iconName: true }, // Select fields needed
        });
        const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
        // Calculate total spent per category using the defined interface
        const spendingByCategory = monthTransactions.map(item => {
            var _a;
            const category = item.categoryId ? categoryMap.get(item.categoryId) : null;
            return {
                categoryId: item.categoryId,
                categoryName: category === null || category === void 0 ? void 0 : category.name,
                // Ensure type compatibility: provide undefined if iconName is null or undefined
                categoryIcon: (_a = category === null || category === void 0 ? void 0 : category.iconName) !== null && _a !== void 0 ? _a : undefined,
                totalSpent: item.amount || 0
            };
        });
        res.json(spendingByCategory);
        return; // Explicit return for clarity
    }
    catch (error) { // Type the error
        console.error(`Error generating category summary for ${year}-${month}:`, error);
        res.status(500).json({ message: 'Error generating monthly spending summary' });
        return; // Explicit return for clarity
    }
}));
/**
 * @route  DELETE /api/transactions/clear
 * @desc   Clear all transactions from database
 * @access Public (in a real app, this should be admin-only)
 */
// Add explicit types for req and res
router.delete('/clear', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use deleteMany to remove all transactions
        yield prisma.transaction.deleteMany({});
        res.status(200).json({
            success: true,
            message: 'All transactions have been deleted'
        });
    }
    catch (error) {
        console.error('Error clearing transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while clearing transactions'
        });
    }
}));
exports.default = router;
//# sourceMappingURL=transactionRoutes.js.map