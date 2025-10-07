import React from 'react';
import { motion } from 'motion/react';

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Fashion Enthusiast",
    content: "Absolutely love shopping here! The quality of products is outstanding and the delivery is always on time. Customer service is top-notch!",
    rating: 5,
    image: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=3b82f6&color=fff&size=128"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Regular Customer",
    content: "Best online shopping experience I've had. The website is easy to navigate, products are exactly as described, and prices are very competitive.",
    rating: 5,
    image: "https://ui-avatars.com/api/?name=Michael+Chen&background=8b5cf6&color=fff&size=128"
  },
  {
    id: 3,
    name: "Emma Williams",
    role: "Verified Buyer",
    content: "I've been shopping here for months now. The product variety is amazing and I always find what I'm looking for. Highly recommend!",
    rating: 5,
    image: "https://ui-avatars.com/api/?name=Emma+Williams&background=ec4899&color=fff&size=128"
  },
  {
    id: 4,
    name: "David Rodriguez",
    role: "Satisfied Customer",
    content: "Great prices, fast shipping, and excellent quality. The return process is also very smooth if needed. Will definitely continue shopping here!",
    rating: 5,
    image: "https://ui-avatars.com/api/?name=David+Rodriguez&background=10b981&color=fff&size=128"
  }
];

const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`w-5 h-5 ${
            index < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const TestimonialCard = ({ testimonial, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center gap-4 mb-4">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {testimonial.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {testimonial.role}
          </p>
        </div>
      </div>
      
      <StarRating rating={testimonial.rating} />
      
      <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
        "{testimonial.content}"
      </p>
      
      <div className="mt-4 flex items-center gap-2 text-sm text-blue-500 dark:text-blue-400">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Verified Purchase</span>
      </div>
    </motion.div>
  );
};

const Testimonials = () => {
  return (
    <section className="w-full py-16 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Don't just take our word for it - hear from some of our satisfied customers
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 flex flex-wrap justify-center items-center gap-8 text-center"
        >
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-blue-500 dark:text-blue-400">10K+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Happy Customers</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-green-500 dark:text-green-400">4.9/5</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-purple-500 dark:text-purple-400">5K+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">5-Star Reviews</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-orange-500 dark:text-orange-400">99%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Rate</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;