// Centralized toast system
let toastContainer = null;
let currentToast = null;

const createToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-6 left-6 z-50';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const removeToast = () => {
  if (currentToast) {
    currentToast.remove();
    currentToast = null;
  }
};

const showToast = (message, type = 'success') => {
  // Remove any existing toast
  removeToast();
  
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `p-4 rounded-xl shadow-2xl max-w-sm backdrop-blur-sm border ${
    type === 'success' 
      ? 'bg-green-500/90 border-green-400/50' 
      : 'bg-red-500/90 border-red-400/50'
  } text-white transition-all duration-500 transform animate-in slide-in-from-left-5`;
  
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="text-lg">
        ${type === 'success' ? '✓' : '✕'}
      </div>
      <span class="text-sm font-medium">${message}</span>
    </div>
  `;
  
  container.appendChild(toast);
  currentToast = toast;
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    removeToast();
  }, 3000);
};

export const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  remove: removeToast
};