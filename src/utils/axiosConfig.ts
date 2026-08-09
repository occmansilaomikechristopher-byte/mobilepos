import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';
import {showMessage, hideMessage} from 'react-native-flash-message';
import {API_URL, API_URLS, API_TOKEN} from './constant';
// To change the server, edit BASE_URL in utils/constant.ts

const instance = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`,
    },
});

const getNextBaseUrl = currentBaseUrl => {
    const currentIndex = API_URLS.findIndex(url => url === currentBaseUrl);
    return currentIndex >= 0 && currentIndex < API_URLS.length - 1
        ? API_URLS[currentIndex + 1]
        : null;
};

const getToken = async () => {
    let token = await AsyncStorage.getItem('token');
    return token;
};

const normalizeRequestUrl = config => {
    if (!config.url) {
        return config;
    }
    const url = config.url.toString().trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return config;
    }
    if (url.startsWith('?')) {
        config.url = `ajax.php${url}`;
        return config;
    }
    const action = url.replace(/^\/+|\/+$/g, '');
    config.url = `ajax.php?action=${action}`;
    return config;
};

instance.interceptors.request.use(
    async config => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        normalizeRequestUrl(config);
        if (__DEV__) {
            console.log(
                `[AXIOS REQUEST] baseURL=${config.baseURL} url=${config.url} method=${config.method}`,
            );
        }
        return config;
    },
    error => {
        if (__DEV__) {
            console.log('[AXIOS REQUEST ERROR]', {
                message: error.message,
                code: error.code,
                config: error.config,
            });
        }
        return Promise.reject(error);
    },
);

instance.interceptors.response.use(
    response => response,
    async error => {
        if (__DEV__) {
            console.log('[AXIOS RESPONSE ERROR]', {
                message: error.message,
                code: error.code,
                url: error.config?.url,
                baseURL: error.config?.baseURL,
                status: error.response?.status,
                data: error.response?.data,
                request: error.request,
            });
        }

        const shouldRetry =
            error.config &&
            !error.config.__retry &&
            error.message === 'Network Error';
        if (shouldRetry) {
            const nextBaseUrl = getNextBaseUrl(
                error.config.baseURL || instance.defaults.baseURL,
            );
            if (nextBaseUrl) {
                error.config.__retry = true;
                error.config.baseURL = nextBaseUrl;
                instance.defaults.baseURL = nextBaseUrl;
                return instance(error.config);
            }
        }

        const statusCode = error.response ? error.response.status : null;
        const responseData = error.response ? error.response.data : null;
        let errorMessage =
            responseData?.message ||
            responseData?.error ||
            responseData?.non_field_errors ||
            error.message ||
            'Network request failed';
        const requestUrl = error.config?.url || 'unknown';
        if (error.response?.data?.error && statusCode === 401) {
            Alert.alert(
                'Error',
                error.response?.data?.error,
                [
                    {
                        text: 'Okay',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                    },
                    // {
                    //     text: 'Contact Admin',
                    //     onPress: () => {
                    //        {}
                    //     },
                    // },
                ],
                {cancelable: false},
            );
            return Promise.reject(error);
        }
        if (error.response?.data?.message) {
            errorMessage = error.response?.data?.message;
        }
        if (statusCode === 403) {
            Alert.alert(
                `Error: ${statusCode}(Authentication required)`,
                'You must include a valid authentication token in the request headers to access this resource.',
                [
                    {
                        text: 'Okay',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                    },
                ],
                {cancelable: false},
            );
            return Promise.reject(error);
        }
        if (!requestUrl.includes('login')) {
            showMessage({
                message: `Error: ${statusCode || 'Network'}`,
                description: errorMessage || 'No error message to show.',
                type: 'danger',
            });
            return Promise.reject(error);
        }

        Alert.alert(
            'Error',
            errorMessage || 'Unknown Error',
            [
                {
                    text: 'Okay',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                // {
                //     text: 'Contact Admin',
                //     onPress: () => {
                //        {}
                //     },
                // },
            ],
            {cancelable: false},
        );

        return Promise.reject(error);
    },
);

export default instance;
