// @ts-nocheck
import React, {useCallback, useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    Modal,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../../components';
import {fetchPosSales, fetchPosSaleDetails} from '../../utils/posService';
import {PRIMARY_COLOR} from '../../utils/constant';

const money = n =>
    '₱ ' +
    Number(n || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const POSSalesTab = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [from, setFrom] = useState(null);
    const [to, setTo] = useState(null);
    const [picker, setPicker] = useState(null);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detail, setDetail] = useState(null);

    const load = useCallback(
        async (f = from, t = to) => {
            try {
                const bId =
                    Number(await AsyncStorage.getItem('branch_id')) || 0;
                const fromStr = f ? dayjs(f).format('YYYY-MM-DD') : '';
                const toStr = t ? dayjs(t).format('YYYY-MM-DD') : '';
                const data = await fetchPosSales(bId, fromStr, toStr);
                setSales(data);
            } catch {
                // ignore
            }
            setLoading(false);
            setRefreshing(false);
        },
        [from, to],
    );

    useEffect(() => {
        load();
    }, [load]);

    const onPickDate = (event, selected) => {
        const which = picker;
        setPicker(null);
        if (event.type === 'dismissed' || !selected) {
            return;
        }
        if (which === 'from') {
            setFrom(selected);
            load(selected, to);
        } else {
            setTo(selected);
            load(from, selected);
        }
    };

    const clearDates = () => {
        setFrom(null);
        setTo(null);
        setLoading(true);
        load(null, null);
    };

    const openDetail = async sale => {
        setDetailOpen(true);
        setDetailLoading(true);
        const data = await fetchPosSaleDetails(sale.id);
        setDetail(data);
        setDetailLoading(false);
    };

    let total = 0;
    sales.forEach(s => (total += Number(s.total || 0)));

    const renderItem = ({item}) => (
        <TouchableOpacity
            style={styles.row}
            onPress={() => openDetail(item)}
            activeOpacity={0.9}>
            <View style={styles.rowIcon}>
                <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={18}
                    color="#0f766e"
                />
            </View>
            <View style={{flex: 1}}>
                <TextComponent style={styles.invoice}>
                    {item.invoice_no}
                </TextComponent>
                <TextComponent style={styles.date}>
                    {dayjs(item.created_at).format('MMM D, YYYY h:mm A')}
                </TextComponent>
            </View>
            <TextComponent style={styles.total}>
                {money(item.total)}
            </TextComponent>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={PRIMARY_COLOR} size="large" />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <View style={styles.filter}>
                <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setPicker('from')}>
                    <TextComponent style={styles.dateBtnText}>
                        {from ? dayjs(from).format('MMM D') : 'From'}
                    </TextComponent>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setPicker('to')}>
                    <TextComponent style={styles.dateBtnText}>
                        {to ? dayjs(to).format('MMM D') : 'To'}
                    </TextComponent>
                </TouchableOpacity>
                {(from || to) && (
                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={clearDates}>
                        <TextComponent style={styles.clearText}>
                            Clear
                        </TextComponent>
                    </TouchableOpacity>
                )}
            </View>

            {sales.length > 0 && (
                <View style={styles.summary}>
                    <View>
                        <TextComponent style={styles.summaryLabel}>
                            {sales.length} sales
                        </TextComponent>
                        <TextComponent style={styles.summarySub}>
                            Today’s branch performance
                        </TextComponent>
                    </View>
                    <TextComponent style={styles.summaryTotal}>
                        {money(total)}
                    </TextComponent>
                </View>
            )}

            <FlatList
                data={sales}
                keyExtractor={i => i.id.toString()}
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
                    <TextComponent style={styles.empty}>
                        No sales found.
                    </TextComponent>
                }
            />

            {picker && (
                <DateTimePicker
                    value={(picker === 'from' ? from : to) || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onPickDate}
                />
            )}

            <Modal visible={detailOpen} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalTop}>
                            <TextComponent style={styles.modalTitle}>
                                {detail && detail.sale
                                    ? detail.sale.invoice_no
                                    : 'Sale'}
                            </TextComponent>
                            <TouchableOpacity
                                onPress={() => setDetailOpen(false)}>
                                <TextComponent style={styles.close}>
                                    ✕
                                </TextComponent>
                            </TouchableOpacity>
                        </View>

                        {detailLoading ? (
                            <ActivityIndicator
                                color={PRIMARY_COLOR}
                                style={{margin: 20}}
                            />
                        ) : !detail ? (
                            <TextComponent style={styles.empty}>
                                Failed to load.
                            </TextComponent>
                        ) : (
                            <View>
                                <FlatList
                                    data={detail.items}
                                    keyExtractor={(it, i) => i.toString()}
                                    style={{maxHeight: 250}}
                                    renderItem={({item}) => (
                                        <View style={styles.itemRow}>
                                            <View style={{flex: 1}}>
                                                <TextComponent
                                                    style={styles.itemName}>
                                                    {item.product_name}
                                                </TextComponent>
                                                <TextComponent
                                                    style={styles.itemSub}>
                                                    {money(item.price)} ×{' '}
                                                    {Number(item.qty)}
                                                </TextComponent>
                                            </View>
                                            <TextComponent
                                                style={styles.itemTotal}>
                                                {money(item.line_total)}
                                            </TextComponent>
                                        </View>
                                    )}
                                />

                                <View style={styles.line} />
                                <View style={styles.totalRow}>
                                    <TextComponent style={styles.totalLabel}>
                                        Subtotal
                                    </TextComponent>
                                    <TextComponent style={styles.totalValue}>
                                        {money(detail.sale.subtotal)}
                                    </TextComponent>
                                </View>
                                <View style={styles.totalRow}>
                                    <TextComponent style={styles.totalLabel}>
                                        Discount
                                    </TextComponent>
                                    <TextComponent style={styles.totalValue}>
                                        - {money(detail.sale.discount)}
                                    </TextComponent>
                                </View>
                                <View style={styles.totalRow}>
                                    <TextComponent style={styles.bold}>
                                        Total
                                    </TextComponent>
                                    <TextComponent style={styles.bold}>
                                        {money(detail.sale.total)}
                                    </TextComponent>
                                </View>
                                <View style={styles.totalRow}>
                                    <TextComponent style={styles.totalLabel}>
                                        Cash Paid
                                    </TextComponent>
                                    <TextComponent style={styles.totalValue}>
                                        {money(detail.sale.payment)}
                                    </TextComponent>
                                </View>
                                <View style={styles.totalRow}>
                                    <TextComponent style={styles.totalLabel}>
                                        Change
                                    </TextComponent>
                                    <TextComponent style={styles.totalValue}>
                                        {money(detail.sale.change_due)}
                                    </TextComponent>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {flex: 1, backgroundColor: '#f8fafc'},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    empty: {textAlign: 'center', color: '#64748b', marginTop: 30},
    filter: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 6,
        gap: 8,
    },
    dateBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    dateBtnText: {color: '#0f172a', fontWeight: '600'},
    clearBtn: {
        backgroundColor: '#0f766e',
        borderRadius: 16,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    clearText: {color: '#ffffff', fontWeight: '700'},
    summary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 4,
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 6},
        elevation: 2,
    },
    summaryLabel: {fontSize: 15, fontWeight: '700', color: '#0f172a'},
    summarySub: {fontSize: 12, color: '#64748b', marginTop: 2},
    summaryTotal: {fontWeight: '800', color: '#0f766e', fontSize: 16},
    listContent: {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20},
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 6},
        elevation: 2,
    },
    rowIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#ecfeff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    invoice: {fontSize: 14, fontWeight: '700', color: '#0f172a'},
    date: {fontSize: 12, color: '#64748b', marginTop: 2},
    total: {fontSize: 14, fontWeight: '800', color: '#0f766e'},
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.45)',
        justifyContent: 'flex-end',
    },
    modalBox: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 18,
        maxHeight: '82%',
    },
    modalTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modalTitle: {fontSize: 18, fontWeight: '800', color: '#0f172a'},
    close: {fontSize: 18, fontWeight: '700', color: '#64748b'},
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    itemName: {fontSize: 13, fontWeight: '700', color: '#0f172a'},
    itemSub: {fontSize: 12, color: '#64748b', marginTop: 1},
    itemTotal: {fontSize: 13, fontWeight: '700', color: '#0f766e'},
    line: {height: 1, backgroundColor: '#e2e8f0', marginVertical: 10},
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    totalLabel: {color: '#64748b'},
    totalValue: {color: '#0f172a', fontWeight: '600'},
    bold: {fontWeight: '800', fontSize: 15, color: '#0f172a'},
});

export default POSSalesTab;
