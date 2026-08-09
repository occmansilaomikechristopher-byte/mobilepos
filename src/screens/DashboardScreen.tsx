// @ts-nocheck
import React, {useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    Alert,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
    TabsProvider,
    useTabIndex,
    useTabNavigation,
} from 'react-native-paper-tabs';
import HomeTabContent from './HomeTabContent';
import NewOrderTab from './NewOrderTab';
import NotificationTab from './MyEmployeeTab';
import OrderTab from './DRTTab';
import SettingsTab from './SettingsTab';
import {TextComponent} from '../components/';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGlobalStore from '../store/globalState';
import {fetchMyEmployeeData} from '../utils/databaseService';
import {playSound} from '../utils/helper';
import successSound from '../assets/audio/success.mp3';
import {requestCameraPermission} from '../utils/permissionsHelper';
import {HomeScreenNavigationProp} from '../AppNavigator';
import {PRIMARY_COLOR} from '../utils/constant';

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) {
        return 'Good morning';
    }
    if (h < 18) {
        return 'Good afternoon';
    }
    return 'Good evening';
};

// go to DTR tab after a save
const SwitchOnSave = () => {
    const goTo = useTabNavigation();
    const {success} = useGlobalStore();
    useEffect(() => {
        if (success && success.visible && success.type === 'save-dtr') {
            goTo(1);
        }
    }, [success]);
    return null;
};

const TabContent = ({navigation}) => {
    const index = useTabIndex();
    const screens = [
        <HomeTabContent key="home" navigation={navigation} />,
        <OrderTab key="dtr" navigation={navigation} />,
        <NewOrderTab key="create" navigation={navigation} />,
        <NotificationTab key="team" />,
        <SettingsTab key="settings" navigation={navigation} />,
    ];
    return <View style={{flex: 1}}>{screens[index]}</View>;
};

const TABS = [
    {icon: 'home', label: 'Home'},
    {icon: 'event-note', label: 'DTR'},
    {icon: 'add-circle-outline', label: 'Create'},
    {icon: 'people', label: 'Team'},
    {icon: 'settings', label: 'Settings'},
];

const BottomTabBar = () => {
    const activeIndex = useTabIndex();
    const goTo = useTabNavigation();
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}>
            <View style={styles.tabBar}>
                {TABS.map((tab, idx) => {
                    const active = activeIndex === idx;
                    return (
                        <TouchableOpacity
                            key={idx}
                            style={styles.tabItem}
                            onPress={() => goTo(idx)}>
                            <MaterialIcons
                                name={tab.icon}
                                size={22}
                                color={active ? PRIMARY_COLOR : '#999999'}
                            />
                            <TextComponent
                                style={[
                                    styles.tabText,
                                    active && styles.tabTextActive,
                                ]}>
                                {tab.label}
                            </TextComponent>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
};

interface Props {
    navigation: HomeScreenNavigationProp;
}

const DashboardScreen = ({navigation}: Props) => {
    const [name, setName] = useState('');
    const [siteName, setSiteName] = useState('');
    const {setLoading, setMyEmployees, success, setSuccess} = useGlobalStore();

    useEffect(() => {
        if (success && success.visible && success.type === 'save-myemployee') {
            playSound(successSound);
            fetchItems();
        }
        if (success && success.visible && success.type === 'delete-employee') {
            fetchItems();
            setTimeout(() => {
                playSound(successSound);
                setSuccess({visible: false, type: ''});
            }, 500);
        }
        if (success && success.visible && success.type === 'success-pull') {
            playSound(successSound);
            fetchItems();
        }
    }, [success]);

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        requestCameraPermission().then(ok => {
            if (!ok) {
                Alert.alert(
                    'Permission Required',
                    'Camera access is needed to use this feature.',
                );
            }
        });
    }, []);

    const fetchItems = async () => {
        try {
            const data = await fetchMyEmployeeData();
            setMyEmployees(data);
        } catch (e) {
            console.error('Error fetching employee:', e);
        }
        setLoading({visible: true, message: 'Loading'});
        setName(String((await AsyncStorage.getItem('name')) || ''));
        setTimeout(() => setLoading({visible: false, message: ''}), 2000);
    };

    useEffect(() => {
        AsyncStorage.getItem('site_name').then(s =>
            setSiteName(s || 'Unknown Site'),
        ).catch(error => {
            console.error('❌ DashboardScreen site_name Error:', error);
        });
    }, []);

    return (
        <View style={styles.root}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={PRIMARY_COLOR}
            />

            {/* header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('ProfilePage')}>
                    <TextComponent style={styles.greeting}>
                        {getGreeting()},
                    </TextComponent>
                    <TextComponent style={styles.name}>
                        {name || 'User'}
                    </TextComponent>
                    {/* <TextComponent style={styles.site}>Branch: {siteName}</TextComponent> */}
                </TouchableOpacity>
            </View>

            {/* content + tabs */}
            <View style={{flex: 1}}>
                <TabsProvider defaultIndex={0}>
                    <SwitchOnSave />
                    <TabContent navigation={navigation} />
                    <BottomTabBar />
                </TabsProvider>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#f2f2f2'},
    header: {
        backgroundColor: PRIMARY_COLOR,
        paddingTop: 30,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    greeting: {color: '#ffffff', fontSize: 13},
    name: {color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginTop: 2},
    site: {color: '#ffffff', fontSize: 12, marginTop: 4},
    tabBarContent: {
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#cccccc',
        borderRadius: 16,
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    tabItem: {
        minWidth: 70,
        paddingVertical: 8,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 10,
        color: '#999999',
        marginTop: 2,
        textAlign: 'center',
    },
    tabTextActive: {color: PRIMARY_COLOR, fontWeight: 'bold'},
});

export default DashboardScreen;
