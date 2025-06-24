import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';
import ConnectionStatus from './components/ConnectionStatus';
import { useWebhook } from './hooks/useWebhook';

const { FiSend, FiMic, FiPaperclip, FiPlus, FiMenu, FiX, FiMoreVertical, FiDownload } = FiIcons;

// Dummy chat data
const dummyChats = [
  {
    id: 1,
    title: "Support Client",
    lastMessage: "Merci de m'avoir aidé avec mon problème de compte...",
    timestamp: "2024-01-15T10:30:00",
    messages: [
      { id: 1, type: 'user', content: 'J\'ai besoin d\'aide avec les paramètres de mon compte', timestamp: '10:28 AM' },
      { id: 2, type: 'bot', content: 'Je serais ravi de vous aider avec les paramètres de votre compte. Quel problème spécifique rencontrez-vous ?', timestamp: '10:29 AM' },
      { id: 3, type: 'user', content: 'Je n\'arrive pas à changer mon mot de passe', timestamp: '10:29 AM' },
      { id: 4, type: 'bot', content: 'Laissez-moi vous guider dans le processus de réinitialisation du mot de passe. D\'abord, allez dans Paramètres > Sécurité...', timestamp: '10:30 AM' }
    ]
  },
  {
    id: 2,
    title: "Informations Produit",
    lastMessage: "Voici les spécifications que vous avez demandées...",
    timestamp: "2024-01-14T15:45:00",
    messages: [
      { id: 1, type: 'user', content: 'Pouvez-vous me parler de vos fonctionnalités premium ?', timestamp: '3:44 PM' },
      { id: 2, type: 'bot', content: 'Nos fonctionnalités premium incluent des analyses avancées, un support prioritaire et des intégrations personnalisées. Souhaitez-vous des détails sur une fonctionnalité spécifique ?', timestamp: '3:45 PM' }
    ]
  }
];

