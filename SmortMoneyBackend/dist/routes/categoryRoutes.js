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
// GET /api/categories - Get all categories
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma.category.findMany({
            orderBy: { name: 'asc' } // Optional: order by name
        });
        res.json(categories);
        return; // Explicitly return void
    }
    catch (error) { // Add type annotation
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
        return; // Explicitly return void from catch
    }
}));
// GET /api/categories/:id - Get a single category by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const category = yield prisma.category.findUnique({
            where: { id: id },
        });
        if (category) {
            res.json(category);
            return; // Explicitly return void
        }
        else {
            res.status(404).json({ message: 'Category not found' });
            return; // Explicitly return void
        }
    }
    catch (error) { // Add type annotation
        console.error(`Error fetching category ${id}:`, error);
        res.status(500).json({ message: 'Error fetching category' });
        return; // Explicitly return void from catch
    }
}));
// POST /api/categories - Create a new category
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Define expected body structure
    const { name, iconName } = req.body;
    if (!name) {
        res.status(400).json({ message: 'Category name is required' });
        return; // Explicitly return void
    }
    try {
        const newCategory = yield prisma.category.create({
            data: {
                name: name,
                iconName: iconName, // Will be null if not provided
            },
        });
        res.status(201).json(newCategory);
        return; // Explicitly return void
    }
    catch (error) { // Add type annotation
        // Handle potential unique constraint violation (duplicate name)
        // Use optional chaining for safer access
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2002' && ((_b = (_a = error === null || error === void 0 ? void 0 : error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('name'))) {
            res.status(409).json({ message: `Category with name "${name}" already exists.` });
            return; // Explicitly return void
        }
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Error creating category' });
        return; // Explicitly return void from catch
    }
}));
// PUT /api/categories/:id - Update a category
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    // Define expected body structure
    const { name, iconName } = req.body;
    // Basic validation: Allow updating name, iconName, or both
    if (name === undefined && iconName === undefined) {
        res.status(400).json({ message: 'No update data provided (name or iconName required)' });
        return; // Explicitly return void
    }
    // Define type for updateData
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    // Allow setting iconName to null explicitly or providing a string
    if (iconName !== undefined)
        updateData.iconName = iconName;
    try {
        const updatedCategory = yield prisma.category.update({
            where: { id: id },
            data: updateData,
        });
        res.json(updatedCategory);
        return; // Explicitly return void
    }
    catch (error) { // Add type annotation
        // Handle potential unique constraint violation on name update
        // Use optional chaining
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2002' && ((_b = (_a = error === null || error === void 0 ? void 0 : error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('name'))) {
            res.status(409).json({ message: `Category with name "${name}" already exists.` });
            return; // Explicitly return void
        }
        // Handle case where the category to update doesn't exist
        // Use optional chaining
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') {
            res.status(404).json({ message: `Category with ID ${id} not found.` });
            return; // Explicitly return void
        }
        console.error(`Error updating category ${id}:`, error);
        res.status(500).json({ message: 'Error updating category' });
        return; // Explicitly return void from catch
    }
}));
// DELETE /api/categories/:id - Delete a category
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // TODO: Consider implications - what happens to transactions linked to this category?
        // Option 1: Set categoryId on transactions to null (requires schema change or careful handling)
        // Option 2: Prevent deletion if transactions are linked
        // Option 3: Delete associated transactions (dangerous!)
        // Current implementation: Simple delete. Add checks/logic as needed.
        yield prisma.category.delete({
            where: { id: id },
        });
        res.status(204).send(); // No content on successful deletion
        return; // Explicitly return void
    }
    catch (error) { // Add type annotation
        // Handle case where the category to delete doesn't exist
        // Use optional chaining
        if ((error === null || error === void 0 ? void 0 : error.code) === 'P2025') {
            res.status(404).json({ message: `Category with ID ${id} not found.` });
            return; // Explicitly return void
        }
        // Handle potential foreign key constraint issues if transactions are linked
        // (Prisma might throw P2003 or similar depending on DB and relations)
        console.error(`Error deleting category ${id}:`, error);
        res.status(500).json({ message: 'Error deleting category' });
        return; // Explicitly return void from catch
    }
}));
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map