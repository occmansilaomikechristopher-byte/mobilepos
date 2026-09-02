import React, {useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../components';
import axiosConfig from '../utils/axiosConfig';

const ReportDetailScreen = ({navigation, route}) => {
    const {title = 'Report', reportId = ''} = route.params || {};
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (reportId === 'sales') {
            loadReportBranches('sales');
        } else if (reportId === 'inventory') {
            loadReportBranches('inventory');
        } else if (reportId === 'attendance') {
            loadReportBranches('attendance');
        } else if (reportId === 'payroll') {
            loadReportBranches('payroll');
        } else if (reportId === 'payable') {
            loadReportBranches('payable');
        } else if (reportId === 'quotations') {
            loadReportBranches('quotations');
        }
    }, [reportId]);

    const loadReportBranches = async reportType => {
        setLoading(true);
        setError('');
        setBranches([]);

        let action = '';
        let isAggregateOnly = false;
        if (reportType === 'sales') {
            action = 'owner-report-sales-branches';
        } else if (reportType === 'inventory') {
            action = 'owner-report-inventory-branches';
        } else if (reportType === 'attendance') {
            action = 'owner-report-attendance-branches';
        } else if (reportType === 'payable') {
            action = 'owner-report-payable-branches';
        } else if (reportType === 'payroll') {
            action = 'owner-report-payroll';
            isAggregateOnly = true;
        } else if (reportType === 'quotations') {
            action = 'owner-report-quotations';
            isAggregateOnly = true;
        }

        if (!action) {
            setError('Unsupported report type.');
            setLoading(false);
            return;
        }

        try {
            const response = await axiosConfig.get(`?action=${action}`);
            const data = response.data;
            if (data?.success) {
                if (isAggregateOnly) {
                    const aggregateItem = {
                        id: 'all',
                        branch_name: 'All Branches',
                        count: data.count || 0,
                        total_value: data.total_value ?? data.total ?? 0,
                        employee_count: data.count || 0,
                    };
                    setBranches([aggregateItem]);
                } else {
                    setBranches(data.branches || []);
                }
            } else {
                setError(data?.message || 'Unable to load branch data.');
            }
        } catch (err) {
            setError('Unable to load branch data.');
            console.error('ReportDetailScreen loadReportBranches error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getReportSubtitle = () => {
        if (reportId === 'sales') {
            return 'Sales totals broken down by branch.';
        }
        if (reportId === 'inventory') {
            return 'Product count broken down by branch.';
        }
        if (reportId === 'attendance') {
            return 'Attendance rate per branch.';
        }
        if (reportId === 'payable') {
            return 'Outstanding payable amount per branch.';
        }
        if (reportId === 'payroll') {
            return 'Active employee count for all branches.';
        }
        if (reportId === 'quotations') {
            return 'Quotation count and total value across all branches.';
        }
        return 'Detailed owner report details will appear here for the selected report.';
    };

    const getBranchMetric = item => {
        if (reportId === 'sales') {
            return `₱${Number(item.total_sales || 0).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        }
        if (reportId === 'inventory') {
            return `${Number(item.total_products || 0).toLocaleString('en-PH')}`;
        }
        if (reportId === 'attendance') {
            return `${Number(item.attendance_rate || 0).toFixed(1)}%`;
        }
        if (reportId === 'payable') {
            return `₱${Number(item.total_payable || 0).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        }
        if (reportId === 'payroll') {
            return `${Number(item.employee_count || 0).toLocaleString('en-PH')}`;
        }
        if (reportId === 'quotations') {
            return `₱${Number(item.total_value || 0).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        }
        return '-';
    };

    const getBranchMetricLabel = () => {
        if (reportId === 'sales') return 'Total Sales';
        if (reportId === 'inventory') return 'Products';
        if (reportId === 'attendance') return 'Attendance';
        if (reportId === 'payable') return 'Payables';
        if (reportId === 'payroll') return 'Employees';
        if (reportId === 'quotations') return 'Total Value';
        return 'Value';
    };

    const renderBranchItem = ({item}) => (
        <View style={styles.branchRow}>
            <View style={styles.branchInfo}>
                <TextComponent style={styles.branchName}>
                    {item.branch_name}
                </TextComponent>
                <TextComponent style={styles.branchLabel}>{getBranchMetricLabel()}</TextComponent>
            </View>
            <TextComponent style={styles.branchSales}>
                {getBranchMetric(item)}
            </TextComponent>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#0f766e" />
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    <MaterialCommunityIcons
                        name="arrow-left"
                        size={20}
                        color="#fff"
                    />
                </TouchableOpacity>
                <TextComponent style={styles.headerTitle}>
                    {title}
                </TextComponent>
            </View>

            <View style={styles.content}>
                <TextComponent style={styles.sectionTitle}>
                    {title}
                </TextComponent>
                {['sales', 'inventory', 'attendance', 'payable', 'payroll', 'quotations'].includes(reportId) ? (
                    <>
                        <TextComponent style={styles.sectionSubtitle}>
                            {getReportSubtitle()}
                        </TextComponent>
                        {loading ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color="#0f766e" />
                            </View>
                        ) : error ? (
                            <View style={styles.bodyCard}>
                                <TextComponent style={styles.bodyText}>
                                    {error}
                                </TextComponent>
                            </View>
                        ) : (
                            <FlatList
                                data={branches}
                                keyExtractor={item => item.id.toString()}
                                renderItem={renderBranchItem}
                                ListEmptyComponent={
                                    <View style={styles.bodyCard}>
                                        <TextComponent style={styles.bodyText}>
                                            No branch data available.
                                        </TextComponent>
                                    </View>
                                }
                                contentContainerStyle={
                                    branches.length === 0 && styles.emptyList
                                }
                            />
                        )}
                    </>
                ) : (
                    <>
                        <TextComponent style={styles.sectionSubtitle}>
                            Detailed owner report details will appear here for the
                            selected report.
                        </TextComponent>
                        <View style={styles.bodyCard}>
                            <TextComponent style={styles.bodyText}>
                                Report ID: {reportId}
                            </TextComponent>
                            <TextComponent style={styles.bodyText}>
                                This screen is now reachable from the owner report
                                dashboard.
                            </TextComponent>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: '#0f766e',
        paddingTop: 48,
        paddingBottom: 18,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
    },
    bodyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    bodyText: {
        fontSize: 14,
        color: '#334155',
        marginBottom: 10,
    },
    loaderContainer: {
        marginTop: 24,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    branchRow: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    branchInfo: {
        flex: 1,
        marginRight: 12,
    },
    branchName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    branchLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    branchSales: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f766e',
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 20,
    },
});

export default ReportDetailScreen;
