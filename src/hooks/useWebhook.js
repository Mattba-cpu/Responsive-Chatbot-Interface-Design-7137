import { useState, useEffect } from 'react';
import webhookService from '../services/webhookService';

// Hook personnalisé pour gérer les interactions avec le webhook
export const useWebhook = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Tester la connexion au montage du composant
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const connected = await webhookService.testConnection();
      setIsConnected(connected);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message, chatId) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await webhookService.getBotResponse(message, chatId);
      setIsConnected(result.success);
      return result;
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      return {
        success: false,
        error: err.message,
        botMessage: 'Erreur de connexion. Veuillez réessayer.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const sendFile = async (file, chatId) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await webhookService.sendFileMetadata(file, chatId);
      setIsConnected(true);
      return result;
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = async (chatData) => {
    try {
      const result = await webhookService.startNewChat(chatData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    isConnected,
    isLoading,
    error,
    sendMessage,
    sendFile,
    startNewChat,
    testConnection
  };
};