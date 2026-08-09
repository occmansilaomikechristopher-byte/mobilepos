import {useEffect, useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {showMessage} from 'react-native-flash-message';
import {API_URL} from '../utils/constant';

const buildWebSocketUrl = () => {
    const baseUrl = API_URL.replace(/\/$/, '');
    const wsUrl = baseUrl.replace(/^http/, 'ws');
    return `${wsUrl}/notification-ws`;
};

const parseNotificationPayload = (rawData: string) => {
    try {
        const payload = JSON.parse(rawData);
        return payload;
    } catch (error) {
        return {title: 'Notification', message: rawData};
    }
};

const useCashierNotificationSocket = () => {
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let isMounted = true;

        const openSocket = async () => {
            const userType = await AsyncStorage.getItem('userType');
            if (userType !== '8') {
                return;
            }

            const userId = await AsyncStorage.getItem('userid');
            const url = new URL(buildWebSocketUrl());
            url.searchParams.append('role', 'cashier');
            if (userId) {
                url.searchParams.append('userid', userId);
            }

            const socket = new WebSocket(url.toString());
            wsRef.current = socket;

            socket.onopen = () => {
                console.log('[CashierNotificationSocket] connected', url.toString());
            };

            socket.onmessage = event => {
                if (!isMounted) return;
                const payload = parseNotificationPayload(event.data);
                const title = payload.title || 'Cashier Notification';
                const message = payload.message || payload.body || 'New realtime notification.';

                showMessage({
                    message: title,
                    description: message,
                    type: 'info',
                    duration: 5000,
                });
            };

            socket.onerror = event => {
                console.error('[CashierNotificationSocket] error', event);
            };

            socket.onclose = event => {
                console.log('[CashierNotificationSocket] closed', event.code, event.reason);
            };
        };

        openSocket();

        return () => {
            isMounted = false;
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);
};

export default useCashierNotificationSocket;
