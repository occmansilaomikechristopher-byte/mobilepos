import {create} from 'zustand';
import axiosConfig from '../utils/axiosConfig';
import {LOADING_TIME} from '../utils/constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Loading} from '../components';
import {
    insertDepartmentsData,
    insertPositionsData,
    insertEmployeeData,
    insertMyEmployeeData,
    fetchMyEmployeeData,
    insertDTRData,
    deleteMyEmployeeData,
    deleteMyDTRData,
    updateMyDTRData,
    updateMyDTRDetails,
    isertMyDTRDetails,
    deleteMyDTRDetailsData,
    insertMyDTRDetails,
    deleteVisitorLogsData,
    updateMyDTRDataHours,
    updateMyDTRDataArray,
} from '../utils/databaseService';

interface Message {
    visible: boolean;
    message: string;
    type: string;
}

interface Loading {
    visible: boolean;
    message: string;
}

interface ErorMessage {
    visible: boolean;
    message: string;
    type: string;
}

interface Success {
    visible: boolean;
    type: string;
}

interface Notification {
    title: any;
    message: any;
    isRead: any;
    type: any;
    details: any;
    nid: number;
    id: number;
}

interface Employee {
    id?: any;
    firstname?: string;
    middlename?: string;
    lastname?: string;
    employee_no?: string;
    code?: string;
    department?: string;
    position?: string;
    weekly_payroll?: string;
}

interface Props {
    message: Message;
    setMessage: (value: any) => void;
    loading: Loading;
    setLoading: (value: any) => void;
    success: Success;
    setSuccess: (value: any) => void;
    successPN: Success;
    setSuccessPN: (value: any) => void;
    profile: boolean;
    setProfile: (value: boolean) => void;
    role: any;
    setRole: (value: any) => void;
    error: ErorMessage;
    setError: (value: any) => void;
    pullOnline(): Promise<any>;
    checkLogin(value: any): Promise<any>;
    clearCart(): void;
    cartItems: Employee[];
    addToCart: (employee: Employee) => void;
    removeFromCart: (employee: Employee) => void;
    updateEmployeeCode: (employeeId: string, newCode: string) => void; // New function to update employee code
    saveMyEmployee(value: any): Promise<any>;
    logsSummary: any;
    setLogsSummary: (value: any) => void;
    myEmployees: Employee[];
    setMyEmployees: (value: any) => void;
    attendanceSummary: any;
    setAttendanceSummary: (value: any) => void;
    pushDTR(value: any): Promise<any>;
    dtr: any;
    setDTR: (value: any) => void;
    saveDTR(value: any): Promise<any>;
    deleteMyEmployee(value: any): Promise<any>;
    deleteDTR(value: any): Promise<any>;
    updateLogsDTR(value: any): Promise<any>;
    updateLogsDTRDetailsAction(value: any): Promise<any>;
    isertMyDTRDetailsAction(value: any): Promise<any>;
    deleteMyDTRDetailsDataAction(value: any): Promise<any>;
    insertMyDTRDetailsAction(value: any): Promise<any>;
    saveLogs(value: any): Promise<any>;
    deleteLogs(value: any): Promise<any>;
    updateLogsDTRHours(value: any): Promise<any>;
}

