import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL, getToken } from './client';

// Subscribes to 'leave:update' events so an employee sees HR's
// approve/reject decision the moment it happens, with no manual refresh.
export function useLeaveSocket(onUpdate) {
  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;

    const socket = io(BASE_URL, { auth: { token } });
    socket.on('leave:update', onUpdate);

    return () => {
      socket.off('leave:update', onUpdate);
      socket.disconnect();
    };
  }, [onUpdate]);
}
