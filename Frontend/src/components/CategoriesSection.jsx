import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { GlowingEffect } from './ui/glowing-effect';
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
          <h2 className="text-4xl md:text-5xl font-light text-purple-100 mb-2">
            Shop by Category
          </h2>
          <p className="text-base md:text-lg font-light text-gray-600 text-gray-700 dark:text-purple-200">
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
    <li className="min-h-[14rem] list-none">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-gray-300 dark:border-gray-700 p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div
          onClick={onClick}
          className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm shadow-gray-200/50 dark:shadow-gray-800/50 md:p-6 hover:shadow-lg dark:shadow-purple-500/20 hover:shadow-gray-300/50 dark:hover:shadow-gray-700/50 transition-all cursor-pointer hover:scale-[1.02]"
        >
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-purple-500/30 bg-gray-100 dark:bg-white/80 dark:bg-[#1E1538]/60 backdrop-blur-xl p-2">
              <IconComponent className="h-4 w-4 text-gray-700 text-gray-900 dark:text-purple-100" />
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-gray-900 dark:text-purple-100">
                {title}
              </h3>
              <p className="font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-gray-600 text-gray-700 dark:text-purple-200">
                {description}
              </p>
              {productCount > 0 && (
                <p className="text-xs text-gray-600 dark:text-purple-300">
                  {productCount} {productCount === 1 ? 'product' : 'products'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default CategoriesSection;




