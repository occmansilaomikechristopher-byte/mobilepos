// @ts-nocheck
import React, {useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Platform,
    Modal,
    FlatList,
} from 'react-native';
import {
    TabsProvider,
    useTabIndex,
    useTabNavigation,
} from 'react-native-paper-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../components';
import {playSound} from '../utils/helper';
import notifSound from '../assets/audio/success.mp3';
import {HomeScreenNavigationProp} from '../AppNavigator';
import POSSaleTab from './pos/POSSaleTab';
import POSProductsTab from './pos/POSProductsTab';
import POSInventoryTab from './pos/POSInventoryTab';
import POSSalesTab from './pos/POSSalesTab';
import POSQuotationTab from './pos/POSQuotationTab';
import POSDamageTab from './pos/POSDamageTab';
import POSOwnerRequisitionTab from './pos/POSOwnerRequisitionTab';
import NewOrderTab from './NewOrderTab';
import {getTabConfig} from './pos/tabConfig';
import useNotificationList from '../hooks/useNotificationList';
import axiosConfig from '../utils/axiosConfig';
import {useQueryClient} from 'react-query';
import {showMessage} from 'react-native-flash-message';

const SettingsTab = ({navigation}) => {
    const [isSecretary, setIsSecretary] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('userType').then(t =>
            setIsSecretary(Number(t) === 9),
        ).catch(error => {
            console.error('❌ SettingsTab userType Error:', error);
        });
    }, []);

    const logout = async () => {
        await AsyncStorage.multiRemove(['userType', 'userid', 'name']);
        navigation.reset({index: 0, routes: [{name: 'MainScreen'}]});
    };

    return (
        <ScrollView contentContainerStyle={styles.settingsContent}>
            <View style={styles.settingsCard}>
                <TextComponent style={styles.settingsTitle}>
                    Operations
                </TextComponent>
                <TextComponent style={styles.settingsText}>
                    Keep your branch tools and workflows aligned with a polished
                    desktop-like experience.
                </TextComponent>
                {isSecretary && (
                    <TouchableOpacity
                        style={styles.switchBtn}
                        onPress={() =>
                            navigation.reset({
                                index: 0,
                                routes: [{name: 'ProfilePage'}],
                            })
                        }>
                        <LinearGradient
                            colors={['#0f766e', '#14b8a6']}
                            style={styles.gradientButton}>
                            <TextComponent style={styles.switchText}>
                                Switch to Payroll
                            </TextComponent>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <TextComponent style={styles.logoutText}>
                        Logout
                    </TextComponent>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export const getScreenConfig = (
    navigation,
    isCashier,
    isSecretary = false,
    refreshKey = 0,
    onStockChanged,
) => {
    const screens = [
        <POSSaleTab key="sale" />,
        <POSProductsTab key="products" refreshKey={refreshKey} />,
        <POSInventoryTab key="inventory" refreshKey={refreshKey} />,
        <POSSalesTab key="sales" />,
    ];

    if (isCashier) {
        screens.push(<POSQuotationTab key="quotations" />);
        screens.push(
            <NewOrderTab key="biometric-logs" navigation={navigation} />,
        );
        screens.push(
            <POSDamageTab key="damage" onStockChanged={onStockChanged} />,
        );
        screens.push(<POSOwnerRequisitionTab key="owner-requisition" />);
    } else if (isSecretary) {
        screens.push(<POSQuotationTab key="quotations" />);
        screens.push(
            <POSDamageTab key="damage" onStockChanged={onStockChanged} />,
        );
        screens.push(<POSOwnerRequisitionTab key="owner-requisition" />);
    }

    screens.push(<SettingsTab key="settings" navigation={navigation} />);
    return screens;
};

const TabContent = ({
    navigation,
    isCashier,
    isSecretary,
    refreshKey,
    onStockChanged,
}) => {
    const index = useTabIndex();
    const screens = getScreenConfig(
        navigation,
        isCashier,
        isSecretary,
        refreshKey,
        onStockChanged,
    );
    const safeIndex = Math.min(Math.max(index, 0), screens.length - 1);
    return <View style={styles.tabContent}>{screens[safeIndex]}</View>;
};

const BottomTabBar = ({isCashier, isSecretary}) => {
    const activeIndex = useTabIndex();
    const goTo = useTabNavigation();
    const tabs = getTabConfig(isCashier, isSecretary);
    return (
        <View style={styles.tabBarWrap}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabBarContent}>
                <View style={styles.tabBar}>
                    {tabs.map((tab, idx) => {
                        const active = activeIndex === idx;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={styles.tabItem}
                                onPress={() => goTo(idx)}>
                                {active ? (
                                    <LinearGradient
                                        colors={['#0f766e', '#14b8a6']}
                                        style={styles.activeTabIcon}>
                                        <MaterialCommunityIcons
                                            name={tab.icon}
                                            size={18}
                                            color="#fff"
                                        />
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.inactiveTabIcon}>
                                        <MaterialCommunityIcons
                                            name={tab.icon}
                                            size={18}
                                            color="#64748b"
                                        />
                                    </View>
                                )}
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
        </View>
    );
};

interface Props {
    navigation: HomeScreenNavigationProp;
}

const POSDashboard = ({navigation}: Props) => {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [branch, setBranch] = useState('');
    const [isCashier, setIsCashier] = useState(false);
    const [isSecretary, setIsSecretary] = useState(false);
    const [stockRefreshKey, setStockRefreshKey] = useState(0);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [lastNotificationId, setLastNotificationId] = useState<number | null>(null);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [newNotificationCount, setNewNotificationCount] = useState(0);
    const {data: notifications = [], isLoading: notificationsLoading} = useNotificationList();

    const deleteNotification = async (notificationId: number) => {
        try {
            const {status, data} = await axiosConfig.post(
                '?action=mobile-notification-delete',
                {notification_id: notificationId},
            );
            if (status === 200 && data?.result) {
                queryClient.invalidateQueries(['notifications']);
                queryClient.invalidateQueries(['notification-list']);
                setNewNotificationCount(prev => Math.max(0, prev - 1));
                showMessage({
                    message: 'Notification deleted',
                    type: 'success',
                    duration: 3000,
                });
            }
        } catch (error: any) {
            console.error('❌ deleteNotification Error:', error);
        }
    };

    useEffect(() => {
        if (!notifications || notifications.length === 0) {
            if (!initialLoadDone) {
                setInitialLoadDone(true);
            }
            return;
        }

        const latest = notifications[0];
        if (!initialLoadDone) {
            setLastNotificationId(latest.id);
            setInitialLoadDone(true);
            return;
        }

        if (latest.id !== lastNotificationId) {
            showMessage({
                message: latest.title || 'New product notification',
                description: latest.message || 'A new product was added in main branch.',
                type: 'info',
                duration: 4500,
            });
            // play sound for cashier users only
            if (isCashier) {
                try {
                    playSound(notifSound);
                } catch (e) {
                    console.error('❌ Notification sound play error:', e);
                }
            }
            setLastNotificationId(latest.id);
            setNewNotificationCount(1);
        }
    }, [notifications, initialLoadDone, lastNotificationId]);

    useEffect(() => {
        AsyncStorage.multiGet(['name', 'branch_name']).then(pairs => {
            const map = Object.fromEntries(pairs);
            setName(map.name || '');
            setBranch(map.branch_name || 'No branch');
        }).catch(error => {
            console.error('❌ POSDashboard multiGet Error:', error);
        });
        AsyncStorage.getItem('userType').then(t => {
            const userType = Number(t);
            setIsCashier(userType === 8);
            setIsSecretary(userType === 9);
        }).catch(error => {
            console.error('❌ POSDashboard userType Error:', error);
        });
    }, []);

    const initials =
        (name || 'U')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase() || 'U';

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#0f766e" />
            <LinearGradient
                colors={['#0f766e', '#14b8a6']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.header}>
                <View style={styles.headerDecor} />
                <View style={styles.headerTopRow}>
                    <View style={{flex: 1}}>
                        <TextComponent style={styles.headerLabel}>
                            Welcome back,
                        </TextComponent>
                        <TextComponent style={styles.headerName}>
                            {name || 'Sales Team'}
                        </TextComponent>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.notifButton}
                            onPress={() => {
                                if (notifications.length > 0) {
                                    setLastNotificationId(notifications[0].id);
                                }
                                setNewNotificationCount(0);
                                setNotificationOpen(true);
                            }}>
                            <MaterialCommunityIcons
                                name="bell-outline"
                                size={18}
                                color="#fff"
                            />
                            {newNotificationCount > 0 && (
                                <View style={styles.notifBadge}>
                                    <TextComponent style={styles.notifBadgeText}>
                                        {newNotificationCount}
                                    </TextComponent>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.avatarBadge}>
                            <TextComponent style={styles.avatarText}>
                                {initials}
                            </TextComponent>
                        </View>
                    </View>
                </View>
                <View style={styles.headerBottomRow}>
                    <View style={styles.branchBadge}>
                        <MaterialCommunityIcons
                            name="office-building-outline"
                            size={14}
                            color="#ecfeff"
                        />
                        <TextComponent style={styles.branchText}>
                            {branch || 'Main Branch'}
                        </TextComponent>
                    </View>
                    <View style={styles.statusPill}>
                        <MaterialCommunityIcons
                            name="check-decagram"
                            size={14}
                            color="#ecfeff"
                        />
                        <TextComponent style={styles.statusText}>
                            Online
                        </TextComponent>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.contentShell}>
                <TabsProvider defaultIndex={0}>
                    <TabContent
                        navigation={navigation}
                        isCashier={isCashier}
                        isSecretary={isSecretary}
                        refreshKey={stockRefreshKey}
                        onStockChanged={() =>
                            setStockRefreshKey(previous => previous + 1)
                        }
                    />
                    <BottomTabBar
                        isCashier={isCashier}
                        isSecretary={isSecretary}
                    />
                </TabsProvider>
            </View>

            <Modal visible={notificationOpen} animationType="slide" transparent>
                <View style={styles.notificationModalBackdrop}>
                    <View style={styles.notificationModalBox}>
                        <View style={styles.notificationModalHeader}>
                            <TextComponent style={styles.notificationModalTitle}>
                                Notifications
                            </TextComponent>
                            <TouchableOpacity
                                onPress={() => {
                                    queryClient.removeQueries(['notifications']);
                                    queryClient.removeQueries(['notification-list']);
                                    setNotificationOpen(false);
                                }}>
                                <MaterialCommunityIcons
                                    name="close"
                                    size={22}
                                    color="#0f172a"
                                />
                            </TouchableOpacity>
                        </View>
                        {notificationsLoading ? (
                            <View style={styles.notificationEmpty}>
                                <TextComponent style={styles.notificationEmptyText}>
                                    Loading notifications...
                                </TextComponent>
                            </View>
                        ) : notifications.length === 0 ? (
                            <View style={styles.notificationEmpty}>
                                <TextComponent style={styles.notificationEmptyText}>
                                    No notifications yet.
                                </TextComponent>
                            </View>
                        ) : (
                            <FlatList
                                data={notifications}
                                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                                renderItem={({item}) => (
                                    <View style={styles.notificationItem}>
                                        <TextComponent style={styles.notificationItemTitle}>
                                            {item.title || 'Notification'}
                                        </TextComponent>
                                        <TextComponent style={styles.notificationItemMessage}>
                                            {item.message || item.body || item.description || 'You have a new notification.'}
                                        </TextComponent>
                                        {item.created_at && (
                                            <TextComponent style={styles.notificationItemTime}>
                                                {new Date(item.created_at).toLocaleString()}
                                            </TextComponent>
                                        )}
                                        <TouchableOpacity
                                            style={styles.notificationDeleteButton}
                                            onPress={() => deleteNotification(item.id)}>
                                            <MaterialCommunityIcons
                                                name="trash-can-outline"
                                                size={20}
                                                color="#ef4444"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                contentContainerStyle={styles.notificationList}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#f8fafc'},
    header: {
        paddingTop: Platform.OS === 'ios' ? 48 : 28,
        paddingBottom: 22,
        paddingHorizontal: 20,
        overflow: 'hidden',
    },
    headerDecor: {
        position: 'absolute',
        right: -25,
        top: -10,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1,
    },
    headerLabel: {
        color: '#ccfbf1',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.8,
    },
    headerName: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '800',
        marginTop: 4,
    },
    headerActions: {flexDirection: 'row', alignItems: 'center', gap: 10},
    notifButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
    },
    avatarBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {color: '#ffffff', fontWeight: '700'},
    notifBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    notifBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    notificationModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'flex-end',
    },
    notificationModalBox: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 18,
        maxHeight: '75%',
    },
    notificationModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    notificationModalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    notificationList: {
        paddingBottom: 16,
    },
    notificationItem: {
        marginBottom: 12,
        padding: 14,
        borderRadius: 18,
        backgroundColor: '#f8fafc',
    },
    notificationItemTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    notificationItemMessage: {
        fontSize: 13,
        color: '#475569',
        marginTop: 6,
        lineHeight: 18,
    },
    notificationItemTime: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 8,
    },
    notificationDeleteButton: {
        marginTop: 10,
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 0,
    },
    notificationEmpty: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    notificationEmptyText: {
        color: '#64748b',
        fontSize: 14,
    },
    headerBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        zIndex: 1,
    },
    branchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(15,23,42,0.18)',
        gap: 6,
    },
    branchText: {color: '#ecfeff', fontSize: 12, fontWeight: '600'},
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
        gap: 6,
    },
    statusText: {color: '#ecfeff', fontSize: 12, fontWeight: '600'},
    contentShell: {flex: 1, marginBottom: 10},
    tabContent: {flex: 1},
    tabBarWrap: {
        paddingHorizontal: 12,
        paddingBottom: 14,
        paddingTop: 5,
    },
    tabBarContent: {
        paddingVertical: 4,
        paddingHorizontal: 2,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 24,
        paddingHorizontal: 4,
        paddingVertical: 6,
        shadowColor: '#0f172a',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: {width: 0, height: 10},
        elevation: 4,
    },
    tabItem: {
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    activeTabIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inactiveTabIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
    },
    tabText: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
        textAlign: 'center',
    },
    tabTextActive: {color: '#0f766e', fontWeight: '700'},
    settingsContent: {flexGrow: 1, padding: 18},
    settingsCard: {
        borderRadius: 24,
        backgroundColor: '#ffffff',
        padding: 20,
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: {width: 0, height: 10},
        elevation: 2,
    },
    settingsTitle: {fontSize: 18, fontWeight: '800', color: '#0f172a'},
    settingsText: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 8,
        lineHeight: 20,
    },
    switchBtn: {marginTop: 18},
    gradientButton: {
        borderRadius: 16,
        paddingVertical: 13,
        alignItems: 'center',
    },
    switchText: {color: '#ffffff', fontWeight: '700', fontSize: 14},
    logoutBtn: {
        marginTop: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingVertical: 13,
        alignItems: 'center',
    },
    logoutText: {color: '#dc2626', fontWeight: '700', fontSize: 14},
});

export default POSDashboard;
