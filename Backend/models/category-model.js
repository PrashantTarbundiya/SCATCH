import mongoose from 'mongoose';

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 2,
        maxLength: 50,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        maxLength: 500,
    },
    image: {
        type: String,
        default: 'https://res.cloudinary.com/dnlkzlnhv/image/upload/v1757783899/category-default_ju6q5f.png'
    },
    icon: {
        type: String, // Icon name/class for UI
        default: 'Package',
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
    productCount: {
        type: Number,
        default: 0,
    },
    metadata: {
        keywords: [String],
        metaTitle: String,
        metaDescription: String,
    },
}, {
    timestamps: true,
});

// Index for performance (slug already indexed via unique: true)
categorySchema.index({ isActive: 1, isFeatured: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ parentCategory: 1 });

// Pre-save middleware to generate slug from name
categorySchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'category',
    localField: '_id',
    foreignField: 'parentCategory',
});

// Method to get full category path
categorySchema.methods.getPath = async function() {
    const path = [this];
    let current = this;
    
    while (current.parentCategory) {
        current = await mongoose.model('category').findById(current.parentCategory);
        if (current) {
            path.unshift(current);
        } else {
            break;
        }
    }
    
    return path;
};

export default mongoose.model('category', categorySchema);