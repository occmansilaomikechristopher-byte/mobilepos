// @ts-nocheck
import React, {useEffect, useMemo, useState} from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    Modal,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../../components';
import {
    fetchPosProducts,
    savePosOwnerRequisition,
    deletePosOwnerRequisition,
    updatePosOwnerRequisitionStatus,
} from '../../utils/posService';
import axiosConfig from '../../utils/axiosConfig';

const STORAGE_KEY = 'pos_owner_requisitions';

const emptyForm = {
    item_name: '',
    manual_item_name: '',
    quantity: '1',
    unit_price: '',
    branch_name: '',
    description: '',
};

const formatDateTime = value => {
    try {
        return new Date(value).toLocaleString();
    } catch {
        return '';
    }
};

const formatPeso = value => `₱${Number(value || 0).toLocaleString('en-PH')}`;

const hasPrice = value =>
    value !== '' && value !== null && typeof value !== 'undefined';

const POSOwnerRequisitionTab = () => {
    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const loadItems = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            setItems(stored ? JSON.parse(stored) : []);
        } catch (error) {
            console.error('Failed to load owner requisitions:', error);
            setItems([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadProducts = async () => {
        try {
            const branchId =
                Number(await AsyncStorage.getItem('branch_id')) || 0;
            const data = await fetchPosProducts(branchId);
            setProducts(data);
            // If modal open and a product selected, pre-fill unit price
            if (form.item_name && form.item_name !== '__other__') {
                const sel = data.find(p => p.product_name === form.item_name);
                if (sel) setForm(prev => ({...prev, unit_price: sel.unit_price || ''}));
            }
        } catch (error) {
            console.error(
                'Failed to load products for owner requisition tab:',
                error,
            );
            setProducts([]);
        }
    };

    const loadBranches = async () => {
        try {
            setLoadingBranches(true);
            const response = await axiosConfig.get(
                '?action=mobile-get-branches',
            );
            const list = response?.data?.data || response?.data || [];
            setBranches(list);
        } catch (error) {
            console.error(
                'Failed to load branches for owner requisition tab:',
                error,
            );
            setBranches([]);
        } finally {
            setLoadingBranches(false);
        }
    };

    useEffect(() => {
        loadItems();
        loadProducts();
        loadBranches();
    }, []);

    const persistItems = async nextItems => {
        setItems(nextItems);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    };

    const openComposer = () => {
        setForm({...emptyForm});
        setModalVisible(true);
    };

    const saveItem = async () => {
        const itemName = (
            form.item_name === '__other__'
                ? form.manual_item_name
                : form.item_name
        ).trim();
        const quantity = Number(form.quantity);
        const unitPrice = Number(form.unit_price || 0);
        const totalPrice = Number((quantity * unitPrice) || 0);
        const branchName = form.branch_name.trim();
        const description = form.description.trim();
        const branchId = branches.find(branch => branch.branch_name === form.branch_name)?.id || 0;

        if (!itemName) {
            Alert.alert(
                'Missing item',
                'Please select a product or enter the requisition item name.',
            );
            return;
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            Alert.alert('Invalid quantity', 'Quantity must be at least 1.');
            return;
        }

        const newItem = {
            id: Date.now().toString(),
            server_id: null,
            requisition_code: `REQ-${Date.now()}`,
            item_name: itemName,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            branch_id: branchId,
            branch_name: branchName || 'All branches',
            description: description || 'No remarks provided',
            status: 'Pending',
            created_at: new Date().toISOString(),
        };

        const nextItems = [newItem, ...items];
        await persistItems(nextItems);

        try {
            const result = await savePosOwnerRequisition({
                item_name: itemName,
                quantity,
                branch_id: branchId,
                description: description || 'No remarks provided',
            });

            if (result?.result) {
                newItem.server_id = result.requisition_id ?? null;
                await persistItems([newItem, ...items]);
                Alert.alert('Saved', result.message || 'Requisition saved successfully.');
            } else {
                Alert.alert(
                    'Saved locally',
                    `Requisition logged locally but failed to sync: ${result?.message || 'Unknown error'}`,
                );
            }
        } catch (error) {
            console.error('Failed to push requisition to server:', error);
            Alert.alert(
                'Saved locally',
                'Requisition logged locally but failed to sync to the server.',
            );
        }

        setModalVisible(false);
    };

    const deleteItem = async id => {
        const itemToDelete = items.find(item => item.id === id);
        if (itemToDelete?.server_id) {
            const response = await deletePosOwnerRequisition({
                requisition_id: itemToDelete.server_id,
            });
            if (!response?.result) {
                Alert.alert(
                    'Delete failed',
                    response?.message || 'Unable to delete requisition from the server.',
                );
                return;
            }
        }

        const nextItems = items.filter(item => item.id !== id);
        await persistItems(nextItems);
    };

    const updateStatus = async (id, status) => {
        const item = items.find(item => item.id === id);
        if (!item) return;

        if (item.server_id) {
            const response = await updatePosOwnerRequisitionStatus({
                requisition_id: item.server_id,
                status,
            });
            if (!response?.result) {
                Alert.alert(
                    'Update failed',
                    response?.message || 'Unable to update requisition status on the server.',
                );
                return;
            }
        }

        const nextItems = items.map(existing =>
            existing.id === id ? {...existing, status} : existing,
        );
        await persistItems(nextItems);
    };

    const statusCounts = useMemo(
        () => ({
            total: items.length,
            pending: items.filter(item => item.status === 'Pending').length,
            approved: items.filter(item => item.status === 'Approved').length,
            rejected: items.filter(item => item.status === 'Rejected').length,
        }),
        [items],
    );

    return (
        <View style={styles.screen}>
            <View style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                    <MaterialCommunityIcons
                        name="clipboard-text-outline"
                        size={22}
                        color="#0f766e"
                    />
                </View>
                <View style={{flex: 1}}>
                    <TextComponent style={styles.summaryLabel}>
                        Owner requisitions
                    </TextComponent>
                    <TextComponent style={styles.summaryText}>
                        Track requested items and their current status.
                    </TextComponent>
                </View>
                <View style={styles.summaryCountWrap}>
                    <TextComponent style={styles.summaryCount}>
                        {statusCounts.total}
                    </TextComponent>
                    <TextComponent style={styles.summaryCountLabel}>
                        records
                    </TextComponent>
                </View>
            </View>

            <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                    <TextComponent style={styles.metricValue}>
                        {statusCounts.pending}
                    </TextComponent>
                    <TextComponent style={styles.metricLabel}>
                        Pending
                    </TextComponent>
                </View>
                <View style={styles.metricCard}>
                    <TextComponent
                        style={[styles.metricValue, {color: '#16a34a'}]}>
                        {statusCounts.approved}
                    </TextComponent>
                    <TextComponent style={styles.metricLabel}>
                        Approved
                    </TextComponent>
                </View>
                <View style={styles.metricCard}>
                    <TextComponent
                        style={[styles.metricValue, {color: '#dc2626'}]}>
                        {statusCounts.rejected}
                    </TextComponent>
                    <TextComponent style={styles.metricLabel}>
                        Rejected
                    </TextComponent>
                </View>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={openComposer}>
                <MaterialCommunityIcons name="plus" size={18} color="#ffffff" />
                <TextComponent style={styles.addBtnText}>
                    Add requisition
                </TextComponent>
            </TouchableOpacity>

            <FlatList
                data={items}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={() => {
                    setRefreshing(true);
                    loadItems();
                }}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <MaterialCommunityIcons
                            name="clipboard-off-outline"
                            size={28}
                            color="#94a3b8"
                        />
                        <TextComponent style={styles.emptyText}>
                            No owner requisitions recorded yet.
                        </TextComponent>
                    </View>
                }
                renderItem={({item}) => (
                    <View style={styles.itemCard}>
                        <View style={styles.itemTopRow}>
                            <View style={styles.itemBadge}>
                                <MaterialCommunityIcons
                                    name="file-document-edit-outline"
                                    size={16}
                                    color="#0f766e"
                                />
                            </View>
                            <View style={{flex: 1}}>
                                <TextComponent style={styles.itemName}>
                                    {item.item_name}
                                </TextComponent>
                                <TextComponent style={styles.itemMeta}>
                                    {item.requisition_code} • Qty:{' '}
                                    {item.quantity}
                                </TextComponent>
                                {hasPrice(item.unit_price) && (
                                    <TextComponent style={styles.itemMeta}>
                                        Unit: {formatPeso(item.unit_price)} • Total:{' '}
                                        {formatPeso(
                                            item.total_price ||
                                                item.unit_price * item.quantity,
                                        )}
                                    </TextComponent>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => deleteItem(item.id)}>
                                <MaterialCommunityIcons
                                    name="trash-can-outline"
                                    size={18}
                                    color="#dc2626"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.metaWrap}>
                            <View style={styles.branchChip}>
                                <MaterialCommunityIcons
                                    name="office-building-outline"
                                    size={12}
                                    color="#0f766e"
                                />
                                <TextComponent style={styles.branchChipText}>
                                    {item.branch_name}
                                </TextComponent>
                            </View>
                            <View
                                style={[
                                    styles.statusChip,
                                    item.status === 'Approved' &&
                                        styles.statusChipApproved,
                                    item.status === 'Rejected' &&
                                        styles.statusChipRejected,
                                ]}>
                                <TextComponent style={styles.statusChipText}>
                                    {item.status}
                                </TextComponent>
                            </View>
                        </View>

                        <TextComponent style={styles.reasonLabel}>
                            Remarks
                        </TextComponent>
                        <TextComponent style={styles.reasonText}>
                            {item.description}
                        </TextComponent>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() =>
                                    updateStatus(item.id, 'Pending')
                                }>
                                <TextComponent style={styles.actionBtnText}>
                                    Pending
                                </TextComponent>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.approveBtn]}
                                onPress={() =>
                                    updateStatus(item.id, 'Approved')
                                }>
                                <TextComponent style={styles.actionBtnText}>
                                    Approve
                                </TextComponent>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() =>
                                    updateStatus(item.id, 'Rejected')
                                }>
                                <TextComponent style={styles.actionBtnText}>
                                    Reject
                                </TextComponent>
                            </TouchableOpacity>
                        </View>

                        <TextComponent style={styles.dateText}>
                            {formatDateTime(item.created_at)}
                        </TextComponent>
                    </View>
                )}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <TextComponent style={styles.modalTitle}>
                                Add requisition
                            </TextComponent>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons
                                    name="close"
                                    size={22}
                                    color="#0f172a"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputWrap}>
                            <TextComponent style={styles.label}>
                                Product
                            </TextComponent>
                            <View style={styles.pickerWrap}>
                                <Picker
                                    selectedValue={form.item_name}
                                    onValueChange={value => {
                                        const selectedProduct = products.find(
                                            product =>
                                                product.product_name === value,
                                        );

                                        setForm(prev => ({
                                            ...prev,
                                            item_name: value,
                                            manual_item_name:
                                                value === '__other__'
                                                    ? prev.manual_item_name
                                                    : '',
                                            unit_price:
                                                value === '__other__'
                                                    ? prev.unit_price
                                                    : selectedProduct?.unit_price ||
                                                      '',
                                        }));
                                    }}
                                    style={styles.picker}>
                                    <Picker.Item
                                        label="Select a product"
                                        value=""
                                    />
                                    {products.map(product => (
                                        <Picker.Item
                                            key={product.id}
                                            label={`${product.product_name} • ${formatPeso(product.unit_price)}`}
                                            value={product.product_name}
                                        />
                                    ))}
                                    <Picker.Item
                                        label="Other (enter manually)"
                                        value="__other__"
                                    />
                                </Picker>
                            </View>
                        </View>
                        {/* Unit price field */}
                        <TextInput
                            placeholder="Unit price"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={String(form.unit_price || '')}
                            onChangeText={text =>
                                setForm(prev => ({...prev, unit_price: text}))
                            }
                            style={styles.input}
                        />
                        {hasPrice(form.unit_price) && (
                            <TextComponent style={styles.priceHint}>
                                Selected price: {formatPeso(form.unit_price)}
                            </TextComponent>
                        )}
                        {form.item_name === '__other__' && (
                            <TextInput
                                placeholder="Enter item name"
                                placeholderTextColor="#94a3b8"
                                value={form.manual_item_name}
                                onChangeText={text =>
                                    setForm(prev => ({
                                        ...prev,
                                        manual_item_name: text,
                                    }))
                                }
                                style={styles.input}
                            />
                        )}
                        <TextInput
                            placeholder="Quantity"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={form.quantity}
                            onChangeText={text =>
                                setForm(prev => ({...prev, quantity: text}))
                            }
                            style={styles.input}
                        />
                        <View style={styles.inputWrap}>
                            <TextComponent style={styles.label}>
                                Branch
                            </TextComponent>
                            <View style={styles.pickerWrap}>
                                {loadingBranches ? (
                                    <View style={styles.pickerLoading}>
                                        <TextComponent style={styles.label}>
                                            Loading branches...
                                        </TextComponent>
                                    </View>
                                ) : (
                                    <Picker
                                        selectedValue={form.branch_name}
                                        onValueChange={value =>
                                            setForm(prev => ({
                                                ...prev,
                                                branch_name: value,
                                            }))
                                        }
                                        style={styles.picker}>
                                        <Picker.Item
                                            label="Select branch"
                                            value=""
                                        />
                                        <Picker.Item
                                            label="All branches"
                                            value="All branches"
                                        />
                                        {branches.map(branch => (
                                            <Picker.Item
                                                key={branch.id}
                                                label={branch.branch_name}
                                                value={branch.branch_name}
                                            />
                                        ))}
                                    </Picker>
                                )}
                            </View>
                        </View>
                        <TextInput
                            placeholder="Remarks"
                            placeholderTextColor="#94a3b8"
                            multiline
                            value={form.description}
                            onChangeText={text =>
                                setForm(prev => ({...prev, description: text}))
                            }
                            style={[styles.input, styles.textArea]}
                        />

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={saveItem}>
                            <TextComponent style={styles.saveBtnText}>
                                Save requisition
                            </TextComponent>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {flex: 1, backgroundColor: '#f8fafc'},
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 14,
        padding: 16,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        shadowColor: '#0f172a',
        shadowOpacity: 0.07,
        shadowRadius: 12,
        shadowOffset: {width: 0, height: 6},
        elevation: 2,
        gap: 12,
    },
    summaryIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ecfeff',
    },
    summaryLabel: {fontSize: 16, fontWeight: '800', color: '#0f172a'},
    summaryText: {fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 18},
    summaryCountWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 64,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: '#f0fdfa',
    },
    summaryCount: {fontSize: 20, fontWeight: '800', color: '#0f766e'},
    summaryCountLabel: {fontSize: 11, color: '#0f766e', fontWeight: '700'},
    metricsRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 12,
        gap: 12,
    },
    metricCard: {
        flex: 1,
        padding: 14,
        borderRadius: 18,
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    metricValue: {fontSize: 18, fontWeight: '800', color: '#0f172a'},
    metricLabel: {fontSize: 11, color: '#64748b', marginTop: 4},
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        paddingVertical: 13,
        borderRadius: 18,
        backgroundColor: '#0f766e',
        gap: 8,
    },
    addBtnText: {color: '#ffffff', fontWeight: '800', fontSize: 14},
    listContent: {paddingHorizontal: 16, paddingBottom: 20, paddingTop: 6},
    emptyBox: {
        marginTop: 32,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        borderRadius: 20,
        backgroundColor: '#ffffff',
    },
    emptyText: {marginTop: 8, color: '#64748b', textAlign: 'center'},
    itemCard: {
        marginBottom: 12,
        borderRadius: 20,
        padding: 14,
        backgroundColor: '#ffffff',
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 5},
        elevation: 2,
    },
    itemTopRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
    itemBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ecfeff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: {fontSize: 15, fontWeight: '800', color: '#0f172a'},
    itemMeta: {fontSize: 12, color: '#64748b', marginTop: 3},
    priceHint: {
        marginTop: 8,
        fontSize: 12,
        color: '#0f766e',
        fontWeight: '700',
    },
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
    },
    metaWrap: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
        flexWrap: 'wrap',
    },
    branchChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: '#f0fdfa',
        gap: 6,
    },
    branchChipText: {color: '#0f766e', fontSize: 12, fontWeight: '700'},
    statusChip: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: '#fef3c7',
    },
    statusChipApproved: {backgroundColor: '#dcfce7'},
    statusChipRejected: {backgroundColor: '#fee2e2'},
    statusChipText: {color: '#0f172a', fontSize: 12, fontWeight: '700'},
    reasonLabel: {
        fontSize: 11,
        color: '#0f766e',
        fontWeight: '700',
        marginTop: 12,
    },
    reasonText: {fontSize: 13, color: '#334155', marginTop: 4, lineHeight: 18},
    actionRow: {flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap'},
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 14,
        backgroundColor: '#64748b',
    },
    approveBtn: {backgroundColor: '#16a34a'},
    rejectBtn: {backgroundColor: '#dc2626'},
    actionBtnText: {color: '#ffffff', fontSize: 12, fontWeight: '700'},
    dateText: {marginTop: 10, fontSize: 11, color: '#94a3b8'},
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'flex-end',
    },
    modalBox: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 18,
        paddingBottom: 28,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {fontSize: 18, fontWeight: '800', color: '#0f172a'},
    inputWrap: {marginTop: 12},
    label: {fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: '600'},
    pickerWrap: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
    },
    picker: {color: '#0f172a'},
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 12,
        color: '#0f172a',
        backgroundColor: '#f8fafc',
    },
    textArea: {minHeight: 96, textAlignVertical: 'top'},
    saveBtn: {
        marginTop: 14,
        borderRadius: 16,
        paddingVertical: 13,
        alignItems: 'center',
        backgroundColor: '#0f766e',
    },
    saveBtnText: {color: '#ffffff', fontWeight: '800', fontSize: 14},
});

export default POSOwnerRequisitionTab;
