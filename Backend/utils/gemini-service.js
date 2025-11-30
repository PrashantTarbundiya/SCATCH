import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Suggest product combos based on budget
export const suggestCombo = async (itemName, budget, products) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const productList = products.map(p => ({
    name: p.name,
    price: p.price,
    discount: p.discount,
    finalPrice: p.price - (p.price * p.discount / 100),
    category: p.category?.name || 'Uncategorized'
  }));

  const prompt = `IMPORTANT: You are a shopping assistant for our store. You can ONLY suggest products from the list below. DO NOT suggest any products from the internet or your knowledge.

User wants: "${itemName}"
Budget: ₹${budget}

OUR STORE PRODUCTS ONLY:
${JSON.stringify(productList, null, 2)}

RULES:
1. ONLY use products from the above list
2. Find products matching "${itemName}" or similar items from our store
3. Stay within ₹${budget} budget (try to use 80-100% of budget for best value)
4. Suggest complementary products from our store that work well together
5. If no matching products exist in our store, say "Sorry, we don't have ${itemName} in stock"
6. Prioritize products with higher ratings and good discounts
7. Understand context: if item is for women (saree, makeup, etc), suggest women products only
8. Understand context: if item is for men (shirt, grooming, etc), suggest men products only
9. Consider occasions: festival items for Diwali, romantic items for anniversary, etc
10. ALWAYS use ₹ (Rupee symbol) for prices, NEVER use $ or dollar
11. DO NOT use markdown formatting like **bold** or *italic* - use plain text with emojis only

Respond in this EXACT format:

✨ Perfect! Here's what I suggest:

🛍️ [Product Name] - ₹[Price]
🛍️ [Product Name] - ₹[Price]

💰 Total: ₹[Total Amount]

💡 Why this combo:
[Brief explanation]

DO NOT use JSON. Use ₹ for all prices.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// Answer product-related questions
export const askProductQuestion = async (question, productContext) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const productList = Array.isArray(productContext) ? productContext.map(p => ({
    name: p.name,
    price: p.price,
    discount: p.discount,
    finalPrice: p.price - (p.price * p.discount / 100),
    category: p.category?.name || 'Uncategorized',
    quantity: p.quantity,
    averageRating: p.averageRating || 0
  })) : [productContext];

  const prompt = `You are a helpful shopping assistant for our store. Answer customer questions naturally using ONLY our store's products.

OUR STORE PRODUCTS:
${JSON.stringify(productList, null, 2)}

Customer Question: ${question}

INSTRUCTIONS:
- Understand the question using natural language (NLP)
- Answer based ONLY on our store products above
- CRITICAL: If question mentions mom/mother/wife/sister/girlfriend/women/lady/her, suggest ONLY women-appropriate products (cosmetics, beauty, sarees, jewelry, women clothing, skincare)
- CRITICAL: If question mentions dad/father/husband/brother/boyfriend/men/guy/him, suggest ONLY men-appropriate products (men grooming, men clothing, gadgets, tools)
- CRITICAL: If question mentions kids/children/son/daughter/baby, suggest ONLY kids products
- DO NOT suggest men products for women recipients or vice versa
- Filter by checking product name and category for gender appropriateness
- Understand occasions: Diwali/festival (traditional items, sweets, decorative), Birthday (personalized gifts), Anniversary (romantic items), Wedding (premium gifts)
- Understand price terms: cheap/affordable/budget (lowest prices), expensive/premium/luxury (highest prices), mid-range (medium prices)
- Understand age context: young/teen (trendy items), elderly/senior (comfort items), professional (formal items)
- Sort by rating when asked for "best" or "top rated" products
- Show discounted items when asked for "deals" or "offers"
- Suggest complementary products (e.g., if laptop suggested, also suggest mouse/bag)
- Handle questions like: "What's the best laptop?", "Show me cheap phones", "Gift for mom on Diwali", "What do you have under 5000?", "Top rated products", "What's on sale?"
- Be conversational and helpful
- If we don't have appropriate products for the recipient, say "Sorry, we don't have suitable products for [recipient] right now"
- ALWAYS use ₹ (Rupee symbol) for prices, NEVER use $ or dollar
- Format response with emojis and clear structure
- DO NOT use markdown formatting like **bold** or *italic* - use plain text with emojis only

Format your answer like:

👋 [Greeting/Answer]

🛍️ [Product Name] - ₹[Price] ⭐ [Rating if available] 🏷️ [Discount if any]
🛍️ [Product Name] - ₹[Price] ⭐ [Rating if available] 🏷️ [Discount if any]

💡 [Additional helpful info or why these products are perfect]

Use ₹ for all prices. Be friendly and clear. Show ratings and discounts when available.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// General shopping assistant
export const chatWithAssistant = async (userMessage, conversationHistory = []) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const context = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  const prompt = `${context}\nUser: ${userMessage}\nAssistant:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};
