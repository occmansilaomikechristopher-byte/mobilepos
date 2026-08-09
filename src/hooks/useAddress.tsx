import {useQuery} from 'react-query';
import axiosConfig from '../utils/axiosConfig';

const fetchData = async () => {
    try {
        const {status, data} = await axiosConfig.get('mobile-address/').catch(error => {
            console.error('❌ useAddress axios Error:', error.response?.data || error.message);
            throw error;
        });
        if (status !== 200) {
            throw new Error('Error found.');
        }
        return data || {};
    } catch (error: any) {
        console.error('❌ useAddress fetchData Error:', error);
        throw error;
    }
};

function useAddress() {
    return useQuery({
        queryKey: ['address'],
        queryFn: () => fetchData(),
        keepPreviousData: true,
        // refetchInterval: 5000,
    });
}

export default useAddress;
