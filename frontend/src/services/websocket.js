import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { authService } from "./authService";

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.connectionListeners = new Set();
  }

  connect(onConnectCallback, onErrorCallback) {
    if (this.client && this.connected) {
      if (onConnectCallback) onConnectCallback();
      return;
    }

    const token = authService.getToken();
    if (!token) {
      console.warn("Cannot connect to WebSocket: No JWT token found");
      return;
    }

    // Initialize STOMP client using SockJS factory
    this.client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      this.connected = true;
      console.log("Connected to WebSocket STOMP broker:", frame);
      this.connectionListeners.forEach((listener) => listener(true));
      if (onConnectCallback) onConnectCallback();
    };

    this.client.onStompError = (frame) => {
      console.error("STOMP broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
      if (onErrorCallback) onErrorCallback(frame);
    };

    this.client.onWebSocketClose = () => {
      this.connected = false;
      this.connectionListeners.forEach((listener) => listener(false));
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.connectionListeners.forEach((listener) => listener(false));
    }
  }

  onConnectionChange(callback) {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  subscribeToRoom(roomId, onMessageReceived) {
    if (!this.client || !this.connected) return null;

    const topic = `/topic/room.${roomId}`;
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        onMessageReceived(data);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    });

    this.subscriptions.set(topic, sub);
    return () => {
      sub.unsubscribe();
      this.subscriptions.delete(topic);
    };
  }

  subscribeToTyping(roomId, onTypingReceived) {
    if (!this.client || !this.connected) return null;

    const topic = `/topic/room.${roomId}.typing`;
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        onTypingReceived(data);
      } catch (err) {
        console.error("Failed to parse typing event:", err);
      }
    });

    this.subscriptions.set(topic, sub);
    return () => {
      sub.unsubscribe();
      this.subscriptions.delete(topic);
    };
  }

  subscribeToPresence(onPresenceReceived) {
    if (!this.client || !this.connected) return null;

    const topic = "/topic/presence";
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        onPresenceReceived(data);
      } catch (err) {
        console.error("Failed to parse presence event:", err);
      }
    });

    this.subscriptions.set(topic, sub);
    return () => {
      sub.unsubscribe();
      this.subscriptions.delete(topic);
    };
  }

  sendMessage(roomId, content) {
    if (!this.client || !this.connected) {
      console.error("WebSocket not connected");
      return;
    }

    this.client.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify({
        roomId,
        content,
        messageType: "CHAT",
      }),
    });
  }

  joinRoom(roomId) {
    if (!this.client || !this.connected) return;

    this.client.publish({
      destination: "/app/chat.addUser",
      body: JSON.stringify({
        roomId,
        content: "",
        messageType: "JOIN",
      }),
    });
  }

  sendTyping(roomId, isTyping) {
    if (!this.client || !this.connected) return;

    this.client.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify({
        roomId,
        typing: isTyping,
      }),
    });
  }
}

export const websocketService = new WebSocketService();
