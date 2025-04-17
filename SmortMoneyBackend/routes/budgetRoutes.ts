import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

// GET /api/budgets - Get all budgets (potentially filtered by month/year)
router.get('/', async (req: Request, res: Response) => {
  const { month, year } = req.query; // Allow filtering by month and year query params

  const whereClause: { month?: number; year?: number } = {}; // Add type annotation
  if (month) whereClause.month = parseInt(month as string, 10); // Add type assertion
  if (year) {
      const parsedYear = parseInt(year as string, 10);
      if (isNaN(parsedYear)) {
          res.status(400).json({ message: 'Invalid year parameter.' });
          return; // Explicitly return void
      }
      whereClause.year = parsedYear;
  }
  if (month) {
      const parsedMonth = parseInt(month as string, 10);
      if (isNaN(parsedMonth)) {
          res.status(400).json({ message: 'Invalid month parameter.' });
          return; // Explicitly return void
      }
      whereClause.month = parsedMonth;
  }

  // Further validation (e.g., month range) could be added here if needed

  try {
    const budgets = await prisma.budget.findMany({
      where: whereClause,
      include: { category: true }, // Include category details
      orderBy: [ // Optional: order by year, month, then category name
        { year: 'asc' },
        { month: 'asc' },
        { category: { name: 'asc' } }
      ]
    });
    res.json(budgets);
    return; // Explicitly return void
  } catch (error: any) { // Add type annotation for error
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Error fetching budgets' });
    return; // Explicitly return void from catch
  }
});

// GET /api/budgets/:id - Get a single budget by ID
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: id },
      include: { category: true }, // Include category details
    });
    if (budget) {
      res.json(budget);
      return; // Explicitly return void
    } else {
      res.status(404).json({ message: 'Budget not found' });
      return; // Explicitly return void
    }
  } catch (error: any) { // Add type annotation for error
    console.error(`Error fetching budget ${id}:`, error);
    res.status(500).json({ message: 'Error fetching budget' });
    return; // Explicitly return void from catch
  }
});

// POST /api/budgets - Create a new budget
router.post('/', async (req: Request, res: Response) => {
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
    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
        res.status(404).json({ message: `Category with ID ${categoryId} not found.` });
        return; // Explicitly return void
    }

    const newBudget = await prisma.budget.create({
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
  } catch (error: any) { // Add type annotation for error
    // Handle potential unique constraint violation (categoryId, month, year)
    // Use optional chaining for safer access to error properties
    if (error?.code === 'P2002' && error?.meta?.target?.includes('categoryId_month_year')) {
      res.status(409).json({ message: `A budget for this category already exists for ${month}/${year}.` });
      return; // Explicitly return void
    }
    console.error('Error creating budget:', error);
    res.status(500).json({ message: 'Error creating budget' });
    return; // Explicitly return void from catch
  }
});

// PUT /api/budgets/:id - Update a budget (typically just the amount)
router.put('/:id', async (req: Request, res: Response) => {
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
    const updatedBudget = await prisma.budget.update({
      where: { id: id },
      data: {
        amount: parsedAmount,
      },
      include: { category: true }, // Include category details
    });
    res.json(updatedBudget);
    return; // Explicitly return void
  } catch (error: any) { // Add type annotation for error
    // Handle case where the budget to update doesn't exist
    if (error?.code === 'P2025') { // Use optional chaining
        res.status(404).json({ message: `Budget with ID ${id} not found.` });
        return; // Explicitly return void
    }
    console.error(`Error updating budget ${id}:`, error);
    res.status(500).json({ message: 'Error updating budget' });
    return; // Explicitly return void from catch
  }
});

// DELETE /api/budgets/:id - Delete a budget
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.budget.delete({
      where: { id: id },
    });
    res.status(204).send(); // No content on successful deletion
    return; // Explicitly return void
  } catch (error: any) { // Add type annotation for error
    // Handle case where the budget to delete doesn't exist
    if (error?.code === 'P2025') { // Use optional chaining
        res.status(404).json({ message: `Budget with ID ${id} not found.` });
        return; // Explicitly return void
    }
    console.error(`Error deleting budget ${id}:`, error);
    res.status(500).json({ message: 'Error deleting budget' });
    return; // Explicitly return void from catch
  }
});


export default router;
