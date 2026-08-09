import {Platform, StyleSheet} from 'react-native';

// Server base — change this in ONE place and the API + image URLs follow.
// On Android emulator, use 10.0.2.2 to reach the host machine.
// On Android device, use the host PC LAN IP directly when on the same network.
const IOS_DEV_BACKEND_URL = 'http://localhost/payroll/';
const ANDROID_DEVICE_DEV_BACKEND_URL = 'http://192.168.1.13/payroll/';
const ANDROID_DEVICE_FALLBACK_BACKEND_URL = 'http://192.168.137.1/payroll/';
const ANDROID_EMULATOR_DEV_BACKEND_URL = 'http://10.0.2.2/payroll/';
const PROD_BACKEND_URL = 'http://192.168.1.13/payroll/';

const ANDROID_BACKEND_URLS = [
    ANDROID_DEVICE_DEV_BACKEND_URL,
    ANDROID_DEVICE_FALLBACK_BACKEND_URL,
];

export const BASE_URL = __DEV__
    ? Platform.OS === 'android'
        ? ANDROID_BACKEND_URLS[0]
        : IOS_DEV_BACKEND_URL
    : PROD_BACKEND_URL;
export const API_URL = BASE_URL;
export const API_TOKEN = 'YXBpX3Rva2VuOTM0Mzg3NjUzNjc1Mw==';
export const API_URLS = __DEV__
    ? Platform.OS === 'android'
        ? ANDROID_BACKEND_URLS
        : [IOS_DEV_BACKEND_URL]
    : [PROD_BACKEND_URL];
export const PRODUCT_IMG_URL = `${BASE_URL}/uploads/products/`;

export const LOADING_TIME = 1000;
export const TIME_MODAL = 200;
export const MAP_API_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';
export const MAP_API_URL_GEOCODING =
    'https://api.mapbox.com/directions/v5/mapbox';
export const MAP_KEY =
    'sk.eyJ1IjoibmllbGRhY3VsYW4iLCJhIjoiY2x3MDczdnByMnVkZTJpcXptYzhnanp1cyJ9.pLmvWJnZnaChOb9QSIChnw';
export const ERROR_COLOR = '#DC2626';
export const RIPPLE_COLOR = '#D32F2F1A';
export const PRIMARY_COLOR = '#219688';
export const SECONDARY_COLOR = '#48dccb';
export const FAILED_COLOR = '#EF4444';
export const SUCCESS_COLOR = '#16A34A';
export const BORDER_COLOR = '#64748B';

export const BORDER_STYLE = StyleSheet.create({
    borderStyle: {
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 3,
    },
});

export const STATUS = [
    {key: 'unassigned', value: 'Unassigned', color: '#d3d3d3'}, // Light grey
    {key: 'pending', value: 'Pending', color: '#ffa500'}, // Orange
    {key: 'declined', value: 'Declined', color: '#ff4500'}, // OrangeRed
    {key: 'accepted', value: 'Accepted', color: '#32cd32'}, // LimeGreen
    {key: 'waiting-pickup', value: 'Waiting For Pickup', color: '#2196F3'}, // Gold
    {key: 'picked-up', value: 'Picked Up', color: '#1e90ff'}, // DodgerBlue
    {key: 'laundering', value: 'Laundering', color: '#4682b4'}, // SteelBlue
    {key: 'waiting-delivery', value: 'Waiting For Delivery', color: '#ff69b4'}, // HotPink
    {key: 'delivered', value: 'Delivered', color: '#7cfc00'}, // LawnGreen
    {key: 'for-pickup', value: 'For Pick Up', color: '#ff9800'},
    {key: 'completed', value: 'Completed', color: '#8BC34A'},
    {key: 'cancelled', value: 'Cancelled', color: '#ff0000'}, // Red
    {key: 'for-delivery', value: 'For Delivery', color: '#ff9800'}, // DarkTurquoise
];

export const FAILED_OPTIONS = [
    {id: 1, title: 'Customer Cannot Be Reached'},
    {id: 2, title: 'Incorrect Address'},
    {id: 3, title: 'Recipient Unavailable'},
    {id: 4, title: 'Access Issues'},
    {id: 5, title: 'Weather Conditions'},
    {id: 6, title: 'Failed Delivery Attempts'},
    {id: 7, title: 'Damaged Package'},
    {id: 9, title: 'Payment Issues'},
];

export const VERSIONS = 'Version 1.0.3';
