import { useState, useEffect } from 'react';
import { getComboSuggestions, askProductQuestion } from '../services/aiService';


export default function AIAssistantButton() {

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
        className="fixed bottom-24 lg:bottom-6 right-6 bg-black text-white p-4 border-2 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all z-50 hover:scale-105"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="w-full max-w-2xl bg-white border-4 border-black shadow-neo-lg max-h-[85vh] flex flex-col transition-colors" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-primary text-white p-4 border-b-4 border-black flex justify-between items-center">
              <h3 className="font-black text-lg uppercase tracking-wider flex items-center gap-2">
                <i className="ri-robot-2-fill"></i> AI Shopping Assistant
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-red-200 text-2xl font-black border-2 border-transparent hover:border-white w-8 h-8 flex items-center justify-center transition-all"
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-4 border-black">
              <button
                onClick={() => setActiveTab('combo')}
                className={`flex-1 py-3 font-black uppercase transition-all border-r-2 border-black ${activeTab === 'combo' ? 'bg-yellow-300 text-black' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              >
                💰 Combo
              </button>
              <button
                onClick={() => setActiveTab('ask')}
                className={`flex-1 py-3 font-black uppercase transition-all border-l-2 border-black ${activeTab === 'ask' ? 'bg-yellow-300 text-black' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              >
                💬 Ask
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {activeTab === 'combo' ? (
                <div className="space-y-6">
                  {/* Combo Form */}
                  <form onSubmit={handleComboSuggestion} className="space-y-4 bg-white border-4 border-black p-6 shadow-neo-sm">
                    <div>
                      <label className="block text-sm font-black uppercase mb-2">What do you want?</label>
                      <input
                        type="text"
                        placeholder="E.g., Summer beach outfit"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-black bg-white focus:outline-none focus:shadow-neo-sm font-bold transition-all rounded-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black uppercase mb-2">Budget (₹)</label>
                      <input
                        type="number"
                        placeholder="E.g., 5000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-black bg-white focus:outline-none focus:shadow-neo-sm font-bold transition-all rounded-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-black text-white py-3 font-black uppercase border-2 border-black hover:bg-gray-800 disabled:opacity-50 transition-all shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                      {loading ? 'Thinking...' : 'Get Suggestions'}
                    </button>
                  </form>

                  {/* Combo Response */}
                  {comboResponse && (
                    <div className="bg-white border-4 border-black p-6 shadow-neo-sm">
                      <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{comboResponse}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full min-h-[400px]">
                  {/* Chat Messages */}
                  <div className="flex-1 space-y-4 overflow-y-auto mb-4 pr-2">
                    {chatHistory.length === 0 && (
                      <div className="text-center text-gray-400 mt-8 border-2 border-dashed border-gray-300 p-8">
                        <i className="ri-chat-smile-2-line text-4xl mb-2"></i>
                        <p className="font-bold uppercase">Ask me anything about products!</p>
                      </div>
                    )}
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-4 py-3 border-2 border-black shadow-neo-sm ${msg.role === 'user' ? 'bg-yellow-300' : 'bg-white'}`}>
                          <div className="text-sm font-bold whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white border-2 border-black px-4 py-2 shadow-neo-sm">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-black animate-bounce"></div>
                            <div className="w-2 h-2 bg-black animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-black animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleAskQuestion} className="flex gap-2 sticky bottom-0 bg-white border-t-4 border-black pt-4">
                    <input
                      type="text"
                      placeholder="Ask anything..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-black bg-white text-black font-bold focus:outline-none focus:shadow-neo-sm transition-all rounded-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-black text-white px-6 py-3 font-black uppercase border-2 border-black hover:bg-gray-800 disabled:opacity-50 transition-all shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                      <i className="ri-send-plane-fill"></i>
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







