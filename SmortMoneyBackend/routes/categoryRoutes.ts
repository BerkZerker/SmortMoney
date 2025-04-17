import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

// GET /api/categories - Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' } // Optional: order by name
    });
    res.json(categories);
    return; // Explicitly return void
  } catch (error: any) { // Add type annotation
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
    return; // Explicitly return void from catch
  }
});

// GET /api/categories/:id - Get a single category by ID
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.findUnique({
      where: { id: id },
    });
    if (category) {
      res.json(category);
      return; // Explicitly return void
    } else {
      res.status(404).json({ message: 'Category not found' });
      return; // Explicitly return void
    }
  } catch (error: any) { // Add type annotation
    console.error(`Error fetching category ${id}:`, error);
    res.status(500).json({ message: 'Error fetching category' });
    return; // Explicitly return void from catch
  }
});

// POST /api/categories - Create a new category
router.post('/', async (req: Request, res: Response) => {
  // Define expected body structure
  const { name, iconName }: { name: string; iconName?: string | null } = req.body;

  if (!name) {
    res.status(400).json({ message: 'Category name is required' });
    return; // Explicitly return void
  }

  try {
    const newCategory = await prisma.category.create({
      data: {
        name: name,
        iconName: iconName, // Will be null if not provided
      },
    });
    res.status(201).json(newCategory);
    return; // Explicitly return void
  } catch (error: any) { // Add type annotation
    // Handle potential unique constraint violation (duplicate name)
    // Use optional chaining for safer access
    if (error?.code === 'P2002' && error?.meta?.target?.includes('name')) {
      res.status(409).json({ message: `Category with name "${name}" already exists.` });
      return; // Explicitly return void
    }
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
    return; // Explicitly return void from catch
  }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  // Define expected body structure
  const { name, iconName }: { name?: string; iconName?: string | null } = req.body;

  // Basic validation: Allow updating name, iconName, or both
  if (name === undefined && iconName === undefined) {
      res.status(400).json({ message: 'No update data provided (name or iconName required)' });
      return; // Explicitly return void
  }

  // Define type for updateData
  const updateData: { name?: string; iconName?: string | null } = {};
  if (name !== undefined) updateData.name = name;
  // Allow setting iconName to null explicitly or providing a string
  if (iconName !== undefined) updateData.iconName = iconName;


  try {
    const updatedCategory = await prisma.category.update({
      where: { id: id },
      data: updateData,
    });
    res.json(updatedCategory);
    return; // Explicitly return void
  } catch (error: any) { // Add type annotation
     // Handle potential unique constraint violation on name update
     // Use optional chaining
    if (error?.code === 'P2002' && error?.meta?.target?.includes('name')) {
      res.status(409).json({ message: `Category with name "${name}" already exists.` });
      return; // Explicitly return void
    }
    // Handle case where the category to update doesn't exist
    // Use optional chaining
    if (error?.code === 'P2025') {
        res.status(404).json({ message: `Category with ID ${id} not found.` });
        return; // Explicitly return void
    }
    console.error(`Error updating category ${id}:`, error);
    res.status(500).json({ message: 'Error updating category' });
    return; // Explicitly return void from catch
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // TODO: Consider implications - what happens to transactions linked to this category?
    // Option 1: Set categoryId on transactions to null (requires schema change or careful handling)
    // Option 2: Prevent deletion if transactions are linked
    // Option 3: Delete associated transactions (dangerous!)
    // Current implementation: Simple delete. Add checks/logic as needed.

    await prisma.category.delete({
      where: { id: id },
    });
    res.status(204).send(); // No content on successful deletion
    return; // Explicitly return void
  } catch (error: any) { // Add type annotation
     // Handle case where the category to delete doesn't exist
     // Use optional chaining
    if (error?.code === 'P2025') {
        res.status(404).json({ message: `Category with ID ${id} not found.` });
        return; // Explicitly return void
    }
    // Handle potential foreign key constraint issues if transactions are linked
    // (Prisma might throw P2003 or similar depending on DB and relations)
    console.error(`Error deleting category ${id}:`, error);
    res.status(500).json({ message: 'Error deleting category' });
    return; // Explicitly return void from catch
  }
});


export default router;
