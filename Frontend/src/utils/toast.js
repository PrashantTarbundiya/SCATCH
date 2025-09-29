let toastContainer = null;
let toasts = [];
let toastIdCounter = 0;

const createToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const removeToast = (toastId) => {
  const toastElement = document.getElementById(`toast-${toastId}`);
  if (toastElement) {
    toastElement.style.opacity = '0';
    toastElement.style.transform = 'translateX(-100%)';
    
    setTimeout(() => {
      toastElement.remove();
      toasts = toasts.filter(t => t.id !== toastId);
      
      if (toasts.length === 0 && toastContainer) {
        toastContainer.remove();
        toastContainer = null;
      }
    }, 300);
  }
};

const getToastConfig = (type) => {
  const configs = {
    success: {
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      icon: '✓',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    },
    error: {
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      icon: '✕',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    },
    info: {
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      icon: 'ℹ',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    },
    warning: {
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      icon: '⚠',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    }
  };
  return configs[type] || configs.info;
};

const showToast = (message, type = 'success', duration = 4000) => {
  // Remove all existing toasts before showing new one
  removeAllToasts();
  
  const container = createToastContainer();
  const toastId = toastIdCounter++;
  const config = getToastConfig(type);
  
  const toast = document.createElement('div');
  toast.id = `toast-${toastId}`;
  toast.style.cssText = `
    pointer-events: auto;
    min-width: 280px;
    max-width: 350px;
    min-height: 60px;
    padding: 12px 16px;
    border-radius: 12px;
    background: ${config.gradient};
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    color: white;
    opacity: 0;
    transform: translateX(-100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; height: 100%;">
      <div style="
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${config.iconBg};
        border-radius: 50%;
      ">
        <span style="font-size: 18px; font-weight: bold;">${config.icon}</span>
      </div>
      <div style="flex: 1; min-width: 0; text-align: left;">
        <p style="
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.5;
          word-wrap: break-word;
          text-align: left;
        ">${message}</p>
      </div>
      <button 
        onclick="document.getElementById('toast-${toastId}').dispatchEvent(new CustomEvent('closeToast', { bubbles: true }))"
        style="
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s;
          padding: 0;
          color: white;
        "
        onmouseover="this.style.background='rgba(255,255,255,0.2)'"
        onmouseout="this.style.background='transparent'"
        aria-label="Close"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;
  
  toast.addEventListener('closeToast', () => {
    removeToast(toastId);
  });
  
  container.appendChild(toast);
  toasts.push({ id: toastId, element: toast });
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toastId);
    }, duration);
  }
  
  return toastId;
};

const removeAllToasts = () => {
  toasts.forEach(toast => removeToast(toast.id));
};

export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  info: (message, duration) => showToast(message, 'info', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  remove: removeAllToasts
};
