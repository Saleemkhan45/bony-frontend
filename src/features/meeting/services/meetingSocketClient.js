import { io as createSocketIoClient } from 'socket.io-client';

function addListener(store, eventName, handler) {
  if (!store.has(eventName)) {
    store.set(eventName, new Set());
  }

  store.get(eventName).add(handler);
}

function removeListener(store, eventName, handler) {
  store.get(eventName)?.delete(handler);
}

function emitToLocalListeners(store, eventName, payload) {
  store.get(eventName)?.forEach((handler) => {
    handler(payload);
  });
}

function buildSocketTransport({ auth, url }) {
  if (typeof window === 'undefined') {
    return null;
  }

  return createSocketIoClient(url, {
    auth,
    autoConnect: false,
    transports: ['websocket', 'polling'],
  });
}

export function createMeetingSocketClient({ url, auth, socketFactory } = {}) {
  const localListeners = new Map();
  const transport =
    typeof socketFactory === 'function' ? socketFactory({ url, auth }) : buildSocketTransport({ url, auth });
  const mode = transport ? 'live' : 'preview';
  let previewConnected = false;
  let reconnectAttemptCount = 0;
  const manager = transport?.io ?? null;

  if (transport?.on) {
    transport.on('connect', () => {
      if (reconnectAttemptCount > 0) {
        emitToLocalListeners(localListeners, 'transport:reconnected', {
          attemptCount: reconnectAttemptCount,
          mode,
          socketId: transport.id,
          url,
        });
        reconnectAttemptCount = 0;
      }

      emitToLocalListeners(localListeners, 'transport:connected', {
        mode,
        socketId: transport.id,
        url,
      });
    });

    transport.on('disconnect', (reason) => {
      emitToLocalListeners(localListeners, 'transport:disconnected', {
        mode,
        reason,
        url,
      });
    });

    transport.on('connect_error', (error) => {
      emitToLocalListeners(localListeners, 'transport:error', {
        mode,
        message: error?.message ?? 'Unable to connect to the meeting transport.',
        url,
      });
    });
  }

  if (manager?.on) {
    manager.on('reconnect_attempt', (attemptNumber) => {
      reconnectAttemptCount = attemptNumber ?? reconnectAttemptCount + 1;

      emitToLocalListeners(localListeners, 'transport:reconnecting', {
        attemptCount: reconnectAttemptCount,
        mode,
        url,
      });
    });

    manager.on('reconnect_failed', () => {
      emitToLocalListeners(localListeners, 'transport:reconnect-failed', {
        attemptCount: reconnectAttemptCount,
        mode,
        url,
      });
    });
  }

  return {
    mode,
    connect() {
      if (transport?.connect) {
        transport.connect();
        return;
      }

      previewConnected = true;
      emitToLocalListeners(localListeners, 'transport:connected', {
        mode,
        url,
      });
    },
    disconnect() {
      if (transport?.disconnect) {
        transport.disconnect();
        return;
      }

      previewConnected = false;
      emitToLocalListeners(localListeners, 'transport:disconnected', {
        mode,
        url,
      });
    },
    emit(eventName, payload) {
      if (transport?.emit) {
        transport.emit(eventName, payload);
        return;
      }

      emitToLocalListeners(localListeners, 'transport:debug', {
        mode,
        eventName,
        payload,
      });
    },
    on(eventName, handler) {
      addListener(localListeners, eventName, handler);

      if (transport?.on) {
        transport.on(eventName, handler);
      }

      return () => {
        removeListener(localListeners, eventName, handler);

        if (transport?.off) {
          transport.off(eventName, handler);
        }
      };
    },
    off(eventName, handler) {
      removeListener(localListeners, eventName, handler);

      if (transport?.off) {
        transport.off(eventName, handler);
      }
    },
    isConnected() {
      return transport ? Boolean(transport.connected) : previewConnected;
    },
  };
}
