import {useQuery} from 'react-query';
import axiosConfig from '../utils/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_READ_NOTIFICATION_IDS = 'read_notification_ids';

const getLocalReadNotificationIds = async () => {
    const value = await AsyncStorage.getItem(LOCAL_READ_NOTIFICATION_IDS);
    try {
        const ids = value ? JSON.parse(value) : [];
        return Array.isArray(ids) ? ids.map(Number) : [];
    } catch {
        return [];
    }
};

const saveLocalReadNotificationIds = async (notificationIds: number[]) => {
    const existingIds = await getLocalReadNotificationIds();
    const ids = Array.from(new Set([...existingIds, ...notificationIds]));
    await AsyncStorage.setItem(LOCAL_READ_NOTIFICATION_IDS, JSON.stringify(ids));
};

const sanitizeNotifications = (notifications: any[]) =>
    notifications.map(item => ({
        ...item,
        title:
            typeof item.title === 'string'
                ? item.title.replace(/branch id 1/gi, 'Main Branch')
                : item.title,
        message:
            typeof item.message === 'string'
                ? item.message.replace(/branch id 1/gi, 'Main Branch')
                : item.message,
    }));

const fetchData = async () => {
    try {
        const role = await AsyncStorage.getItem('userType');
        const userId = await AsyncStorage.getItem('userid');
        const branchId = await AsyncStorage.getItem('branch_id');
        const query = new URLSearchParams();
        query.append('action', 'mobile-notification-list');
        if (role) query.append('role', role);
        if (userId) query.append('user_id', userId);
        if (branchId) query.append('branch_id', branchId);
        const {status, data} = await axiosConfig.get(`?${query.toString()}`).catch(error => {
            console.error('❌ useNotificationList axios Error:', error.response?.data || error.message);
            throw error;
        });
        if (status !== 200) {
            throw new Error('Error found.');
        }
        const localReadIds = await getLocalReadNotificationIds();
        return sanitizeNotifications(data?.data || []).map(notification =>
            localReadIds.includes(Number(notification.id))
                ? {...notification, is_read: 1}
                : notification,
        );
    } catch (error: any) {
        console.error('❌ useNotificationList fetchData Error:', error);
        throw error;
    }
};

export const getUnreadNotificationCount = (notifications: any[] = []) =>
    notifications.filter(notification => Number(notification?.is_read) !== 1).length;

export const markNotificationsRead = async (notificationIds: number[]) => {
    if (notificationIds.length === 0) {
        return;
    }

    const [role, userId, branchId] = await AsyncStorage.multiGet([
        'userType',
        'userid',
        'branch_id',
    ]).then(values => values.map(([, value]) => value));

    const {status, data: responseData} = await axiosConfig.post(
        '?action=mobile-notification-read',
        {
            notification_ids: notificationIds,
            role: role ? Number(role) : 0,
            user_id: userId ? Number(userId) : 0,
            branch_id: branchId ? Number(branchId) : 0,
        },
    );
    let data = responseData;
    if (typeof responseData === 'string') {
        try {
            data = JSON.parse(responseData);
        } catch {
            data = null;
        }
    }
    if (status >= 200 && status < 300 && !data) {
        await saveLocalReadNotificationIds(notificationIds);
        return;
    }
    const succeeded =
        status >= 200 &&
        status < 300 &&
        (data?.result === true ||
            data?.result === 1 ||
            data?.result === '1' ||
            data?.success === true ||
            data?.success === 1 ||
            data?.success === '1');
    if (!succeeded) {
        throw new Error(data?.message || 'Unable to mark notifications as read.');
    }
    await saveLocalReadNotificationIds(notificationIds);
};

function useNotificationList() {
    return useQuery({
        queryKey: ['notification-list'],
        queryFn: () => fetchData(),
        keepPreviousData: true,
        refetchInterval: 5000,
    });
}

export default useNotificationList;
