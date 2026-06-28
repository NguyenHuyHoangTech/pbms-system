import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '../store/useAuthStore';

export const useWebSocket = () => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws-pbms',
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: function (str) {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('Connected to WebSocket');
      setConnected(true);
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.onWebSocketError = (event) => {
      console.error('WebSocket Transport Error:', event);
    };

    client.onWebSocketClose = (event) => {
      console.warn('WebSocket Connection Closed:', event);
      setConnected(false);
    };

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [token]);

  return { stompClient, connected };
};
