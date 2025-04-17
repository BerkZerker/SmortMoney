import express, { Request, Response, Router, NextFunction } from 'express'; // Import necessary types
import multer from 'multer';
import { PrismaClient, Category, Transaction } from '@prisma/client'; // Import Prisma Client and types
import { analyzeTransactionImage, GeminiTransactionResult } from '../services/geminiService'; // Import Gemini service and its result type

const router: Router = express.Router();
const prisma = new PrismaClient(); // Instantiate Prisma Client

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size (e.g., 10MB)
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => { // Add types
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // Pass an error to cb to reject the file
      cb(new Error('Not an image! Please upload an image file.'));
    }
  },
});

// POST /api/transactions/upload
// The 'screenshot' string should match the key used in the FormData on the frontend
router.post('/upload', upload.single('screenshot'), async (req: Request, res: Response, next: NextFunction) => { // Add next for error handling
  // --- DEBUGGING ---
  console.log('--- Request Received ---');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  // Use type assertion for req.file as Express.Multer.File
  console.log('req.file:', req.file as Express.Multer.File);
  console.log('req.body:', req.body); // Log any other form fields
  console.log('--- End Request ---');
  // --- END DEBUGGING ---

  try {
    // Use type assertion for req.file
    const file = req.file as Express.Multer.File;
    if (!file) {
      console.error('req.file is undefined or null.');
      res.status(400).json({ message: 'No image file uploaded.' });
      return; // Explicitly return void
    }

    console.log('Image received:', file.originalname, file.mimetype, file.size);

    // 1. Analyze the image using Gemini Service
    // Assuming analyzeTransactionImage returns Promise<GeminiTransactionResult[]>
    const analysisResult: GeminiTransactionResult[] = await analyzeTransactionImage(file.buffer, file.mimetype);

    // Validate analysis result
    if (!Array.isArray(analysisResult) || analysisResult.length === 0) {
      throw new Error('Gemini analysis did not return a valid array of transactions.');
    }

    const savedTransactions: Transaction[] = []; // Type the array
    const errors: { message: string; data?: any; error?: string }[] = []; // Type the errors array

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
        let category: Category | null = null; // Type the category variable
        if (transactionData.category) {
          category = await prisma.category.upsert({
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
        const newTransaction: Transaction = await prisma.transaction.create({ // Type the result
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

      } catch (loopError: any) { // Type the loop error
          console.error(`Error processing transaction item: ${JSON.stringify(transactionData)}`, loopError);
          errors.push({ message: `Error saving transaction for ${transactionData.merchant || 'unknown'}.`, error: loopError?.message }); // Use optional chaining
      }
    }

    // Send the response for saved transactions
    if (savedTransactions.length > 0) {
        res.status(201).json({ // Don't return here
          message: `Processed ${analysisResult.length} potential transactions. Saved ${savedTransactions.length}.`,
          transactions: savedTransactions,
          errors: errors.length > 0 ? errors : undefined, // Include errors if any occurred
        });
        return; // Explicitly return void
    } else {
        // If no transactions were saved, it's likely due to errors or invalid data
        // Let the error be caught by the main catch block
        throw new Error(`Failed to save any transactions. ${errors.length} errors occurred.`);
    }

  } catch (error: any) { // Type the main error
    console.error('Error in /upload route:', error);
    // Handle specific multer errors (like file size limit) if needed
    if (error instanceof multer.MulterError) {
        res.status(400).json({ message: `Multer error: ${error.message}` });
        return; // Explicitly return void
    } else if (error?.message?.startsWith('Not an image!')) { // Use optional chaining
        res.status(400).json({ message: error.message });
        return; // Explicitly return void
    }
    // Pass other errors to a generic error handler (if implemented) or return 500
    // next(error); // Or handle directly:
    res.status(500).json({ message: 'Server error during upload.' });
    return; // Explicitly return void from catch
  }
});

// GET /api/transactions - Fetch all transactions, sorted by date descending
router.get('/', async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        date: 'desc', // Sort by date, newest first
      },
      include: {
        category: true, // Include related category details
      },
    });
    res.json(transactions);
    return; // Explicitly return void
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions.' });
    return; // Explicitly return void from catch
  }
});


