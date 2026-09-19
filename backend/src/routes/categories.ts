import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/categories - Fetch category taxonomy tree
router.get('/', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        categories: {
          include: {
            subcategories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = departments.map((dept: any) => ({
      id: dept.id,
      name: dept.name,
      slug: dept.slug,
      categories: dept.categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        subcategories: cat.subcategories.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
        })),
      })),
    }));

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch categories.' },
    });
  }
});

export default router;
