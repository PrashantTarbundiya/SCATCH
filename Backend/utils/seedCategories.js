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
        icon: 'User',
        isFeatured: true,
        sortOrder: 1
    },
    {
        name: 'Women\'s Fashion',
        slug: 'womens-fashion',
        description: 'Clothing, shoes, and accessories for women',
        icon: 'UserCheck',
        isFeatured: true,
        sortOrder: 2
    },
    {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Phones, laptops, cameras, and gadgets',
        icon: 'Smartphone',
        isFeatured: true,
        sortOrder: 3
    },
    {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Furniture, appliances, and home decor',
        icon: 'Home',
        isFeatured: true,
        sortOrder: 4
    },
    {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Fitness equipment, outdoor gear, and sportswear',
        icon: 'Activity',
        isFeatured: true,
        sortOrder: 5
    },
    {
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        description: 'Skincare, makeup, and grooming products',
        icon: 'Heart',
        isFeatured: true,
        sortOrder: 6
    },
    {
        name: 'Books & Media',
        slug: 'books-media',
        description: 'Books, magazines, music, and movies',
        icon: 'Book',
        isFeatured: false,
        sortOrder: 7
    },
    {
        name: 'Toys & Games',
        slug: 'toys-games',
        description: 'Toys, board games, and puzzles for all ages',
        icon: 'Gamepad2',
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
        
        console.log(`✅ Successfully seeded ${created.length} categories:`);
        created.forEach(cat => {
            console.log(`   - ${cat.name} (${cat.slug})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();