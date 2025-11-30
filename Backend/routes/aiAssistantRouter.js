import express from 'express';
import { getComboSuggestions, askQuestion, chat } from '../controllers/aiAssistantController.js';
import isLoggedin from '../middleware/isLoggedin.js';

const router = express.Router();

router.post('/combo-suggestions', isLoggedin, getComboSuggestions);
router.post('/ask', isLoggedin, askQuestion);
router.post('/chat', isLoggedin, chat);

export default router;
