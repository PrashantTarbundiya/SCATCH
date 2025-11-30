import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const getComboSuggestions = async (itemName, budget) => {
  const response = await axios.post(`${API_URL}/api/ai-assistant/combo-suggestions`, 
    { itemName, budget },
    { withCredentials: true }
  );
  return response.data;
};

export const askProductQuestion = async (question, productId = null) => {
  const response = await axios.post(`${API_URL}/api/ai-assistant/ask`,
    { question, productId },
    { withCredentials: true }
  );
  return response.data;
};

export const chatWithAI = async (message, history = []) => {
  const response = await axios.post(`${API_URL}/api/ai-assistant/chat`,
    { message, history },
    { withCredentials: true }
  );
  return response.data;
};
