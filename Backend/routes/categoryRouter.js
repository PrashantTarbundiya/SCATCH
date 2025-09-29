import express from 'express';
import Category from '../models/category-model.js';
import Product from '../models/product-model.js';
import isOwner from '../middleware/isOwner.js';
import { productLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET all categories (public)
router.get('/', async (req, res) => {
    try {
        const { active, featured, parent } = req.query;
        
        const filter = {};
        if (active !== undefined) filter.isActive = active === 'true';
        if (featured !== undefined) filter.isFeatured = featured === 'true';
        if (parent !== undefined) filter.parentCategory = parent === 'null' ? null : parent;
        
        const categories = await Category.find(filter)
            .populate('parentCategory', 'name slug')
            .sort({ sortOrder: 1, name: 1 });
        
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET single category by slug (public)
router.get('/:slug', async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug })
            .populate('parentCategory', 'name slug')
            .populate({
                path: 'subcategories',
                select: 'name slug image icon productCount isActive isFeatured'
            });
        
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        
        res.json({ success: true, category });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET category hierarchy (public) - returns tree structure
router.get('/hierarchy/tree', async (req, res) => {
    try {
        // Get all root categories (no parent)
        const rootCategories = await Category.find({ 
            parentCategory: null,
            isActive: true 
        })
        .sort({ sortOrder: 1, name: 1 })
        .lean();
        
        // Recursively populate subcategories
        const populateSubcategories = async (category) => {
            const subcategories = await Category.find({ 
                parentCategory: category._id,
                isActive: true 
            })
            .sort({ sortOrder: 1, name: 1 })
            .lean();
            
            category.subcategories = await Promise.all(
                subcategories.map(sub => populateSubcategories(sub))
            );
            
            return category;
        };
        
        const hierarchy = await Promise.all(
            rootCategories.map(cat => populateSubcategories(cat))
        );
        
        res.json({ success: true, hierarchy });
    } catch (error) {
        console.error('Error fetching category hierarchy:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET featured categories (public)
router.get('/featured/list', async (req, res) => {
    try {
        const featured = await Category.find({ 
            isFeatured: true,
            isActive: true 
        })
        .sort({ sortOrder: 1, name: 1 })
        .select('name slug description image icon productCount')
        .limit(8);
        
        res.json({ success: true, categories: featured });
    } catch (error) {
        console.error('Error fetching featured categories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create category (owner only)
router.post('/', isOwner, productLimiter, async (req, res) => {
    try {
        const { name, description, image, icon, parentCategory, isFeatured, sortOrder, metadata } = req.body;
        
        // Generate slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        // Check if category with this slug already exists
        const existing = await Category.findOne({ slug });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                error: 'Category with this name already exists' 
            });
        }
        
        const category = await Category.create({
            name,
            slug,
            description,
            image,
            icon,
            parentCategory: parentCategory || null,
            isFeatured: isFeatured || false,
            sortOrder: sortOrder || 0,
            metadata
        });
        
        res.status(201).json({ 
            success: true, 
            message: 'Category created successfully',
            category 
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update category (owner only)
router.put('/:id', isOwner, productLimiter, async (req, res) => {
    try {
        const { name, description, image, icon, parentCategory, isActive, isFeatured, sortOrder, metadata } = req.body;
        
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        
        // If name is being changed, regenerate slug
        if (name && name !== category.name) {
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            // Check if new slug conflicts with existing category
            const existing = await Category.findOne({ slug, _id: { $ne: req.params.id } });
            if (existing) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Category with this name already exists' 
                });
            }
            
            category.name = name;
            category.slug = slug;
        }
        
        if (description !== undefined) category.description = description;
        if (image !== undefined) category.image = image;
        if (icon !== undefined) category.icon = icon;
        if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
        if (isActive !== undefined) category.isActive = isActive;
        if (isFeatured !== undefined) category.isFeatured = isFeatured;
        if (sortOrder !== undefined) category.sortOrder = sortOrder;
        if (metadata !== undefined) category.metadata = metadata;
        
        await category.save();
        
        res.json({ 
            success: true, 
            message: 'Category updated successfully',
            category 
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE category (owner only)
router.delete('/:id', isOwner, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        
        // Check if category has products
        const productCount = await Product.countDocuments({ category: req.params.id });
        if (productCount > 0) {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot delete category with ${productCount} products. Please reassign or delete products first.` 
            });
        }
        
        // Check if category has subcategories
        const subcategoryCount = await Category.countDocuments({ parentCategory: req.params.id });
        if (subcategoryCount > 0) {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot delete category with ${subcategoryCount} subcategories. Please reassign or delete subcategories first.` 
            });
        }
        
        await Category.findByIdAndDelete(req.params.id);
        
        res.json({ 
            success: true, 
            message: 'Category deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST update product counts for all categories (owner only)
router.post('/refresh/counts', isOwner, async (req, res) => {
    try {
        const categories = await Category.find({});
        
        for (const category of categories) {
            const count = await Product.countDocuments({ category: category._id });
            category.productCount = count;
            await category.save();
        }
        
        res.json({ 
            success: true, 
            message: 'Product counts updated successfully',
            updated: categories.length 
        });
    } catch (error) {
        console.error('Error updating product counts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;