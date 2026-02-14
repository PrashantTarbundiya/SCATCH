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
          className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
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
      className="bg-white border-4 border-black p-6 shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
    >
      <div className="flex items-center gap-4 mb-4">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-16 h-16 object-cover border-2 border-black"
        />
        <div className="flex-1">
          <h3 className="font-black text-lg text-black uppercase">
            {testimonial.name}
          </h3>
          <p className="text-sm font-bold text-gray-600 uppercase">
            {testimonial.role}
          </p>
        </div>
      </div>

      <StarRating rating={testimonial.rating} />

      <p className="mt-4 text-black font-medium leading-relaxed border-l-4 border-black pl-4 italic">
        "{testimonial.content}"
      </p>

      <div className="mt-6 flex items-center gap-2 text-sm text-green-600 font-black uppercase">
        <i className="ri-verified-badge-fill text-lg"></i>
        <span>Verified Purchase</span>
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
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tighter mb-4">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground text-lg font-medium border-2 border-black inline-block px-4 py-1 shadow-neo-sm transform -rotate-1">
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
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <div className="bg-blue-300 border-4 border-black p-6 text-center shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-transform transition-shadow duration-300">
            <div className="text-4xl font-black text-black mb-2">10K+</div>
            <div className="text-sm font-black uppercase text-black">Happy Customers</div>
          </div>
          <div className="bg-green-300 border-4 border-black p-6 text-center shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-transform transition-shadow duration-300">
            <div className="text-4xl font-black text-black mb-2">4.9/5</div>
            <div className="text-sm font-black uppercase text-black">Average Rating</div>
          </div>
          <div className="bg-purple-300 border-4 border-black p-6 text-center shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-transform transition-shadow duration-300">
            <div className="text-4xl font-black text-black mb-2">5K+</div>
            <div className="text-sm font-black uppercase text-black">5-Star Reviews</div>
          </div>
          <div className="bg-orange-300 border-4 border-black p-6 text-center shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-transform transition-shadow duration-300">
            <div className="text-4xl font-black text-black mb-2">99%</div>
            <div className="text-sm font-black uppercase text-black">Satisfaction Rate</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;




