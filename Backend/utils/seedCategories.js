import Category from '../models/category-model.js';
import connectDB from '../config/mongoose-connection.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const categories = [
    {
        name: 'Men\'s Fashion',
        slug: 'mens-fashion',
        description: 'Clothing, shoes, and accessories for men',
        image: 'https://api.iconify.design/mdi/tshirt-crew.svg?color=%234f46e5&width=80&height=80',
        icon: 'tshirt-crew',
        isFeatured: true,
        sortOrder: 1
    },
    {
        name: 'Women\'s Fashion',
        slug: 'womens-fashion',
        description: 'Clothing, shoes, and accessories for women',
        image: 'https://api.iconify.design/mdi/hanger.svg?color=%23ec4899&width=80&height=80',
        icon: 'hanger',
        isFeatured: true,
        sortOrder: 2
    },
    {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Phones, laptops, cameras, and gadgets',
        image: 'https://api.iconify.design/mdi/devices.svg?color=%2306b6d4&width=80&height=80',
        icon: 'devices',
        isFeatured: true,
        sortOrder: 3
    },
    {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Furniture, appliances, and home decor',
        image: 'https://api.iconify.design/mdi/silverware-fork-knife.svg?color=%2310b981&width=80&height=80',
        icon: 'silverware-fork-knife',
        isFeatured: true,
        sortOrder: 4
    },
    {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Fitness equipment, outdoor gear, and sportswear',
        image: 'https://api.iconify.design/mdi/basketball.svg?color=%23f59e0b&width=80&height=80',
        icon: 'basketball',
        isFeatured: true,
        sortOrder: 5
    },
    {
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        description: 'Skincare, makeup, and grooming products',
        image: 'https://api.iconify.design/mdi/lipstick.svg?color=%23f43f5e&width=80&height=80',
        icon: 'lipstick',
        isFeatured: true,
        sortOrder: 6
    },
    {
        name: 'Books & Media',
        slug: 'books-media',
        description: 'Books, magazines, music, and movies',
        image: 'https://api.iconify.design/mdi/book-open-page-variant.svg?color=%238b5cf6&width=80&height=80',
        icon: 'book-open-page-variant',
        isFeatured: false,
        sortOrder: 7
    },
    {
        name: 'Toys & Games',
        slug: 'toys-games',
        description: 'Toys, board games, and puzzles for all ages',
        image: 'https://api.iconify.design/mdi/toy-brick.svg?color=%23ef4444&width=80&height=80',
        icon: 'toy-brick',
        isFeatured: false,
        sortOrder: 8
    }
];

async function seedCategories() {
    try {
        await connectDB();
        
        console.log('Clearing existing categories...');
        await Category.deleteMany({});
        
        console.log('Seeding categories...');
        const created = await Category.insertMany(categories);
        
        console.log(`Successfully seeded ${created.length} categories:`);
        created.forEach(cat => {
            console.log(`   - ${cat.name} (${cat.slug})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();