function App() {
  const [selectedChat, setSelectedChat] = useState(dummyChats[0]);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState(dummyChats);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Utiliser le hook webhook
  const { isConnected, isLoading, error, sendMessage: sendWebhookMessage, sendFile, startNewChat, testConnection } = useWebhook();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat.messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChat = {
      ...selectedChat,
      messages: [...selectedChat.messages, newMessage],
      lastMessage: message,
      timestamp: new Date().toISOString()
    };

    setChats(chats.map(chat => chat.id === selectedChat.id ? updatedChat : chat));
    setSelectedChat(updatedChat);
    const currentMessage = message;
    setMessage('');
    setIsTyping(true);

    try {
      // Envoyer le message via webhook
      const result = await sendWebhookMessage(currentMessage, selectedChat.id);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: result.botMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        webhookResponse: result.success
      };

      const updatedChatWithBot = {
        ...updatedChat,
        messages: [...updatedChat.messages, botMessage],
        lastMessage: botMessage.content
      };

      setChats(chats.map(chat => chat.id === selectedChat.id ? updatedChatWithBot : chat));
      setSelectedChat(updatedChatWithBot);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // Message d'erreur de fallback
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };

      const updatedChatWithError = {
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage],
        lastMessage: errorMessage.content
      };

      setChats(chats.map(chat => chat.id === selectedChat.id ? updatedChatWithError : chat));
      setSelectedChat(updatedChatWithError);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    const newChat = {
      id: Date.now(),
      title: "Nouvelle Conversation",
      lastMessage: "Commencer une nouvelle conversation...",
      timestamp: new Date().toISOString(),
      messages: []
    };

    try {
      // Notifier le webhook du nouveau chat
      await startNewChat(newChat);
    } catch (error) {
      console.error('Erreur lors de la création du nouveau chat:', error);
    }

    setChats([newChat, ...chats]);
    setSelectedChat(newChat);
    setIsSidebarOpen(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // Envoyer les métadonnées du fichier au webhook
        await sendFile(file, selectedChat.id);

        const fileMessage = {
          id: Date.now(),
          type: 'user',
          content: `📎 ${file.name}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fileType: file.type,
          fileName: file.name
        };

        const updatedChat = {
          ...selectedChat,
          messages: [...selectedChat.messages, fileMessage],
          lastMessage: `Fichier: ${file.name}`,
          timestamp: new Date().toISOString()
        };

        setChats(chats.map(chat => chat.id === selectedChat.id ? updatedChat : chat));
        setSelectedChat(updatedChat);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du fichier:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : '-100%'
        }}
        className="fixed lg:relative lg:translate-x-0 w-80 h-full bg-gray-900 border-r border-gray-800 z-50 lg:z-0"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <img 
                src="https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1750745932722-Logo%20Perfomai%20%281%29.png" 
                alt="Perfomai Logo" 
                className="h-8"
              />
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-gray-800 rounded"
                aria-label="Fermer la barre latérale"
              >
                <SafeIcon icon={FiX} className="w-5 h-5" />
              </button>
            </div>
            
            {/* Status de connexion */}
            <div className="mb-4">
              <ConnectionStatus 
                isConnected={isConnected}
                isLoading={isLoading}
                onRetry={testConnection}
              />
            </div>

            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-900 hover:bg-red-800 rounded-lg transition-colors"
              aria-label="Commencer un nouveau chat"
            >
              <SafeIcon icon={FiPlus} className="w-5 h-5" />
              <span className="font-medium">Nouveau Chat</span>
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <h3 className="text-sm font-medium text-gray-400 mb-3 px-2">Conversations Récentes</h3>
              <div className="space-y-1">
                {chats.map((chat) => (
                  <motion.button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedChat.id === chat.id
                        ? 'bg-red-900 border border-red-700'
                        : 'hover:bg-gray-800'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm truncate flex-1">{chat.title}</h4>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatDate(chat.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{chat.lastMessage}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(chat.timestamp)}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-800 rounded"
              aria-label="Ouvrir la barre latérale"
            >
              <SafeIcon icon={FiMenu} className="w-5 h-5" />
            </button>
            <img 
              src="https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1750745932722-Logo%20Perfomai%20%281%29.png" 
              alt="Perfomai Logo" 
              className="h-6"
            />
            <div>
              <h1 className="font-semibold">{selectedChat.title}</h1>
              <p className="text-sm text-gray-400">Assistant IA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus 
              isConnected={isConnected}
              isLoading={isLoading}
              onRetry={testConnection}
            />
            <button
              className="p-2 hover:bg-gray-800 rounded"
              aria-label="Plus d'options"
            >
              <SafeIcon icon={FiMoreVertical} className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {selectedChat.messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.type === 'user'
                      ? 'bg-red-900 text-white'
                      : msg.isError 
                        ? 'bg-red-800 bg-opacity-50 text-red-200 border border-red-700'
                        : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {msg.fileName ? (
                    <div className="flex items-center gap-2">
                      <SafeIcon icon={FiPaperclip} className="w-4 h-4" />
                      <span className="text-sm">{msg.fileName}</span>
                      <SafeIcon icon={FiDownload} className="w-4 h-4 ml-auto cursor-pointer hover:text-red-400" />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-70">{msg.timestamp}</p>
                    {msg.webhookResponse && (
                      <div className="w-2 h-2 bg-green-400 rounded-full" title="Message envoyé via webhook" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Indicateur de frappe */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-start"
              >
                <div className="bg-gray-800 text-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-xs text-gray-400">L'assistant tape...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          {error && (
            <div className="mb-3 p-2 bg-red-900 bg-opacity-50 border border-red-700 rounded text-red-200 text-sm">
              Erreur: {error}
            </div>
          )}
          
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Tapez votre message..."
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 pr-12 resize-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[48px] max-h-32"
                rows="1"
                aria-label="Saisie de message"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="*/*"
              />
              
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-full transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Télécharger un fichier"
                disabled={isLoading}
              >
                <SafeIcon icon={FiPaperclip} className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-3 rounded-full transition-colors ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-800 hover:bg-gray-700'
                } disabled:opacity-50`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isRecording ? "Arrêter l'enregistrement" : "Commencer l'enregistrement"}
                disabled={isLoading}
              >
                <SafeIcon icon={FiMic} className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="p-3 bg-red-900 hover:bg-red-800 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full transition-colors"
                whileHover={{ scale: message.trim() && !isLoading ? 1.05 : 1 }}
                whileTap={{ scale: message.trim() && !isLoading ? 0.95 : 1 }}
                aria-label="Envoyer le message"
              >
                <SafeIcon icon={FiSend} className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;