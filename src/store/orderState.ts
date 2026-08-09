import {create} from 'zustand';
import axiosConfig from '../utils/axiosConfig';
import {LOADING_TIME} from '../utils/constant';
import useGlobalStore from './globalState';
import {Orders} from '../utils/interfaces';

interface Address {
    lat: string;
    lng: string;
}

interface Props {
    currentAddress: Address;
    loading: boolean;
    setLoading: (value: boolean) => void;
    success: boolean;
    setSuccess: (value: boolean) => void;
    successOrder: boolean;
    setSuccessOrder: (value: boolean) => void;
    searchAdd: boolean;
    setSearchAdd: (searchAdd: boolean) => void;
    newAddress: boolean;
    setNewAddress: (value: boolean) => void;
    addressList: boolean;
    setAddressList: (value: boolean) => void;
    register(value: any): Promise<any>;
    setCurrentAddress(value: any): void;
    saveAddress(value: any): void;
    saveOrder(value: any): void;
    pendingOrder: Orders;
    setPendingOrder(value: any): void;
    successAddress: boolean;
    setSuccessAddress(value: any): void;
    activeAddress: any;
    setActiveAddress(value: any): void;
    startRoute(value: any): void;
    startRouteBooking(value: any): void;
    successFailed: boolean;
    setSuccessFailed: (value: boolean) => void;
    orderDetails: any;
    setOrderDetails(value: any): void;
    markRead(value: any): Promise<any>;
}

const useOrderStore = create<Props>(set => ({
    loading: false,
    setLoading: value => set({loading: value}),
    success: false,
    setSuccess: value => set({success: value}),
    successOrder: false,
    setSuccessOrder: value => set({successOrder: value}),
    successFailed: false,
    setSuccessFailed: value => set({successFailed: value}),
    successAddress: false,
    setSuccessAddress: value => set({successAddress: value}),
    searchAdd: false,
    setSearchAdd: value => set({searchAdd: value}),
    newAddress: false,
    setNewAddress: value => set({newAddress: value}),
    addressList: false,
    setAddressList: value => set({addressList: value}),
    currentAddress: {lat: '', lng: ''},
    setCurrentAddress: value => set({currentAddress: value}),
    pendingOrder: {
        key: '',
        id: '',
        pickup_date: '',
        pickup_time: '',
        total: '0',
        address_id: '',
        order_no: '',
        status: '',
        driver_name: '',
    },
    setPendingOrder: value => set({pendingOrder: value}),
    activeAddress: '',
    setActiveAddress: value => set({activeAddress: value}),
    orderDetails: null as Orders | null,
    setOrderDetails: (value: Orders) => set({orderDetails: value}),
    register: async (params: any) => {
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        const response = await axiosConfig.post('mobile-register/', params);
        return response?.data;
    },

    saveAddress: async (params: any) => {
        useGlobalStore
            .getState()
            .setLoading({visible: true, message: 'Submitting'});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            const response = await axiosConfig.post('save-address', params);
            const {result, error} = response.data;
            set({successAddress: true});
            useGlobalStore.getState().setLoading({visible: false, message: ''});
            return true;
        } catch (error) {
            useGlobalStore.getState().setLoading({visible: false, message: ''});
            throw error;
        }
    },
    saveOrder: async (params: any) => {
        set({loading: true});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            const response = await axiosConfig.post('save-order/', params);
            const {result, error} = response.data;
            if (!result) {
                useGlobalStore
                    .getState()
                    .setLoading({visible: false, message: ''});
                return;
            }
            useGlobalStore.getState().setLoading({visible: false, message: ''});
            set({successOrder: true});
            return true;
        } catch (error) {
            set({loading: false});
            throw error;
        }
    },
    startRoute: async (params: any) => {
        useGlobalStore
            .getState()
            .setLoading({visible: true, message: 'Submitting'});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        const response = await axiosConfig.post('start-route', params);
        const {result, error} = response.data;
        if (!result) {
            useGlobalStore.getState().setLoading({visible: false, message: ''});
            return;
        }
        useGlobalStore.getState().setLoading({visible: false, message: ''});
        set({successOrder: true});
    },
    startRouteBooking: async (params: any) => {
        useGlobalStore
            .getState()
            .setLoading({visible: true, message: 'Submitting'});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            const response = await axiosConfig.post(
                'start-route-booking',
                params,
            );
            const {result, error} = response.data;
            if (!result) {
                useGlobalStore
                    .getState()
                    .setLoading({visible: false, message: ''});
                return;
            }
            useGlobalStore.getState().setLoading({visible: false, message: ''});
            useGlobalStore.getState().setMessage({
                visible: true,
                message: 'Routes Successfully Updated!',
            });
            set({successFailed: true});
            return true;
        } catch (error) {
            useGlobalStore.getState().setLoading({visible: false, message: ''});
            throw error;
        }
    },
    sendMessage: async (params: any) => {
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            const response = await axiosConfig.post('send-message/', params);
            set({success: true});
            return true;
        } catch (error) {
            throw error;
        }
    },
    markRead: async (params: any) => {
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            const response = await axiosConfig.post(
                'notification-mark/',
                params,
            );
            set({success: true});
            return true;
        } catch (error) {
            throw error;
        }
    },
}));

export default useOrderStore;
