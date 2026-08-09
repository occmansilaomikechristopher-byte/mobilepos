import React, {useState} from 'react';
import {Platform} from 'react-native';
import {
    NavigationContainer,
    RouteProp,
    DefaultTheme,
    DarkTheme,
    createNavigationContainerRef,
} from '@react-navigation/native';
import {
    createStackNavigator,
    StackNavigationProp,
} from '@react-navigation/stack';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import MainScreen from './screens/MainScreen';
import {SnackBarComponent, Loading} from './components/';
import ProfilePage from './screens/ProfilePage';
import AppSlider from './screens/AppSlider';
import EmployeeListScreen from './screens/EmployeeListScreen';
import LogsDetails from './screens/LogsDetails';
import AttendaceDetails from './screens/AttendaceDetails';
import PermissionPage from './screens/PermissionPage';
import CameraPage from './screens/CameraPage';
import VistiorsLogs from './screens/VistiorsLogs';
import PortalScreen from './screens/PortalScreen';
import POSDashboard from './screens/POSDashboard';
import OwnerDashboard from './screens/OwnerDashboard';
import ReportDetailScreen from './screens/ReportDetailScreen';
import {CloseBlocker} from './components';
import FlashMessage from 'react-native-flash-message';
import Toast from 'react-native-toast-message';

import {
    Provider as PaperProvider,
    MD3DarkTheme as PaperDarkTheme,
    DefaultTheme as PaperDefaultTheme,
    ToggleButton,
    useTheme,
} from 'react-native-paper';

// Define stack navigator and screen types
type RootStackParamList = {
    MainScreen: undefined;
    Register: undefined;
    Login: undefined;
    Home: undefined;
    Dashboard: undefined;
    ProfilePage: undefined;
    ChatPage: undefined;
    OrderDetailsPage: undefined;
    AppSlider: undefined;
    EmployeeListScreen: undefined;
    LogsDetails: undefined;
    AttendaceDetails: undefined;
    CameraPage: undefined;
    VistiorsLogs: undefined;
    PermissionPage: undefined;
    PortalScreen: undefined;
    POSDashboard: undefined;
    OwnerDashboard: undefined;
    ReportDetailScreen: {title: string; reportId: string};
};

export type LoginScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Login'
>;
export type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

export type RegisterScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Register'
>;
export type RegisterScreenRouteProp = RouteProp<RootStackParamList, 'Register'>;

export type HomeScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Home'
>;
export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export type DetailsScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Details'
>;
export type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Dashboard'>;

export type DashboardScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Dashboard'
>;
export type DashboardScreenRouteProp = RouteProp<
    RootStackParamList,
    'Dashboard'
>;

export type ProfileScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'ProfilePage'
>;
export type ProfileScreenRouteProp = RouteProp<
    RootStackParamList,
    'ProfilePage'
>;

const customDefaultTheme = {
    ...PaperDefaultTheme,
    colors: {
        ...PaperDefaultTheme.colors,
        primary: '#219688',
    },
};

const customDefaultDarkTheme = {
    ...PaperDarkTheme,
    colors: {
        ...PaperDarkTheme.colors,
        primary: '#219688',
    },
};

const Stack = createStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const checkPermissionsAndRedirect = async () => {
    try {
        const isAndroid13 = Platform.OS === 'android' && Platform.Version >= 33;
        const audio = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (audio !== RESULTS.GRANTED) {
            navigationRef.navigate('PermissionPage');
            return;
        }

        if (isAndroid13) {
            const imgs = await check(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
            const video = await check(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO);
            const aud = await check(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
            if (
                imgs !== RESULTS.GRANTED ||
                video !== RESULTS.GRANTED ||
                aud !== RESULTS.GRANTED
            ) {
                navigationRef.navigate('PermissionPage');
            }
        } else {
            const read = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
            const write = await check(
                PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
            );
            if (read !== RESULTS.GRANTED || write !== RESULTS.GRANTED) {
                navigationRef.navigate('PermissionPage');
            }
        }
    } catch (e) {
        console.error('Permission check failed:', e);
    }
};

const AppNavigator: React.FC = () => {
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const theme = isDarkTheme ? customDefaultDarkTheme : customDefaultTheme;

    const toggleTheme = () => {
        setIsDarkTheme(prevTheme => !prevTheme);
    };

    return (
        <PaperProvider theme={theme}>
            <Toast />
            <SnackBarComponent />
            <Loading />
            <FlashMessage position="top" />
            <NavigationContainer
                ref={navigationRef}
                onReady={checkPermissionsAndRedirect}
                theme={isDarkTheme ? DarkTheme : DefaultTheme}>
                <Stack.Navigator
                    initialRouteName="MainScreen"
                    screenOptions={
                        {
                            // headerMode: 'screen',
                            // cardStyle: {backgroundColor: theme.colors.background},
                        }
                    }>
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="MainScreen"
                        component={MainScreen}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="Login"
                        component={LoginScreen}
                    />
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="Dashboard"
                        component={DashboardScreen}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="ProfilePage"
                        component={ProfilePage}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="AppSlider"
                        component={AppSlider}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="EmployeeListScreen"
                        component={EmployeeListScreen}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="LogsDetails"
                        component={LogsDetails}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="AttendaceDetails"
                        component={AttendaceDetails}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="CameraPage"
                        component={CameraPage}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="VistiorsLogs"
                        component={VistiorsLogs}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="PermissionPage"
                        component={PermissionPage}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="PortalScreen"
                        component={PortalScreen}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="POSDashboard"
                        component={POSDashboard}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="OwnerDashboard"
                        component={OwnerDashboard}
                    />
                    <Stack.Screen
                        options={{headerShown: false}}
                        name="ReportDetailScreen"
                        component={ReportDetailScreen}
                    />

                    {/* <Stack.Screen name="Details" component={DetailsScreen} /> */}
                </Stack.Navigator>
                {/* <ToggleButton icon={isDarkTheme ? 'weather-night' : 'weather-sunny'} onPress={toggleTheme}>
          Toggle Theme
        </ToggleButton> */}
                <CloseBlocker />
            </NavigationContainer>
        </PaperProvider>
    );
};

export default AppNavigator;
