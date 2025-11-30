import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className,
  showFirstLast = true,
  showInfo = true,
  totalItems = 0,
  itemsPerPage = 12
}) => {
  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      // Scroll to top of page smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn("flex flex-col items-center gap-4 py-8", className)}>
      {/* Pagination Info */}
      {showInfo && totalItems > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          Showing <span className="font-semibold text-gray-900 dark:text-purple-100">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-900 dark:text-purple-100">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-purple-100">{totalItems}</span> products
        </motion.div>
      )}

      {/* Pagination Controls */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1 md:gap-2 bg-white/80 dark:bg-[#1E1538]/60 backdrop-blur-xl border border-purple-500/20 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        {/* First Page Button */}
        {showFirstLast && (
          <PaginationButton
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            ariaLabel="First page"
            className="hidden sm:flex"
          >
            <ChevronsLeft className="w-4 h-4" />
          </PaginationButton>
        )}

        {/* Previous Button */}
        <PaginationButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          ariaLabel="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </PaginationButton>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-gray-600 dark:text-purple-300"
                >
                  ...
                </span>
              );
            }

            return (
              <PaginationButton
                key={page}
                onClick={() => handlePageChange(page)}
                active={currentPage === page}
                ariaLabel={`Page ${page}`}
                ariaCurrent={currentPage === page ? 'page' : undefined}
              >
                {page}
              </PaginationButton>
            );
          })}
        </div>

        {/* Next Button */}
        <PaginationButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          ariaLabel="Next page"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-4 h-4" />
        </PaginationButton>

        {/* Last Page Button */}
        {showFirstLast && (
          <PaginationButton
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            ariaLabel="Last page"
            className="hidden sm:flex"
          >
            <ChevronsRight className="w-4 h-4" />
          </PaginationButton>
        )}
      </motion.div>
    </div>
  );
};

const PaginationButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  active = false,
  ariaLabel,
  ariaCurrent,
  className
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      whileHover={!disabled && !active ? { scale: 1.05 } : {}}
      whileTap={!disabled && !active ? { scale: 0.95 } : {}}
      className={cn(
        "relative min-w-[2.5rem] px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center",
        active && "bg-blue-500 text-white shadow-md dark:shadow-purple-500/20",
        !active && !disabled && "bg-white dark:bg-[#2A1F47] text-purple-200 hover:bg-gray-200 dark:hover:bg-gray-600",
        disabled && "opacity-40 cursor-not-allowed",
        !disabled && !active && "hover:shadow-sm",
        className
      )}
    >
      {children}
    </motion.button>
  );
};

export default Pagination;




