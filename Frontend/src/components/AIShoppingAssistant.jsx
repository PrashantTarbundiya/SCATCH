import { useState } from 'react';
import { getComboSuggestions, askProductQuestion } from '../services/aiService';

export default function AIShoppingAssistant() {
  const [itemName, setItemName] = useState('');
  const [budget, setBudget] = useState('');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComboSuggestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await getComboSuggestions(itemName, budget);
      setResponse(result.suggestion);
    } catch (error) {
      setResponse('Error: ' + error.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await askProductQuestion(question);
      setResponse(result.answer);
    } catch (error) {
      setResponse('Error: ' + error.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">🤖 AI Shopping Assistant</h1>

      {/* Combo Suggestions */}
      <div className="bg-white dark:bg-[#2A1F47] rounded-lg shadow-md dark:shadow-purple-500/20 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Get Product Combo Suggestions</h2>
        <form onSubmit={handleComboSuggestion} className="space-y-4">
          <input
            type="text"
            placeholder="What do you want to buy?"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="number"
            placeholder="Your budget (₹)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 dark:bg-purple-600 text-white py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 disabled:bg-gray-400"
          >
            {loading ? 'Thinking...' : 'Get Suggestions'}
          </button>
        </form>
      </div>

      {/* Ask Questions */}
      <div className="bg-white dark:bg-[#2A1F47] rounded-lg shadow-md dark:shadow-purple-500/20 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Ask Product Questions</h2>
        <form onSubmit={handleAskQuestion} className="space-y-4">
          <textarea
            placeholder="Ask anything about products or services..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg h-24"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Thinking...' : 'Ask Question'}
          </button>
        </form>
      </div>

      {/* Response */}
      {response && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold mb-2">AI Response:</h3>
          <div className="whitespace-pre-wrap">{response}</div>
        </div>
      )}
    </div>
  );
}