const useGlobalStore = create<Props>(set => ({
    dtr: null,
    setDTR: value => set({dtr: value}),
    myEmployees: [],
    setMyEmployees: value => set({myEmployees: value}),
    logsSummary: [],
    setLogsSummary: value => set({logsSummary: value}),
    attendanceSummary: [],
    setAttendanceSummary: value => set({attendanceSummary: value}),
    cartItems: [],
    addToCart: employee =>
        set(state => ({
            cartItems: [...state.cartItems, employee],
        })),
    clearCart: () =>
        set(state => ({
            cartItems: [],
        })),
    removeFromCart: employee =>
        set(state => ({
            cartItems: state.cartItems.filter(item => item.id !== employee.id),
        })),
    updateEmployeeCode: (employeeId, newCode) =>
        set(state => ({
            cartItems: state.cartItems.map(item =>
                item.id === employeeId ? {...item, code: newCode} : item,
            ),
        })),
    message: {visible: false, message: '', type: ''},
    setMessage: value => set({message: value}),
    error: {visible: false, message: '', type: ''},
    setError: value => set({error: value}),
    loading: {visible: false, message: ''},
    setLoading: value => set({loading: value}),
    profile: false,
    setProfile: value => set({profile: value}),
    success: {visible: false, message: '', type: ''},
    setSuccess: value => set({success: value}),
    successPN: {visible: false, message: '', type: ''},
    setSuccessPN: value => set({successPN: value}),
    role: '',
    setRole: value => set({role: value}),
    checkLogin2: async (params: any) => {
        // set({loading: {visible: true, message: 'Authenticating'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            const response = await axiosConfig.post(
                '?action=mobile-login-check',
                params,
            ).catch(error => {
                console.error('❌ checkLogin2 Axios Error:', error.response?.data || error.message);
                throw error;
            });
            const {result, error, message} = response.data;
            if (!result) {
                set({
                    message: {
                        visible: true,
                        message: message || 'Error Login',
                        type: '',
                    },
                });
                set({
                    error: {
                        visible: true,
                        message: message,
                        type: 'error-login',
                    },
                });
                set({loading: {visible: false, message: ''}});
                return;
            }
            const {role, id, name, employer_name} = response.data?.user;
            const {site_name, site_address, site_code, cluster} =
                response.data?.site;
            const site_id = response.data?.site?.id;
            await AsyncStorage.setItem('userid', id.toString());
            await AsyncStorage.setItem('userType', role.toString());
            await AsyncStorage.setItem('name', name.toString());
            await AsyncStorage.setItem('site_id', site_id.toString());
            await AsyncStorage.setItem('site_code', site_code.toString());
            await AsyncStorage.setItem('site_name', site_name.toString());
            await AsyncStorage.setItem('site_address', site_address.toString());
            await AsyncStorage.setItem(
                'employer_name',
                employer_name.toString(),
            );
            await AsyncStorage.setItem('cluster', cluster.toString());
            set({role: role});
            set({success: {visible: true, type: 'login-success'}});
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ checkLogin2 Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                error: {
                    visible: true,
                    message: error?.message || 'Error Login',
                    type: 'error-login',
                },
            });
        }
    },
    checkLogin: async (params: any) => {
        set({loading: {visible: true, message: 'Authenticating'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            const response = await axiosConfig.post(
                '?action=mobile-login-check',
                params,
            ).catch(error => {
                console.error('❌ checkLogin Axios Error:', error.response?.data || error.message);
                throw error;
            });
            const {result, message, user, sites, branch} = response.data;

            if (!result) {
                set({
                    message: {
                        visible: true,
                        message: message || 'Error Login',
                        type: '',
                    },
                    error: {visible: true, message, type: 'error-login'},
                    loading: {visible: false, message: ''},
                });
                return;
            }

            // User info
            const {role, id, name, employer_name} = user;

            // Save main user data
            await AsyncStorage.multiSet([
                ['userid', id.toString()],
                ['userType', role.toString()],
                ['name', name.toString()],
                ['employer_name', employer_name?.toString() || ''],
            ]);

            // ✅ Save all assigned sites as JSON array (timekeeper)
            if (sites && Array.isArray(sites) && sites.length > 0) {
                await AsyncStorage.setItem('sites', JSON.stringify(sites));

                // Optionally auto-select first site
                const defaultSite = sites[0];
                await AsyncStorage.multiSet([
                    ['site_id', defaultSite.id.toString()],
                    ['employer_id', defaultSite.employer_id.toString()],
                    ['site_code', defaultSite.site_code || ''],
                    ['site_name', defaultSite.site_name || ''],
                    ['site_address', defaultSite.site_address || ''],
                    ['cluster', defaultSite.cluster || ''],
                ]);
            }

            // ✅ Save branch (cashier / secretary)
            if (branch) {
                await AsyncStorage.multiSet([
                    ['branch_id', branch.id?.toString() || ''],
                    ['branch_code', branch.branch_code || ''],
                    ['branch_name', branch.branch_name || ''],
                ]);
            }

            // Update app state
            set({role});
            set({success: {visible: true, type: 'login-success'}});
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            set({loading: {visible: false, message: ''}});
            set({
                error: {
                    visible: true,
                    message: error?.message || 'Error Login',
                    type: 'error-login',
                },
            });
            console.error('❌ checkLogin Error:', error);
        }
    },

    pullOnline: async () => {
        // set({loading: {visible: true, message: 'Feching data online'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            const response = await axiosConfig.get('?action=mobile-sync-local').catch(error => {
                console.error('❌ pullOnline Axios Error:', error.response?.data || error.message);
                throw error;
            });
            const {departments, employees, positions} = response.data;
            // await insertDepartmentsData(departments);
            await insertPositionsData(positions);
            await insertEmployeeData(employees);
            set({
                message: {
                    visible: true,
                    message: 'Succcessfully Sync',
                    type: '',
                },
            });
            const syncCounts = {
                employees: Array.isArray(employees) ? employees.length : 0,
                positions: Array.isArray(positions) ? positions.length : 0,
            };
            // persist before flagging success so the UI reads fresh counts
            await AsyncStorage.setItem('lastSync', new Date().toISOString());
            await AsyncStorage.setItem(
                'lastSyncCounts',
                JSON.stringify(syncCounts),
            );
            set({success: {visible: true, type: 'success-pull'}});
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ pullOnline Error:', error);
            set({loading: {visible: false, message: ''}});
        }
    },
    saveMyEmployee: async (params: any) => {
        set({loading: {visible: true, message: 'Adding'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));

        try {
            const site_id = (await AsyncStorage.getItem('site_id')) || '1';

            const employeeData = Array.isArray(params) ? params : [params];

            const updatedParams = employeeData.map(emp => ({
                ...emp,
                site_id: parseInt(site_id, 10),
            }));

            await insertMyEmployeeData(updatedParams);

            const updatedEmployees = await fetchMyEmployeeData();
            set({myEmployees: updatedEmployees});

            set({
                message: {
                    visible: true,
                    message: 'Employee successfully added',
                    type: '',
                },
            });
            set({success: {visible: true, type: 'save-myemployee'}});
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ saveMyEmployee Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error adding employee',
                    type: 'error',
                },
            });
        }
    },

    // ✅ Save DTR Function
    saveDTR: async (params: any) => {
        set({loading: {visible: true, message: 'Saving'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));

        try {
            await insertDTRData(params);

            set({success: {visible: true, type: 'save-dtr'}});
            set({
                message: {
                    visible: true,
                    message: 'New DTR successfully saved',
                    type: '',
                },
            });
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error saving DTR',
                    type: 'error',
                },
            });
        }
    },

    pushDTR: async (params: any) => {
        set({loading: {visible: true, message: 'Pushing'}});
        params.timekeeper_id = await AsyncStorage.getItem('userid');
        // branch_id comes from the modal selection; fall back to stored branch
        if (!params.branch_id) {
            params.branch_id =
                Number(await AsyncStorage.getItem('branch_id')) || 1;
        }
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));

        if (!params?.dtr || !params?.dtr_details || !Array.isArray(params.dtr_details)) {
            throw new Error('Invalid DTR payload: missing dtr or dtr_details');
        }

        const normalizedDtrDetails = params.dtr_details.map((detail: any) => {
            const logs = Array.isArray(detail.logs)
                ? detail.logs
                : detail.logs
                ? detail.logs
                : [];

            const dateTime = detail.date_time || detail.date || (Array.isArray(logs) && logs[0]?.dateTime) || '';
            const code = detail.code ?? detail.employee_no ?? detail.employee_id ?? '';

            return {
                ...detail,
                code,
                type: detail.type ?? 'bio',
                ot: detail.ot ?? 0,
                notes: detail.notes ?? '',
                logs,
                date_time: dateTime,
                hours: detail.hours ?? '0.00',
            };
        });

        params.dtr_details = normalizedDtrDetails;

        try {
            const response = await axiosConfig.post(
                '?action=mobile-push-dtr',
                params,
            ).catch(error => {
                console.error('❌ pushDTR Axios Error:', error.response?.data || error.message);
                throw error;
            });
            const {result, message} = response.data;
            if (result) {
                set({
                    message: {
                        visible: true,
                        message: 'DTR successfully push',
                        type: '',
                    },
                });
                set({success: {visible: true, type: 'push-dtr'}});
                set({loading: {visible: false, message: ''}});
            } else {
                set({success: {visible: true, type: 'error-push-dtr'}});
                set({
                    message: {
                        visible: true,
                        message: message || 'Error Pushing',
                        type: 'error',
                    },
                });
                set({loading: {visible: false, message: ''}});
            }
        } catch (error: any) {
            console.error('❌ pushDTR Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error pushing DTR',
                    type: 'error',
                },
            });
        }
    },
    deleteMyEmployee: async (params: any) => {
        set({loading: {visible: true, message: 'Deleting'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            await deleteMyEmployeeData(params);
            set({
                message: {
                    visible: true,
                    message: 'Employee successfully deleted',
                    type: '',
                },
            });
            set({success: {visible: true, type: 'delete-employee'}});
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ deleteMyEmployee Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error deleting employee',
                    type: 'error',
                },
            });
        }
    },
    deleteDTR: async (params: any) => {
        set({loading: {visible: true, message: 'Deleting'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            await deleteMyDTRData(params);
            set({
                message: {
                    visible: true,
                    message: 'DTR successfully deleted',
                    type: '',
                },
            });
            set({success: {visible: true, type: 'delete-dtr'}});
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ deleteDTR Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error deleting DTR',
                    type: 'error',
                },
            });
        }
    },
    updateLogsDTR: async (params: any) => {
        set({loading: {visible: true, message: 'Saving...'}});
        try {
            await updateMyDTRData(params);
            set({
                message: {
                    visible: true,
                    message: 'DTR successfully saved',
                    type: '',
                },
            });
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ updateLogsDTR Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error updating DTR',
                    type: 'error',
                },
            });
        }
    },
    updateLogsDTRArray: async (params: any) => {
        try {
            await updateMyDTRDataArray(params);
        } catch (error: any) {
            console.error('❌ updateLogsDTRArray Error:', error);
        }
    },

    updateLogsDTRHours: async (params: any) => {
        set({loading: {visible: true, message: 'Updating'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            await updateMyDTRDataHours(params);
            set({
                message: {
                    visible: true,
                    message: 'HOURS successfully saved',
                    type: '',
                },
            });
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ updateLogsDTRHours Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error updating hours',
                    type: 'error',
                },
            });
        }
    },
    updateLogsDTRDetailsAction: async (params: any) => {
        set({loading: {visible: true, message: 'Saving'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            await updateMyDTRDetails(params);
            set({success: {visible: true, type: 'add-logs'}});
            await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
            set({
                message: {
                    visible: true,
                    message: 'Logs successfully saved',
                    type: '',
                },
            });
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ updateLogsDTRDetailsAction Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error updating DTR details',
                    type: 'error',
                },
            });
        }
    },
    isertMyDTRDetailsAction: async (params: any) => {
        set({loading: {visible: true, message: 'Saving'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            await isertMyDTRDetails(params);
            set({success: {visible: true, type: 'add-logs'}});
            await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
            set({
                message: {
                    visible: true,
                    message: 'Logs successfully saved',
                    type: '',
                },
            });
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ isertMyDTRDetailsAction Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error inserting DTR details',
                    type: 'error',
                },
            });
        }
    },
    deleteMyDTRDetailsDataAction: async (params: any) => {
        set({loading: {visible: true, message: 'Saving'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            await deleteMyDTRDetailsData(params);
            set({success: {visible: true, type: 'add-logs'}});
            await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
            set({
                message: {
                    visible: true,
                    message: 'Logs successfully saved',
                    type: '',
                },
            });
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ deleteMyDTRDetailsDataAction Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error deleting DTR details',
                    type: 'error',
                },
            });
        }
    },
    insertMyDTRDetailsAction: async (params: any) => {
        set({loading: {visible: true, message: 'Saving'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            await insertMyDTRDetails(params);
            set({success: {visible: true, type: 'add-visitor'}});
            await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
            set({
                message: {
                    visible: true,
                    message: 'Visitors Logs successfully saved',
                    type: '',
                },
            });
            set({loading: {visible: false, message: ''}});
        } catch (error: any) {
            console.error('❌ insertMyDTRDetailsAction Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: error?.message || 'Error inserting visitor logs',
                    type: 'error',
                },
            });
        }
    },
    saveLogs: async (params: any) => {
        params.site_id = await AsyncStorage.getItem('site_id');
        set({loading: {visible: true, message: 'Pushing'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            const response = await axiosConfig.post(
                '?action=mobile-save-logs',
                params,
            ).catch(error => {
                console.error('❌ saveLogs Axios Error:', error.response?.data || error.message);
                throw error;
            });
            const {result, error, message} = response.data;
            if (!result) {
                set({
                    message: {
                        visible: true,
                        message: message || 'Error Login',
                        type: '',
                    },
                });
                set({
                    error: {
                        visible: true,
                        message: message,
                        type: 'error-login',
                    },
                });
                set({loading: {visible: false, message: ''}});
                return;
            }
            try {
                await deleteVisitorLogsData({id: params.id});
            } catch (deleteError: any) {
                console.error('❌ saveLogs deleteVisitorLogsData Error:', deleteError);
            }
            await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
            set({success: {visible: true, type: 'push-logs'}});
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: 'Visitor logs have been successfully pushed.',
                    type: '',
                },
            });
        } catch (error: any) {
            console.error('❌ saveLogs Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                error: {
                    visible: true,
                    message: error?.message || 'Error saving logs',
                    type: 'error-logs',
                },
            });
        }
    },
    deleteLogs: async (params: any) => {
        set({loading: {visible: true, message: 'Deleting'}});
        await new Promise(resolve => setTimeout(resolve, LOADING_TIME));
        try {
            await deleteVisitorLogsData({id: params.id});
            set({success: {visible: true, type: 'delete-logs'}});
            set({loading: {visible: false, message: ''}});
            set({
                message: {
                    visible: true,
                    message: 'Visitor logs have been successfully deleted.',
                    type: '',
                },
            });
        } catch (error: any) {
            console.error('❌ deleteLogs Error:', error);
            set({loading: {visible: false, message: ''}});
            set({
                error: {
                    visible: true,
                    message: error?.message || 'Error deleting logs',
                    type: 'error-logs',
                },
            });
        }
    },
}));

export default useGlobalStore;
