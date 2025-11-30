import { useState, useEffect } from 'react';
import { getComboSuggestions, askProductQuestion } from '../services/aiService';
import { useTheme } from '../context/ThemeContext';

export default function AIAssistantButton() {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [budget, setBudget] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('combo');
  const [chatHistory, setChatHistory] = useState([]);
  const [comboResponse, setComboResponse] = useState('');

  // Disable background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleComboSuggestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await getComboSuggestions(itemName, budget);
      setComboResponse(result.suggestion);
    } catch (error) {
      setComboResponse('Error: ' + (error.response?.data?.message || 'Something went wrong'));
    }
    setLoading(false);
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    const userMsg = { role: 'user', content: question, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);
    
    try {
      const result = await askProductQuestion(question);
      const aiMsg = { role: 'ai', content: result.answer, timestamp: Date.now() };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = { role: 'ai', content: 'Error: ' + (error.response?.data?.message || 'Something went wrong'), timestamp: Date.now() };
      setChatHistory(prev => [...prev, errorMsg]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50 hover:scale-110"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[85vh] flex flex-col transition-colors" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-t-xl flex justify-between items-center">
              <h3 className="font-semibold text-lg">💡 AI Shopping Assistant</h3>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('combo')}
                className={`flex-1 py-3 font-medium transition ${activeTab === 'combo' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-600 dark:text-gray-400 hover:text-emerald-500'}`}
              >
                💰 Combo
              </button>
              <button
                onClick={() => setActiveTab('ask')}
                className={`flex-1 py-3 font-medium transition ${activeTab === 'ask' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-600 dark:text-gray-400 hover:text-emerald-500'}`}
              >
                💬 Ask
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'combo' ? (
                <div className="space-y-4">
                  {/* Combo Form */}
                  <form onSubmit={handleComboSuggestion} className="space-y-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <input
                      type="text"
                      placeholder="What do you want to buy?"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Your budget (₹)"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg disabled:bg-gray-400 font-medium transition shadow-sm"
                    >
                      {loading ? '🤔 Thinking...' : '✨ Get Suggestions'}
                    </button>
                  </form>

                  {/* Combo Response */}
                  {comboResponse && (
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{comboResponse}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full min-h-[400px]">
                  {/* Chat Messages */}
                  <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2">
                    {chatHistory.length === 0 && (
                      <div className="text-center text-gray-400 dark:text-gray-500 mt-8">
                        <p>👋 Ask me anything about our products!</p>
                        <p className="text-xs mt-2">e.g., "What's the best laptop under ₹50000?"</p>
                      </div>
                    )}
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-4 py-3 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-emerald-500 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{wordBreak: 'break-word'}}>{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleAskQuestion} className="flex gap-2 sticky bottom-0 bg-white dark:bg-gray-800 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      placeholder="Ask anything about products..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg disabled:bg-gray-400 font-medium transition shadow-sm"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
