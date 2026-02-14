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
      bg: '#4ade80', // green-400
      color: '#000000',
      borderColor: '#000000',
      icon: '<i class="ri-checkbox-circle-fill" style="font-size: 24px;"></i>',
    },
    error: {
      bg: '#f87171', // red-400
      color: '#000000',
      borderColor: '#000000',
      icon: '<i class="ri-error-warning-fill" style="font-size: 24px;"></i>',
    },
    info: {
      bg: '#60a5fa', // blue-400
      color: '#000000',
      borderColor: '#000000',
      icon: '<i class="ri-information-fill" style="font-size: 24px;"></i>',
    },
    warning: {
      bg: '#fbbf24', // yellow-400
      color: '#000000',
      borderColor: '#000000',
      icon: '<i class="ri-alert-fill" style="font-size: 24px;"></i>',
    }
  };
  return configs[type] || configs.info;
};

const showToast = (message, type = 'success', duration = 4000) => {
  removeAllToasts();
  const container = createToastContainer();
  const toastId = toastIdCounter++;
  const config = getToastConfig(type);

  const toast = document.createElement('div');
  toast.id = `toast-${toastId}`;
  toast.style.cssText = `
    pointer-events: auto;
    min-width: 300px;
    max-width: 400px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    background: ${config.bg};
    color: ${config.color};
    border: 3px solid ${config.borderColor};
    box-shadow: 4px 4px 0 0 #000;
    opacity: 0;
    transform: translateX(-100%);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    margin-bottom: 16px;
  `;

  toast.innerHTML = `
    <div style="flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
      ${config.icon}
    </div>
    <div style="flex: 1; min-width: 0;">
      <p style="
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        font-weight: 900;
        text-transform: uppercase;
        line-height: 1.4;
        word-wrap: break-word;
        letter-spacing: 0.05em;
      ">${message}</p>
    </div>
    <button 
      onclick="document.getElementById('toast-${toastId}').dispatchEvent(new CustomEvent('closeToast', { bubbles: true }))"
      style="
        flex-shrink: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        color: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s;
      "
      onmouseover="this.style.opacity='1'"
      onmouseout="this.style.opacity='0.7'"
      aria-label="Close"
    >
      <i class="ri-close-line" style="font-size: 24px; font-weight: bold;"></i>
    </button>
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
