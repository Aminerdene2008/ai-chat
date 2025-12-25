'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';

const DEFAULT_AVATAR = '/vercel.svg';

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  basePrompt: string;
  greetingText: string;
}

interface Message {
  id: string;
  content: string;
  role: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  character: Character | null;
}

export default function ChatInterface({ character }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages and draft
  useEffect(() => {
    if (character) {
      fetchMessages();
      const draft = localStorage.getItem(`chat-draft-${character.id}`);
      setInputMessage(draft || '');
    } else {
      setMessages([]);
      setInputMessage('');
    }
  }, [character]);

  useEffect(() => {
    if (character && inputMessage) {
      localStorage.setItem(`chat-draft-${character.id}`, inputMessage);
    }
  }, [inputMessage, character]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!character) return;

    try {
      const response = await fetch(`/api/character/${character.id}/message`);
      const data = await response.json();

      if (data.length === 0 && character.greetingText) {
        setMessages([{
          id: 'greeting',
          content: character.greetingText,
          role: 'model',
          createdAt: new Date().toISOString(),
        }]);
      } else {
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!character || !inputMessage.trim() || loading) return;

    setLoading(true);
    setError(null);
    const userMessage = inputMessage.trim();

    const tempUserMessage: Message = {
      id: 'temp-user',
      content: userMessage,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/character/${character.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        const savedUserMessage: Message = { ...tempUserMessage, id: `user-${Date.now()}` };
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: data.message,
          role: 'model',
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev.filter(m => m.id !== 'temp-user'), savedUserMessage, aiMessage]);
        setInputMessage('');
        localStorage.removeItem(`chat-draft-${character.id}`);
      } else {
        setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
        const errorData = await response.json().catch(() => ({ message: 'Failed to send message' }));
        setError(typeof errorData.message === 'string' ? errorData.message : 'Failed to send message');
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
      setError('Network error. Please check your connection and try again.');
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!character) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Select a character to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto shadow-lg border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 md:p-6 border-b bg-gradient-to-r from-pink-50 to-pink-100">
        <div className="w-12 h-12 relative">
          <Image
            src={imageError ? DEFAULT_AVATAR : character.image}
            alt={character.name}
            fill
            className="rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
        <div className="flex flex-col">
          <h3 className="font-bold text-lg md:text-xl">{character.name}</h3>
          <p className="text-sm md:text-base text-gray-600">{character.description}</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-50">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end`}>
            {message.role === 'model' && (
              <Image
                src={imageError ? DEFAULT_AVATAR : character.image}
                alt={character.name}
                width={36}
                height={36}
                className="rounded-full mr-2 flex-shrink-0"
                onError={() => setImageError(true)}
              />
            )}
            <div className={`max-w-xs md:max-w-md px-4 py-2 md:px-5 md:py-3 rounded-3xl shadow-sm break-words
              ${message.role === 'user'
                ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                : 'bg-white text-gray-800 border border-gray-200'}`}>
              {message.content}
              <div className="text-xs mt-1 text-gray-400 text-right">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-sm text-gray-500">Typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 md:p-6 border-t bg-white flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
        {error && (
          <div className="mb-2 md:mb-0 p-2 md:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <textarea
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 min-h-[60px] md:min-h-[70px] py-2 px-3 md:py-3 md:px-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !inputMessage.trim()}
          className="md:ml-2 px-5 py-2 md:px-6 md:py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
