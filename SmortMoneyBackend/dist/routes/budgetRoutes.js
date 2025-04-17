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
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// GET /api/budgets - Get all budgets (potentially filtered by month/year)
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { month, year } = req.query; // Allow filtering by month and year query params
    const whereClause = {}; // Add type annotation
    if (month)
        whereClause.month = parseInt(month, 10); // Add type assertion
    if (year) {
        const parsedYear = parseInt(year, 10);
        if (isNaN(parsedYear)) {
            res.status(400).json({ message: 'Invalid year parameter.' });
            return; // Explicitly return void
        }
        whereClause.year = parsedYear;
    }
    if (month) {
        const parsedMonth = parseInt(month, 10);
        if (isNaN(parsedMonth)) {
            res.status(400).json({ message: 'Invalid month parameter.' });
            return; // Explicitly return void
        }
        whereClause.month = parsedMonth;
    }
    // Further validation (e.g., month range) could be added here if needed
    try {
        const budgets = yield prisma.budget.findMany({
            where: whereClause,
            include: { category: true }, // Include category details
            orderBy: [
                { year: 'asc' },
                { month: 'asc' },
                { category: { name: 'asc' } }
            ]
        });
        res.json(budgets);
        return; // Explicitly return void
    }
    catch (error) { // Add type annotation for error
        console.error('Error fetching budgets:', error);
        res.status(500).json({ message: 'Error fetching budgets' });
        return; // Explicitly return void from catch
    }
}));
// GET /api/budgets/:id - Get a single budget by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const budget = yield prisma.budget.findUnique({
            where: { id: id },
            include: { category: true }, // Include category details
        });
        if (budget) {
            res.json(budget);
            return; // Explicitly return void
        }
        else {
            res.status(404).json({ message: 'Budget not found' });
            return; // Explicitly return void
        }
    }
    catch (error) { // Add type annotation for error
        console.error(`Error fetching budget ${id}:`, error);
        res.status(500).json({ message: 'Error fetching budget' });
        return; // Explicitly return void from catch
    }
}));
// POST /api/budgets - Create a new budget
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { categoryId, amount, month, year } = req.body;
    // Basic validation
    if (!categoryId || amount === undefined || !month || !year) {
        res.status(400).json({ message: 'Missing required fields: categoryId, amount, month, year' });
        return; // Explicitly return void
    }
    const parsedAmount = parseFloat(amount);
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedAmount) || isNaN(parsedMonth) || isNaN(parsedYear) || parsedMonth < 1 || parsedMonth > 12) {
        res.status(400).json({ message: 'Invalid data types or values for amount, month, or year.' });
        return; // Explicitly return void
    }
    try {
        // Check if category exists
        const categoryExists = yield prisma.category.findUnique({ where: { id: categoryId } });
        if (!categoryExists) {
            res.status(404).json({ message: `Category with ID ${categoryId} not found.` });
            return; // Explicitly return void
        }
        const newBudget = yield prisma.budget.create({
            data: {
                categoryId: categoryId,
                amount: parsedAmount,
                month: parsedMonth,
                year: parsedYear,
            },
            include: { category: true }, // Include category details in response
        });
        res.status(201).json(newBudget);
        return; // Explicitly return void
    }
    catch (error) { // Add type annotation for error
        // Handle potential unique constraint violation (categoryId, month, year)
        // Use optional chaining for safer access to error properties
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2002' && ((_b = (_a = error === null || error === void 0 ? void 0 : error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('categoryId_month_year'))) {
            res.status(409).json({ message: `A budget for this category already exists for ${month}/${year}.` });
            return; // Explicitly return void
        }
        console.error('Error creating budget:', error);
        res.status(500).json({ message: 'Error creating budget' });
        return; // Explicitly return void from catch
    }
}));
// PUT /api/budgets/:id - Update a budget (typically just the amount)
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { amount } = req.body; // Usually only amount is updatable for a specific budget entry
    if (amount === undefined) {
        res.status(400).json({ message: 'Amount is required for update' });
        return; // Explicitly return void
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
        res.status(400).json({ message: 'Invalid amount value.' });
        return; // Explicitly return void
    }
    try {
        const updatedBudget = yield prisma.budget.update({
            where: { id: id },
            data: {
                amount: parsedAmount,
            },
            include: { category: true }, // Include category details
        });
        res.json(updatedBudget);
        return; // Explicitly return void
    }
    catch (error) { // Add type annotation for error
        // Handle case where the budget to update doesn't exist
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') { // Use optional chaining
            res.status(404).json({ message: `Budget with ID ${id} not found.` });
            return; // Explicitly return void
        }
        console.error(`Error updating budget ${id}:`, error);
        res.status(500).json({ message: 'Error updating budget' });
        return; // Explicitly return void from catch
    }
}));
// DELETE /api/budgets/:id - Delete a budget
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.budget.delete({
            where: { id: id },
        });
        res.status(204).send(); // No content on successful deletion
        return; // Explicitly return void
    }
    catch (error) { // Add type annotation for error
        // Handle case where the budget to delete doesn't exist
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') { // Use optional chaining
            res.status(404).json({ message: `Budget with ID ${id} not found.` });
            return; // Explicitly return void
        }
        console.error(`Error deleting budget ${id}:`, error);
        res.status(500).json({ message: 'Error deleting budget' });
        return; // Explicitly return void from catch
    }
}));
exports.default = router;
//# sourceMappingURL=budgetRoutes.js.map