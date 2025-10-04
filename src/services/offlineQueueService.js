import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import firebaseService from './firebaseService';

const QUEUE_KEY = 'offline_queue';

class OfflineQueueService {
  constructor() {
    this.queue = new Map();
    this.isProcessing = false;
    this.listeners = new Set();
    this.init();
  }

  async init() {
    // Load queue from storage
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        const items = JSON.parse(stored);
        items.forEach(item => this.queue.set(item.id, item));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }

    // Listen for network changes
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.processQueue();
      }
    });
  }

  async addToQueue(operation) {
    const id = `${Date.now()}_${Math.random()}`;
    const item = {
      id,
      ...operation,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    this.queue.set(id, item);
    await this.persistQueue();
    this.notifyListeners();

    // Try to process immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.processQueue();
    }

    return id;
  }

  async processQueue() {
    if (this.isProcessing || this.queue.size === 0) return;

    this.isProcessing = true;

    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        this.isProcessing = false;
        return;
      }

      for (const [id, item] of this.queue) {
        try {
          await this.executeOperation(item);
          this.queue.delete(id);
          this.notifyListeners();
        } catch (error) {
          console.error('Failed to execute queued operation:', error);
          
          // Increment retry count
          item.retries++;
          if (item.retries > 3) {
            // Remove after 3 failed retries
            this.queue.delete(id);
            console.error('Removed operation after 3 failed retries:', item);
          }
        }
      }

      await this.persistQueue();
    } finally {
      this.isProcessing = false;
    }
  }

  async executeOperation(operation) {
    const { type, userId, shinningId, data } = operation;

    switch (type) {
      case 'create':
        await firebaseService.addShinning(userId, data);
        break;
      case 'update':
        await firebaseService.updateShinning(userId, shinningId, data);
        break;
      case 'delete':
        await firebaseService.deleteShinning(userId, shinningId);
        break;
      case 'updateStatus':
        await firebaseService.updateShinningStatus(userId, shinningId, data.status);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  async persistQueue() {
    try {
      const items = Array.from(this.queue.values());
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to persist queue:', error);
    }
  }

  getQueueSize() {
    return this.queue.size;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({ queueSize: this.queue.size, items: Array.from(this.queue.values()) });
    });
  }

  async clearQueue() {
    this.queue.clear();
    await AsyncStorage.removeItem(QUEUE_KEY);
    this.notifyListeners();
  }
}

const offlineQueueService = new OfflineQueueService();
export default offlineQueueService;