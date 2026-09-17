// @ts-nocheck
import React, {useCallback, useState} from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import {useFocusEffect} from '@react-navigation/native';
import {TextComponent} from '../../components';
import {fetchPosSales, getCollectedSaleIds} from '../../utils/posService';
import {PRIMARY_COLOR} from '../../utils/constant';

const money = value =>
    '₱ ' +
    Number(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const POSCollectionsTab = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const load = useCallback(async () => {
        try {
            const branchId = Number(await AsyncStorage.getItem('branch_id')) || 0;
            const [allSales, collectedIds] = await Promise.all([
                fetchPosSales(branchId),
                getCollectedSaleIds(branchId),
            ]);
            const collected = new Set(collectedIds.map(Number));
            setSales(allSales.filter(sale => collected.has(Number(sale.id))));
        } catch {
            setSales([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const totalCollected = sales.reduce(
        (sum, sale) => sum + Number(sale.payment || 0),
        0,
    );

    const renderItem = ({item}) => {
        const total = Number(item.total || 0);
        const collected = Number(item.payment || 0);
        const approved = String(item.collection_status || '').trim().toLowerCase() === 'approved';

        return (
            <View style={styles.row}>
                <View style={styles.rowIcon}>
                    <MaterialCommunityIcons
                        name={approved ? 'check-circle-outline' : 'clock-outline'}
                        size={20}
                        color={approved ? '#0f766e' : '#d97706'}
                    />
                </View>
                <View style={styles.rowMain}>
                    <View style={styles.rowTop}>
                        <View style={styles.invoiceBlock}>
                            <TextComponent style={styles.invoice} numberOfLines={1}>
                                {item.invoice_no}
                            </TextComponent>
                            <TextComponent style={styles.date}>
                                {dayjs(item.created_at).format('MMM D, YYYY')}
                            </TextComponent>
                            <TextComponent style={styles.time}>
                                {dayjs(item.created_at).format('h:mm A')}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.amountRow}>
                        <TextComponent style={styles.amountLabel}>Sale</TextComponent>
                        <TextComponent style={styles.amount}>{money(total)}</TextComponent>
                    </View>
                    <View style={styles.amountRow}>
                        <TextComponent style={styles.amountLabel}>Collected</TextComponent>
                        <TextComponent style={styles.collected}>{money(collected)}</TextComponent>
                    </View>
                </View>
                <View style={[styles.status, approved ? styles.paid : styles.pending]}>
                    <TextComponent style={styles.statusText}>
                        {approved ? 'Approved' : 'Pending'}
                    </TextComponent>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={PRIMARY_COLOR} size="large" />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <MaterialCommunityIcons name="cash-multiple" size={24} color="#fff" />
                </View>
                <View style={{flex: 1}}>
                    <TextComponent style={styles.title}>Collections</TextComponent>
                    <TextComponent style={styles.subtitle}>Cashier sales payments</TextComponent>
                </View>
            </View>

            <View style={styles.summary}>
                <View style={styles.summaryItem}>
                    <TextComponent style={styles.summaryLabel}>Sales</TextComponent>
                    <TextComponent style={styles.summaryValue}>{money(totalSales)}</TextComponent>
                </View>
                <View style={styles.summaryItem}>
                    <TextComponent style={styles.summaryLabel}>Collected</TextComponent>
                    <TextComponent style={styles.summaryValue}>{money(totalCollected)}</TextComponent>
                </View>
            </View>

            <FlatList
                data={sales}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            load();
                        }}
                    />
                }
                ListEmptyComponent={
                    <TextComponent style={styles.empty}>No collections found.</TextComponent>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {flex: 1, backgroundColor: '#f5f7fa'},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f766e',
        padding: 16,
        gap: 12,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#14b8a6',
    },
    title: {fontSize: 18, fontWeight: '800', color: '#fff'},
    subtitle: {fontSize: 12, color: '#d0f1e8', marginTop: 3},
    summary: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 12,
        borderRadius: 10,
        padding: 14,
        gap: 8,
        elevation: 2,
    },
    summaryItem: {flex: 1},
    summaryLabel: {fontSize: 11, color: '#64748b', marginBottom: 5},
    summaryValue: {fontSize: 13, fontWeight: '800', color: '#0f766e'},
    listContent: {paddingHorizontal: 12, paddingBottom: 30},
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 9,
        elevation: 1,
    },
    rowIcon: {width: 32, paddingTop: 2},
    rowMain: {flex: 1},
    rowTop: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
    invoiceBlock: {flex: 1, paddingRight: 6},
    invoice: {fontSize: 13, fontWeight: '800', color: '#0f172a'},
    date: {fontSize: 11, color: '#475569', marginTop: 3},
    time: {fontSize: 10, color: '#94a3b8', marginTop: 1},
    amountRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 3},
    amountLabel: {fontSize: 11, color: '#64748b'},
    amount: {fontSize: 11, fontWeight: '700', color: '#334155'},
    collected: {fontSize: 11, fontWeight: '700', color: '#0f766e'},
    status: {borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8},
    paid: {backgroundColor: '#dcfce7'},
    pending: {backgroundColor: '#fef3c7'},
    statusText: {fontSize: 10, fontWeight: '800', color: '#166534'},
    empty: {textAlign: 'center', color: '#94a3b8', paddingVertical: 40},
});

export default POSCollectionsTab;