import { useEffect, useRef, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_GO_API_URL?.replace(/^http/, 'ws') || 'ws://localhost:7000';

interface WebSocketMessage {
    type: string;
    data?: any;
    timestamp?: string;
}

interface UseAdminWebSocketOptions {
    onCollegeApproved?: (data: { college_name: string; approved_by: string }) => void;
    onCollegeRejected?: (data: { college_name: string }) => void;
    onUserCreated?: (data: { email: string; role: string }) => void;
    onUserDeleted?: (data: { email: string }) => void;
    onRedisUpdate?: (data: { action: string; count: number }) => void;
    onInitialStats?: (data: { pending_count: number; approved_count: number }) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
}

export function useAdminWebSocket(options: UseAdminWebSocketOptions = {}) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const reconnectAttempts = useRef(0);
    const optionsRef = useRef(options);
    const maxReconnectAttempts = 5;

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const ws = new WebSocket(`${WS_URL}/ws/admin`);

            ws.onopen = () => {
                console.log(' Admin WebSocket connected');
                reconnectAttempts.current = 0;
                optionsRef.current.onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    console.log(' Admin WebSocket message:', message);

                    switch (message.type) {
                        case 'college_approved':
                            optionsRef.current.onCollegeApproved?.(message.data);
                            break;
                        case 'college_rejected':
                            optionsRef.current.onCollegeRejected?.(message.data);
                            break;
                        case 'user_created':
                            optionsRef.current.onUserCreated?.(message.data);
                            break;
                        case 'user_deleted':
                            optionsRef.current.onUserDeleted?.(message.data);
                            break;
                        case 'redis_update':
                            optionsRef.current.onRedisUpdate?.(message.data);
                            break;
                        case 'initial_stats':
                            optionsRef.current.onInitialStats?.(message.data);
                            break;
                        default:
                            console.log('Unknown message type:', message.type);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {

                if (wsRef.current?.readyState !== WebSocket.CONNECTING) {
                    console.warn(' Admin WebSocket connection issue (backend may be offline)');
                }
                optionsRef.current.onError?.(error);
            };

            ws.onclose = (event) => {

                if (event.code !== 1000) {
                    console.log(' Admin WebSocket disconnected (code:', event.code, ')');
                } else {
                    console.log(' Admin WebSocket disconnected normally');
                }
                optionsRef.current.onDisconnect?.();
                wsRef.current = null;

                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, delay);
                } else {
                    console.error('Max reconnection attempts reached');
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected: wsRef.current?.readyState === WebSocket.OPEN,
        reconnect: connect,
        disconnect,
    };
}
