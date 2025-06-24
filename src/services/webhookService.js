// Service pour gérer les communications avec le webhook
class WebhookService {
  constructor() {
    this.webhookUrl = 'https://n8n-ns40gos4o88gokog4so4008w.128.140.108.228.sslip.io/webhook/afc97f9b-c8c4-4dad-931e-88f883524475/chat';
    this.isConnected = false;
  }

  // Envoyer un message au webhook
  async sendMessage(messageData) {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'user_message',
          ...messageData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.isConnected = true;
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // Recevoir la réponse du bot
  async getBotResponse(userMessage, chatId) {
    try {
      const payload = {
        message: userMessage,
        chatId: chatId,
        userId: this.generateUserId(),
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId()
      };

      const response = await this.sendMessage(payload);
      
      // Retourner la réponse du bot
      return {
        success: true,
        botMessage: response.message || response.response || 'Merci pour votre message. Je traite votre demande.',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        botMessage: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer.'
      };
    }
  }

  // Envoyer les métadonnées du fichier
  async sendFileMetadata(fileData, chatId) {
    try {
      const payload = {
        type: 'file_upload',
        chatId: chatId,
        fileName: fileData.name,
        fileSize: fileData.size,
        fileType: fileData.type,
        timestamp: new Date().toISOString(),
        userId: this.generateUserId()
      };

      return await this.sendMessage(payload);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des métadonnées du fichier:', error);
      throw error;
    }
  }

  // Notifier le début d'un nouvel chat
  async startNewChat(chatData) {
    try {
      const payload = {
        type: 'new_chat',
        chatId: chatData.id,
        title: chatData.title,
        timestamp: chatData.timestamp,
        userId: this.generateUserId()
      };

      return await this.sendMessage(payload);
    } catch (error) {
      console.error('Erreur lors de la création du nouveau chat:', error);
      throw error;
    }
  }

  // Générer un ID utilisateur unique
  generateUserId() {
    if (!localStorage.getItem('chatbot_user_id')) {
      const userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('chatbot_user_id', userId);
    }
    return localStorage.getItem('chatbot_user_id');
  }

  // Obtenir l'ID de session
  getSessionId() {
    if (!sessionStorage.getItem('chatbot_session_id')) {
      const sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      sessionStorage.setItem('chatbot_session_id', sessionId);
    }
    return sessionStorage.getItem('chatbot_session_id');
  }

  // Vérifier la connexion
  async testConnection() {
    try {
      const testPayload = {
        type: 'connection_test',
        timestamp: new Date().toISOString(),
        userId: this.generateUserId()
      };

      await this.sendMessage(testPayload);
      return true;
    } catch (error) {
      console.error('Test de connexion échoué:', error);
      return false;
    }
  }

  // Obtenir le statut de connexion
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Exporter une instance singleton
export default new WebhookService();