// PUT /api/transactions/:id - Update a transaction
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  // Expecting multiple fields in the body
  const { merchant, amount, date, categoryId, description } = req.body;

  // --- Basic Validation ---
  if (!merchant || amount === undefined || !date) {
    res.status(400).json({ message: 'Missing required fields: merchant, amount, date.' });
    return; // Explicitly return void
  }
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    res.status(400).json({ message: 'Invalid amount provided.' });
    return; // Explicitly return void
  }
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ message: 'Invalid date format provided.' });
      return; // Explicitly return void
  }
  // --- End Validation ---

  try {
    // Check if the category exists (if categoryId is provided and not null)
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) {
        res.status(404).json({ message: `Category with ID ${categoryId} not found.` });
        return; // Explicitly return void
      }
    }

    // Update the transaction
    const updatedTransaction: Transaction = await prisma.transaction.update({ // Type the result
      where: { id: id },
      data: {
        merchant: merchant,
        amount: parsedAmount,
        date: parsedDate,
        categoryId: categoryId !== undefined ? categoryId : null, // Allow unsetting category
        description: description !== undefined ? description : null, // Allow setting/unsetting description
      },
      include: { // Optionally include category details in the response
        category: true,
      },
    });

    console.log(`Transaction ${id} updated.`);
    res.json(updatedTransaction);
    return; // Explicitly return void

  } catch (error: any) { // Type the error
    console.error(`Error updating transaction ${id}:`, error);
    // Handle specific Prisma errors, e.g., record not found
    if (error?.code === 'P2025') { // Use optional chaining
      res.status(404).json({ message: `Transaction with ID ${id} not found.` });
      return; // Explicitly return void
    }
    res.status(500).json({ message: 'Server error updating transaction.' });
    return; // Explicitly return void from catch
  }
});

// DELETE /api/transactions/:id - Delete a transaction
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.transaction.delete({
      where: { id: id },
    });

    console.log(`Transaction ${id} deleted.`);
    // Send a 204 No Content response for successful deletion
    res.status(204).send();
    return; // Explicitly return void

  } catch (error: any) { // Type the error
    console.error(`Error deleting transaction ${id}:`, error);
    // Handle specific Prisma errors, e.g., record not found
    if (error?.code === 'P2025') { // Use optional chaining
      res.status(404).json({ message: `Transaction with ID ${id} not found.` });
      return; // Explicitly return void
    }
    res.status(500).json({ message: 'Server error deleting transaction.' });
    return; // Explicitly return void from catch
  }
});


// GET /api/transactions/summary - Get total spending per category for a given period
router.get('/summary', async (req: Request, res: Response) => {
  // Type the query parameters
  const { month, year } = req.query as { month?: string; year?: string };

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
    const spendingSummary = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        date: {
          gte: startDate, // Greater than or equal to start date
          lt: endDate,    // Less than start of next month
        },
        categoryId: {
          not: null, // Exclude transactions without a category
        },
      },
      _sum: {
        amount: true, // Sum the amount field
      },
      orderBy: { // Optional: order by total spent descending
        _sum: {
          amount: 'desc',
        },
      },
    });

    // Fetch category names for the summary
    const categoryIds = spendingSummary.map(item => item.categoryId).filter(id => id !== null) as string[];
    const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, iconName: true } // Select needed fields
    });
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));


    // Format the result for easier frontend consumption
    // Define type for the summary item
    interface FormattedSummaryItem {
        categoryId: string | null;
        categoryName?: string;
        categoryIcon?: string | null;
        totalSpent: number;
    }
    const formattedSummary: FormattedSummaryItem[] = spendingSummary.map(item => {
        const category = item.categoryId ? categoryMap.get(item.categoryId) : null;
        return {
            categoryId: item.categoryId,
            categoryName: category?.name,
            categoryIcon: category?.iconName,
            totalSpent: item._sum.amount || 0,
        };
    });

    res.json(formattedSummary);
    return; // Explicitly return void

  } catch (error: any) { // Type the error
    console.error(`Error fetching transaction summary for ${year}-${month}:`, error);
    res.status(500).json({ message: 'Server error fetching transaction summary.' });
    return; // Explicitly return void from catch
  }
});


export default router;
