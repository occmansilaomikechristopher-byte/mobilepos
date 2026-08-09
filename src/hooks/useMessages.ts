import {useQuery} from 'react-query';
import axiosConfig from '../utils/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fetchData = async (order_id: any) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('userType');
        if (!token) {
            console.warn('⚠️ useMessages: No token found');
            return;
        }
        const {status, data} = await axiosConfig.get(
            `messages/?order_id=${order_id}`,
        ).catch(error => {
            console.error('❌ useMessages axios Error:', error.response?.data || error.message);
            throw error;
        });
        if (status !== 200) {
            throw new Error('Error found.');
        }
        return data || [];
    } catch (error: any) {
        console.error('❌ useMessages fetchData Error:', error);
        throw error;
    }
};

function useMessages(order_id: any) {
    return useQuery({
        queryKey: ['messages'],
        queryFn: () => fetchData(order_id),
        keepPreviousData: true,
        // refetchInterval: 5000,
    });
}

export default useMessages;
