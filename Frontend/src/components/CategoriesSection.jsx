import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';

import { CardSkeleton } from './ui/SkeletonLoader.jsx';
import apiClient from '../services/apiClient';

const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedCategories();
  }, []);

  const fetchFeaturedCategories = async () => {
    try {
      const response = await apiClient.get('/api/categories/featured/list');
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Error fetching featured categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (slug) => {
    navigate(`/shop?category=${slug}`);
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gray-50 dark:bg-black transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-purple-100 mb-2">
              Shop by Category
            </h2>
            <p className="text-base md:text-lg font-light text-gray-600 text-gray-700 dark:text-purple-200">
              Discover amazing products across all categories
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} showImage={false} lines={2} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tighter mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg font-medium border-2 border-black inline-block px-4 py-1 shadow-neo-sm transform -rotate-1">
            Discover amazing products across all categories
          </p>
        </div>

        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryItem
              key={category._id}
              icon={category.icon}
              title={category.name}
              description={category.description || `Explore our ${category.name.toLowerCase()} collection`}
              productCount={category.productCount}
              onClick={() => handleCategoryClick(category.slug)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
};

const CategoryItem = ({ icon, title, description, productCount, onClick }) => {
  // Dynamically get the Lucide icon component
  const IconComponent = LucideIcons[icon] || LucideIcons.Package;

  return (
    <li className="list-none h-full">
      <div
        onClick={onClick}
        className="group relative flex h-full flex-col justify-between gap-6 rounded-none border-2 border-black bg-card p-6 shadow-neo hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer"
      >
        <div className="relative flex flex-1 flex-col justify-between gap-3">
          <div className="w-12 h-12 flex items-center justify-center border-2 border-black bg-secondary text-secondary-foreground shadow-neo-sm group-hover:shadow-none transition-shadow">
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <h3 className="pt-0.5 text-xl font-black uppercase tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm font-medium text-muted-foreground">
              {description}
            </p>
            {productCount > 0 && (
              <div className="inline-block px-2 py-1 bg-accent text-accent-foreground text-xs font-bold border-2 border-black">
                {productCount} PRODUCTS
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default CategoriesSection;




