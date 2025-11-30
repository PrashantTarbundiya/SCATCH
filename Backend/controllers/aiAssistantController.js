import { suggestCombo, askProductQuestion, chatWithAssistant } from '../utils/gemini-service.js';
import productModel from '../models/product-model.js';

// Get combo suggestions based on budget
export const getComboSuggestions = async (req, res) => {
  try {
    const { itemName, budget } = req.body;

    if (!itemName || !budget) {
      return res.status(400).json({ message: 'Item name and budget are required' });
    }

    const products = await productModel.find({ quantity: { $gt: 0 } }).populate('category');
    
    if (products.length === 0) {
      return res.json({ success: true, suggestion: 'Sorry, we currently have no products in stock.' });
    }

    const aiResponse = await suggestCombo(itemName, budget, products);
    res.json({ success: true, suggestion: aiResponse });
  } catch (error) {
    console.error('AI Combo Error:', error);
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};

// Ask product-related questions
export const askQuestion = async (req, res) => {
  try {
    const { question, productId } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    let productContext = [];
    if (productId) {
      const product = await productModel.findById(productId).populate('category');
      productContext = [product];
    } else {
      // Fetch all products for generic questions
      productContext = await productModel.find({ quantity: { $gt: 0 } }).populate('category').limit(100);
    }

    const aiResponse = await askProductQuestion(question, productContext);
    res.json({ success: true, answer: aiResponse });
  } catch (error) {
    console.error('AI Ask Error:', error);
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};

// General chat with AI assistant
export const chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const aiResponse = await chatWithAssistant(message, history || []);
    res.json({ success: true, response: aiResponse });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};
