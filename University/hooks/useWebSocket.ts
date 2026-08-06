import { useEffect, useRef, useState } from 'react';

interface UseWebSocketOptions {
    onMessage?: (data: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const optionsRef = useRef(options);

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    useEffect(() => {

        if (!url) {
            console.log('WebSocket URL is empty, skipping connection');
            return;
        }

        const connect = () => {
            try {
                const ws = new WebSocket(url);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log('WebSocket connected to:', url);
                    setIsConnected(true);
                    optionsRef.current.onOpen?.();
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('WebSocket message received:', data);
                        optionsRef.current.onMessage?.(data);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                ws.onerror = (error) => {
                    // WebSocket Event objects serialize as {} — log the URL instead
                    console.warn(`WebSocket connection failed: ${url}`);
                    optionsRef.current.onError?.(error);
                };

                ws.onclose = (event) => {
                    console.log('WebSocket disconnected');
                    setIsConnected(false);
                    optionsRef.current.onClose?.();

                    // Only reconnect if the close wasn't clean (server went away, not a URL error)
                    // Code 1006 = abnormal closure (server dropped); don't reconnect on initial failure
                    if (event.code === 1006 && wsRef.current) {
                        reconnectTimeoutRef.current = setTimeout(() => {
                            console.log('Attempting to reconnect...');
                            connect();
                        }, 5000);
                    }
                };
            } catch (error) {
                console.error('Error creating WebSocket:', error);
            }
        };

        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [url]);

    const sendMessage = (data: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket is not connected');
        }
    };

    return { isConnected, sendMessage };
}
