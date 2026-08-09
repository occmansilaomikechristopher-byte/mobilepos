import {useQuery} from 'react-query';
import axiosConfig from '../utils/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        const branchId = await AsyncStorage.getItem('branch_id');
        const query = new URLSearchParams();
        query.append('action', 'mobile-notification-list');
        if (role) query.append('role', role);
        if (branchId) query.append('branch_id', branchId);
        const {status, data} = await axiosConfig.get(`?${query.toString()}`).catch(error => {
            console.error('❌ useNotificationList axios Error:', error.response?.data || error.message);
            throw error;
        });
        if (status !== 200) {
            throw new Error('Error found.');
        }
        return sanitizeNotifications(data?.data || []);
    } catch (error: any) {
        console.error('❌ useNotificationList fetchData Error:', error);
        throw error;
    }
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
