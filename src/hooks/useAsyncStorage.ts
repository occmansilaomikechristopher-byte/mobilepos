import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getData = async (key: string): Promise<string | null> => {
    try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
            // console.log('Data found:', value);
            return value;
        } else {
            // console.log('Data not found for key:', key);
            return null;
        }
    } catch (error) {
        console.error('Error reading value:', error);
        throw error;
    }
};

const useAsyncStorage = (key: string) => {
    const [data, setData] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getData(key);
                setData(result);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [key]);

    return {data, loading, error};
};

export default useAsyncStorage;
