import React, { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { Chat } from '@google/genai';
import { createChatSession } from './services/geminiService';
import { ChatMessage, MessageRole } from './types';
import { BotIcon, UserIcon, SendIcon } from './components/Icons';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const session = createChatSession();
      setChat(session);
      setMessages([
        {
          role: MessageRole.MODEL,
          content: "Hello! I'm Zyro AI, your personal learning companion. How can I help you today?",
        },
      ]);
    } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to initialize AI session: ${e.message}. Please check if your API key is set correctly.`);
        } else {
            setError("An unknown error occurred during initialization.");
        }
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chat) return;

    const userMessage: ChatMessage = { role: MessageRole.USER, content: userInput };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const stream = await chat.sendMessageStream({ message: userInput });
      
      let modelResponse = '';
      setMessages((prev) => [...prev, { role: MessageRole.MODEL, content: '' }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = modelResponse;
            return newMessages;
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Sorry, something went wrong: ${errorMessage}`);
      setMessages((prev) => prev.slice(0, -1)); // Remove empty model message
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chat]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      <header className="bg-slate-800/50 backdrop-blur-sm p-4 text-center border-b border-slate-700 shadow-lg">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
          Zyro AI
        </h1>
        <p className="text-sm text-slate-400">Your AI Learning Companion</p>
      </header>
      
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            {msg.role === MessageRole.MODEL && (
              <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                <BotIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`prose prose-invert prose-p:my-0 prose-headings:my-2 max-w-lg md:max-w-xl rounded-2xl p-4 shadow-md ${
              msg.role === MessageRole.USER
                ? 'bg-blue-600 rounded-br-none'
                : 'bg-slate-800 rounded-bl-none'
            }`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            {msg.role === MessageRole.USER && (
              <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center shadow-md">
                <UserIcon className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-4 justify-start">
                 <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <BotIcon className="w-5 h-5 text-white" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-bl-none p-4 shadow-md flex items-center space-x-2">
                    <span className="text-slate-400">Zyro is thinking</span>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                </div>
            </div>
        )}
        {error && (
            <div className="flex justify-center">
                <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg max-w-md text-center">
                    {error}
                </div>
            </div>
        )}
      </main>
      
      <footer className="p-4 bg-slate-800/70 backdrop-blur-sm border-t border-slate-700">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask anything about your studies..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-full px-5 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;