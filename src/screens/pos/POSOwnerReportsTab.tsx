import React, {useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../../components';
import axiosConfig from '../../utils/axiosConfig';

interface ReportSummary {
    totalSales: number;
    totalEmployees: number;
    totalProducts: number;
    pendingAttendance: number;
}

const POSOwnerReportsTab = ({navigation}) => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<ReportSummary>({
        totalSales: 0,
        totalEmployees: 0,
        totalProducts: 0,
        pendingAttendance: 0,
    });

    useEffect(() => {
        loadReportSummary();
    }, []);

    const loadReportSummary = async () => {
        try {
            setLoading(true);
            const [salesRes, inventoryRes, attendanceRes, payrollRes] =
                await Promise.allSettled([
                    axiosConfig.get('?action=owner-report-sales'),
                    axiosConfig.get('?action=owner-report-inventory'),
                    axiosConfig.get('?action=owner-report-attendance'),
                    axiosConfig.get('?action=owner-report-payroll'),
                ]);

            const salesTotal =
                salesRes.status === 'fulfilled'
                    ? Number(salesRes.value?.data?.total || 0)
                    : 0;
            const inventoryCount =
                inventoryRes.status === 'fulfilled'
                    ? Number(inventoryRes.value?.data?.count || 0)
                    : 0;
            const attendanceRate =
                attendanceRes.status === 'fulfilled'
                    ? Number(attendanceRes.value?.data?.rate || 0)
                    : 0;
            const employeeCount =
                payrollRes.status === 'fulfilled'
                    ? Number(payrollRes.value?.data?.count || 0)
                    : 0;

            setSummary({
                totalSales: salesTotal,
                totalEmployees: employeeCount,
                totalProducts: inventoryCount,
                pendingAttendance: attendanceRate,
            });
        } catch (error) {
            console.error('Error loading report summary:', error);
            setSummary({
                totalSales: 0,
                totalEmployees: 0,
                totalProducts: 0,
                pendingAttendance: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const reportCards = [
        {
            id: 'sales',
            title: 'Sales Report',
            icon: 'chart-line',
            value: `₱${summary.totalSales.toLocaleString()}`,
            description: 'Total Sales',
            color: '#10b981',
        },
        {
            id: 'inventory',
            title: 'Inventory Report',
            icon: 'cube-outline',
            value: summary.totalProducts,
            description: 'Total Products',
            color: '#3b82f6',
        },
        {
            id: 'attendance',
            title: 'Attendance Report',
            icon: 'calendar-check-outline',
            value: `${summary.pendingAttendance}%`,
            description: 'Attendance Rate',
            color: '#f59e0b',
        },
        {
            id: 'payroll',
            title: 'Payroll Report',
            icon: 'calculator',
            value: summary.totalEmployees,
            description: 'Active Employees',
            color: '#8b5cf6',
        },
    ];

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#14b8a6" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TextComponent style={styles.headerTitle}>
                    Reports Dashboard
                </TextComponent>
                <TextComponent style={styles.headerSubtitle}>
                    View key metrics across all branches
                </TextComponent>
            </View>

            {reportCards.map(item => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.reportCard}
                    onPress={() => {
                        // Navigate to detailed report
                        console.log(`Opening ${item.id} report`);
                    }}>
                    <View
                        style={[
                            styles.cardIcon,
                            {backgroundColor: item.color + '20'},
                        ]}>
                        <MaterialCommunityIcons
                            name={item.icon}
                            size={24}
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
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color="#9ca3af"
                    />
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    header: {
        marginBottom: 20,
        marginTop: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748b',
    },
    reportCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    cardValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f766e',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 12,
        color: '#94a3b8',
    },
});

export default POSOwnerReportsTab;
