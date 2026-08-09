import {useQuery} from 'react-query';
import axiosConfig from '../utils/axiosConfig';

const fetchData = async () => {
    try {
        const {status, data} = await axiosConfig.get('mobile-orders/').catch(error => {
            console.error('❌ useOrders axios Error:', error.response?.data || error.message);
            throw error;
        });
        if (status !== 200) {
            throw new Error('Error found.');
        }
        return data || [];
    } catch (error: any) {
        console.error('❌ useOrders fetchData Error:', error);
        throw error;
    }
};

function useOrders() {
    return useQuery({
        queryKey: ['order'],
        queryFn: () => fetchData(),
        keepPreviousData: true,
        // refetchInterval: 10000,
    });
}

export default useOrders;
