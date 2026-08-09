// @ts-nocheck
import React, {useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../components';
import axiosConfig from '../utils/axiosConfig';

interface ReportCard {
    id: string;
    title: string;
    icon: string;
    value: string | number;
    description: string;
    color: string;
    route?: string;
}

const OwnerDashboard = ({navigation}) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<ReportCard[]>([]);

    useEffect(() => {
        loadOwnerData();
    }, []);

    const loadOwnerData = async () => {
        try {
            setLoading(true);
            const userName = await AsyncStorage.getItem('name');
            setName(userName || 'Owner');

            // Fetch aggregate data from all branches via API
            let salesTotal = 0;
            let inventoryCount = 0;
            let attendanceRate = 0;
            let employeeCount = 0;
            let payableCount = 0;
            let totalPayable = 0;

            try {
                // Fetch sales data
                const salesRes = await axiosConfig.get(
                    '?action=owner-report-sales',
                );
                const salesData = salesRes.data;
                if (salesData.success) {
                    salesTotal = salesData.total || 0;
                }
            } catch (e) {
                console.error('Error fetching sales:', e);
            }

            try {
                // Fetch inventory data
                const inventoryRes = await axiosConfig.get(
                    '?action=owner-report-inventory',
                );
                const inventoryData = inventoryRes.data;
                if (inventoryData.success) {
                    inventoryCount = inventoryData.count || 0;
                }
            } catch (e) {
                console.error('Error fetching inventory:', e);
            }

            try {
                // Fetch attendance data
                const attendanceRes = await axiosConfig.get(
                    '?action=owner-report-attendance',
                );
                const attendanceData = attendanceRes.data;
                if (attendanceData.success) {
                    attendanceRate = attendanceData.rate || 0;
                }
            } catch (e) {
                console.error('Error fetching attendance:', e);
            }

            try {
                // Fetch payroll data
                const payrollRes = await axiosConfig.get(
                    '?action=owner-report-payroll',
                );
                const payrollData = payrollRes.data;
                if (payrollData.success) {
                    employeeCount = payrollData.count || 0;
                }
            } catch (e) {
                console.error('Error fetching payroll:', e);
            }

            try {
                // Fetch payable data
                const payableRes = await axiosConfig.get(
                    '?action=owner-report-payable',
                );
                const payableData = payableRes.data;
                if (payableData.success) {
                    payableCount = payableData.count || 0;
                    totalPayable = payableData.total || 0;
                }
            } catch (e) {
                console.error('Error fetching payable:', e);
            }

            // Update report cards with real data
            setReports([
                {
                    id: 'sales',
                    title: 'Sales Report',
                    icon: 'chart-line',
                    value: `₱${salesTotal.toLocaleString('en-PH', {
                        maximumFractionDigits: 0,
                    })}`,
                    description: 'Total Sales All Branches',
                    color: '#10b981',
                },
                {
                    id: 'inventory',
                    title: 'Inventory Report',
                    icon: 'cube-outline',
                    value: inventoryCount.toString(),
                    description: 'Total Products',
                    color: '#3b82f6',
                },
                {
                    id: 'attendance',
                    title: 'Attendance Report',
                    icon: 'calendar-check-outline',
                    value: `${attendanceRate}%`,
                    description: 'Attendance Rate',
                    color: '#f59e0b',
                },
                {
                    id: 'payable',
                    title: 'Payable Report',
                    icon: 'cash',
                    value: `₱${totalPayable.toLocaleString('en-PH', {
                        maximumFractionDigits: 2,
                    })}`,
                    description: `${payableCount} credit orders`,
                    color: '#f97316',
                },
                {
                    id: 'payroll',
                    title: 'Payroll Report',
                    icon: 'calculator',
                    value: employeeCount.toString(),
                    description: 'Active Employees',
                    color: '#8b5cf6',
                },
            ]);
        } catch (error) {
            console.error('Error loading owner data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.multiRemove([
            'userType',
            'userid',
            'name',
            'branch_name',
        ]);
        navigation.reset({index: 0, routes: [{name: 'MainScreen'}]});
    };

    const handleRefresh = () => {
        loadOwnerData();
    };

    const initials =
        (name || 'O')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase() || 'O';

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#14b8a6" />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#0f766e" />

            {/* Header */}
            <LinearGradient
                colors={['#0f766e', '#14b8a6']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.header}>
                <View style={styles.headerDecor} />
                <View style={styles.headerTopRow}>
                    <View style={{flex: 1}}>
                        <TextComponent style={styles.headerLabel}>
                            Reports Portal
                        </TextComponent>
                        <TextComponent style={styles.headerName}>
                            {name || 'Owner'}
                        </TextComponent>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleRefresh}>
                            <MaterialCommunityIcons
                                name="refresh"
                                size={18}
                                color="#fff"
                            />
                        </TouchableOpacity>
                        <View style={styles.avatarBadge}>
                            <TextComponent style={styles.avatarText}>
                                {initials}
                            </TextComponent>
                        </View>
                    </View>
                </View>
                <View style={styles.headerBottomRow}>
                    <View style={styles.statusPill}>
                        <MaterialCommunityIcons
                            name="check-decagram"
                            size={14}
                            color="#ecfeff"
                        />
                        <TextComponent style={styles.statusText}>
                            All Branches
                        </TextComponent>
                    </View>
                </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}>
                <View style={styles.sectionHeader}>
                    <TextComponent style={styles.sectionTitle}>
                        Available Reports
                    </TextComponent>
                    <TextComponent style={styles.sectionSubtitle}>
                        Access key metrics across all branches
                    </TextComponent>
                </View>

                {reports.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.reportCard}
                        onPress={() => {
                            console.log(`Opening ${item.id} report`);
                            navigation.navigate('ReportDetailScreen', {
                                title: item.title,
                                reportId: item.id,
                            });
                        }}>
                        <View
                            style={[
                                styles.cardIcon,
                                {backgroundColor: item.color + '20'},
                            ]}>
                            <MaterialCommunityIcons
                                name={item.icon}
                                size={28}
                                color={item.color}
                            />
                        </View>
                        <View style={styles.cardContent}>
                            <TextComponent style={styles.cardTitle}>
                                {item.title}
                            </TextComponent>
                            <TextComponent style={styles.cardValue}>
                                {item.value}
                            </TextComponent>
                            <TextComponent style={styles.cardDescription}>
                                {item.description}
                            </TextComponent>
                        </View>
                        <View style={styles.cardArrow}>
                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={20}
                                color="#9ca3af"
                            />
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}>
                        <MaterialCommunityIcons
                            name="logout"
                            size={18}
                            color="#dc2626"
                        />
                        <TextComponent style={styles.logoutText}>
                            Logout
                        </TextComponent>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 48 : 28,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    headerDecor: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLabel: {
        fontSize: 12,
        color: '#ecfeff',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    headerName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    refreshButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    headerBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusText: {
        color: '#ecfeff',
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 24,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748b',
    },
    reportCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f766e',
        marginBottom: 2,
    },
    cardDescription: {
        fontSize: 12,
        color: '#94a3b8',
    },
    cardArrow: {
        marginLeft: 8,
    },
    footer: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        paddingVertical: 12,
        gap: 8,
    },
    logoutText: {
        color: '#dc2626',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default OwnerDashboard;
