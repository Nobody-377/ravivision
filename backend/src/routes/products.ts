import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/products - Fetch active products with filtering, search & pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string)?.trim() || '';
    const category = (req.query.category as string)?.trim() || '';
    const department = (req.query.department as string)?.trim() || '';
    const brand = (req.query.brand as string)?.trim() || '';
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: { in: ['ACTIVE', 'OUT_OF_STOCK'] },
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.productDefinition = {
        subcategory: {
          category: {
            name: { equals: category, mode: 'insensitive' },
          },
        },
      };
    }

    if (department) {
      whereClause.productDefinition = {
        subcategory: {
          category: {
            department: {
              name: { equals: department, mode: 'insensitive' },
            },
          },
        },
      };
    }

    if (brand) {
      whereClause.brand = { equals: brand, mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          productDefinition: {
            include: {
              subcategory: {
                include: {
                  category: {
                    include: {
                      department: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    const formatted = products.map((p: any) => {
      const primaryImg = p.images.find((i: any) => i.isPrimary)?.url || p.images[0]?.url || '';
      const priceNum = Number(p.price);
      const mrpNum = p.mrp ? Number(p.mrp) : priceNum;
      const discount = mrpNum > priceNum ? `${Math.round(((mrpNum - priceNum) / mrpNum) * 100)}% OFF` : null;

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        description: p.description,
        price: priceNum,
        mrp: mrpNum,
        discount,
        stock: p.stock,
        status: p.status,
        isAvailable: p.status === 'ACTIVE' && p.stock > 0,
        image: primaryImg,
        images: p.images.map((img: any) => img.url),
        categoryName: p.productDefinition?.subcategory?.category?.name || 'Electronics',
        departmentName: p.productDefinition?.subcategory?.category?.department?.name || 'General',
        specs: p.specifications ? JSON.parse(p.specifications) : {},
      };
    });

    return res.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch products.' },
    });
  }
});

// GET /api/products/:slugOrId - Fetch single product details
router.get('/:slugOrId', async (req: Request, res: Response) => {
  try {
    const rawParam = req.params.slugOrId;
    const slugOrId = String(Array.isArray(rawParam) ? rawParam[0] : rawParam);

    const product: any = await prisma.product.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        productDefinition: {
          include: {
            subcategory: {
              include: {
                category: {
                  include: {
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' },
      });
    }

    const primaryImg = product.images.find((i: any) => i.isPrimary)?.url || product.images[0]?.url || '';
    const priceNum = Number(product.price);
    const mrpNum = product.mrp ? Number(product.mrp) : priceNum;
    const discount = mrpNum > priceNum ? `${Math.round(((mrpNum - priceNum) / mrpNum) * 100)}% OFF` : null;

    const formatted = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      description: product.description,
      price: priceNum,
      mrp: mrpNum,
      discount,
      stock: product.stock,
      status: product.status,
      isAvailable: product.status === 'ACTIVE' && product.stock > 0,
      image: primaryImg,
      images: product.images.map((img: any) => img.url),
      categoryName: product.productDefinition?.subcategory?.category?.name || 'Electronics',
      departmentName: product.productDefinition?.subcategory?.category?.department?.name || 'General',
      specs: product.specifications ? JSON.parse(product.specifications) : {},
    };

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching product details:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch product details.' },
    });
  }
});

export default router;
