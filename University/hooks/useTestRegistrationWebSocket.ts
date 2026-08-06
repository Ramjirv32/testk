import { useEffect, useRef, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_GO_API_URL?.replace(/^http/, 'ws') || 'ws://localhost:7000';

interface WebSocketMessage {
    type: string;
    data?: any;
    timestamp?: string;
}

interface UseTestRegistrationWebSocketOptions {
    userId?: string;
    testType: 'mbti' | 'cognitive' | 'psychometric' | 'pescio';
    onRegistrationApproved?: (data: { registration_id: string; message: string }) => void;
    onRegistrationRejected?: (data: { registration_id: string; reason: string }) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
}

export function useTestRegistrationWebSocket(options: UseTestRegistrationWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const reconnectAttempts = useRef(0);
    const optionsRef = useRef(options);
    const maxReconnectAttempts = 5;

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const connect = useCallback(() => {
        if (!options.userId) {
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {

            const ws = new WebSocket(`${WS_URL}/ws/user/${options.userId}`);

            ws.onopen = () => {
                console.log(` Test Registration WebSocket connected for user ${options.userId}`);
                reconnectAttempts.current = 0;
                optionsRef.current.onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    console.log(' Test Registration WebSocket message:', message);

                    const testType = optionsRef.current.testType;
                    
                    switch (message.type) {
                        case `${testType}_registration_approved`:
                            optionsRef.current.onRegistrationApproved?.(message.data);
                            break;
                        case `${testType}_registration_rejected`:
                            optionsRef.current.onRegistrationRejected?.(message.data);
                            break;

                        case 'registration_approved':
                            if (message.data?.test_type === testType) {
                                optionsRef.current.onRegistrationApproved?.(message.data);
                            }
                            break;
                        case 'registration_rejected':
                            if (message.data?.test_type === testType) {
                                optionsRef.current.onRegistrationRejected?.(message.data);
                            }
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
                    console.warn(' Test Registration WebSocket connection issue (backend may be offline)');
                }
                optionsRef.current.onError?.(error);
            };

            ws.onclose = (event) => {
                if (event.code !== 1000) {
                    console.log(' Test Registration WebSocket disconnected (code:', event.code, ')');
                } else {
                    console.log(' Test Registration WebSocket disconnected normally');
                }
                optionsRef.current.onDisconnect?.();
                wsRef.current = null;

                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current += 1;
                        console.log(` Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
                        connect();
                    }, delay);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Error creating WebSocket:', error);
        }
    }, [options.userId, options.testType]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close(1000, 'Component unmounting');
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
