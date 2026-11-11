// DraftRoom Socket.io Client Manager
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getClientId(): string {
  if (typeof window === 'undefined') return 'server_render';
  let cid = localStorage.getItem('draftroom_client_id');
  if (!cid) {
    cid = `c_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    localStorage.setItem('draftroom_client_id', cid);
  }
  return cid;
}

export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    // If running in development or standard host
    const proto = window.location.protocol;
    const host = window.location.hostname;
    return `${proto}//${host}:4000`;
  }
  return 'http://localhost:4000';
}

export function getSocket(): Socket {
  if (!socketInstance) {
    const url = getSocketUrl();
    socketInstance = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
  }
  return socketInstance;
}

