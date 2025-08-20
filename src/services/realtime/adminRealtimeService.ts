import { createLogger } from "../../utils/optimizedLogger";
import * as EventEmitter from 'events';

const logger = createLogger("AdminRealtimeService");

interface RealtimeEvent {
  type: 'user_update' | 'stats_update' | 'subscription_update' | 'metric_update' | 'activity_update' | 'tab_switch' | 'user_action';
  data: any;
  timestamp: number;
  source: string;
}

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'event';
  channel: string;
  data?: any;
  id?: string;
}

/**
 * Service WebSocket pour les mises à jour temps réel
 * Remplace le polling par des connexions persistantes
 */
class AdminRealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 seconde
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private eventEmitter = new (EventEmitter as any)();

  // Files d'attente pour les messages
  private messageQueue: WebSocketMessage[] = [];
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  // Configuration
  private readonly WS_URL = 'wss://your-websocket-server.com/admin'; // À configurer
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 secondes
  private readonly CONNECTION_TIMEOUT = 10000; // 10 secondes
  private readonly MAX_MESSAGE_QUEUE_SIZE = 1000;

  // Méthodes EventEmitter
  emit(event: string, ...args: any[]): boolean {
    return this.eventEmitter.emit(event, ...args);
  }

  on(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.off(event, listener);
    return this;
  }

  constructor() {
    this.connect();
  }

  /**
   * Établit la connexion WebSocket
   */
  private connect(): void {
    try {
      this.ws = new WebSocket(this.WS_URL);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Timeout de connexion
      setTimeout(() => {
        if (!this.isConnected) {
          logger.warn("Timeout de connexion WebSocket");
          this.ws?.close();
        }
      }, this.CONNECTION_TIMEOUT);

    } catch (error) {
      logger.error("Erreur lors de la création du WebSocket:", error);
      this.scheduleReconnect();
    }
  }

  /**
   * Gestionnaire d'ouverture de connexion
   */
  private handleOpen(): void {
    logger.info("Connexion WebSocket établie");
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Démarrer le heartbeat
    this.startHeartbeat();

    // S'abonner aux canaux critiques
    this.subscribeToCriticalChannels();

    // Vider la file d'attente
    this.flushMessageQueue();

    this.emit('connected');
  }

  /**
   * Gestionnaire de messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'event':
          this.handleRealtimeEvent(message);
          break;
        case 'pong':
          // Heartbeat response
          break;
        default:
          // Gérer les réponses aux requêtes
          this.handleRequestResponse(message);
      }
    } catch (error) {
      logger.error("Erreur lors du traitement du message WebSocket:", error);
    }
  }

  /**
   * Gestionnaire de fermeture de connexion
   */
  private handleClose(event: CloseEvent): void {
    logger.warn(`Connexion WebSocket fermée: ${event.code} - ${event.reason}`);
    this.isConnected = false;
    this.stopHeartbeat();
    this.emit('disconnected');

    if (event.code !== 1000) { // Fermeture normale
      this.scheduleReconnect();
    }
  }

  /**
   * Gestionnaire d'erreurs
   */
  private handleError(error: Event): void {
    logger.error("Erreur WebSocket:", error);
    this.isConnected = false;
  }

  /**
   * Gestion des événements temps réel
   */
  private handleRealtimeEvent(message: WebSocketMessage): void {
    const event: RealtimeEvent = {
      type: message.channel as RealtimeEvent['type'],
      data: message.data,
      timestamp: Date.now(),
      source: 'websocket'
    };

    logger.debug(`Événement reçu: ${event.type}`);

    // Émettre l'événement pour les listeners
    this.emit(event.type, event.data);
    this.emit('event', event);

    // Mettre à jour le cache si nécessaire
    this.updateCacheFromEvent(event);
  }

  /**
   * Met à jour le cache depuis les événements temps réel
   */
  private updateCacheFromEvent(event: RealtimeEvent): void {
    // Import dynamique pour éviter les dépendances circulaires
    import('../cache/adminAdvancedCacheService').then(({ adminAdvancedCacheService }) => {
      switch (event.type) {
        case 'stats_update':
          adminAdvancedCacheService.set('admin_stats_calculated', event.data, {
            name: 'stats',
            ttl: 15,
            priority: 'critical',
            maxSize: 512 * 1024,
            compression: false
          });
          break;

        case 'user_update':
          // Invalider le cache des utilisateurs
          adminAdvancedCacheService.invalidate('admin_users_list');
          break;

        case 'subscription_update':
          adminAdvancedCacheService.invalidate('admin_subscriptions');
          break;
      }
    }).catch(error => {
      logger.error("Erreur lors de la mise à jour du cache:", error);
    });
  }

  /**
   * S'abonne aux canaux critiques
   */
  private subscribeToCriticalChannels(): void {
    const channels = ['stats_update', 'user_update', 'subscription_update', 'activity_update'];

    channels.forEach(channel => {
      this.send({
        type: 'subscribe',
        channel,
        id: `sub_${Date.now()}_${Math.random()}`
      });
    });
  }

  /**
   * Envoie un message WebSocket
   */
  private send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Ajouter à la file d'attente si pas connecté
      if (this.messageQueue.length < this.MAX_MESSAGE_QUEUE_SIZE) {
        this.messageQueue.push(message);
      } else {
        logger.warn("File d'attente des messages pleine, message ignoré");
      }
    }
  }

  /**
   * Vide la file d'attente des messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Gestionnaire de réponses aux requêtes
   */
  private handleRequestResponse(message: WebSocketMessage): void {
    const pending = this.pendingRequests.get(message.id!);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.id!);

      if (message.data?.error) {
        pending.reject(new Error(message.data.error));
      } else {
        pending.resolve(message.data);
      }
    }
  }

  /**
   * Envoie une requête avec timeout
   */
  async sendRequest(channel: string, data: any, timeoutMs: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `req_${Date.now()}_${Math.random()}`;

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Timeout après ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      this.send({
        type: 'subscribe', // Ou un type approprié pour les requêtes
        channel,
        data,
        id
      });
    });
  }

  /**
   * Heartbeat pour maintenir la connexion
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', channel: 'heartbeat' });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Arrête le heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Planifie une reconnexion
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error("Nombre maximum de tentatives de reconnexion atteint");
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    logger.info(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Ferme la connexion manuellement
   */
  disconnect(): void {
    this.isConnected = false;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Obtient le statut de la connexion
   */
  getConnectionStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    messageQueueLength: number;
    pendingRequestsCount: number;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      messageQueueLength: this.messageQueue.length,
      pendingRequestsCount: this.pendingRequests.size
    };
  }

  /**
   * S'abonne à un canal spécifique
   */
  subscribeToChannel(channel: string): void {
    this.send({
      type: 'subscribe',
      channel,
      id: `sub_${Date.now()}_${Math.random()}`
    });
  }

  /**
   * Se désabonne d'un canal
   */
  unsubscribeFromChannel(channel: string): void {
    this.send({
      type: 'unsubscribe',
      channel,
      id: `unsub_${Date.now()}_${Math.random()}`
    });
  }

  /**
   * Écouteur générique pour tous les événements
   */
  onEvent(callback: (event: RealtimeEvent) => void): () => void {
    this.on('event', callback);
    return () => this.off('event', callback);
  }

  /**
   * Écouteur pour un type d'événement spécifique
   */
  onSpecificEvent(type: RealtimeEvent['type'], callback: (data: any) => void): () => void {
    this.on(type, callback);
    return () => this.off(type, callback);
  }
}

export const adminRealtimeService = new AdminRealtimeService();
