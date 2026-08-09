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
    savePosDamageItem,
    deletePosDamageItem,
} from '../../utils/posService';

const STORAGE_KEY = 'pos_damage_items';

const formatDateTime = value => {
    try {
        return new Date(value).toLocaleString();
    } catch {
        return '';
    }
};

const emptyForm = {
    item_name: '',
    manual_item_name: '',
    quantity: '1',
    reason: '',
};

const POSDamageTab = ({onStockChanged}) => {
    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const loadItems = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            setItems(stored ? JSON.parse(stored) : []);
        } catch (error) {
            console.error('Failed to load damaged items:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const branchId =
                Number(await AsyncStorage.getItem('branch_id')) || 0;
            const data = await fetchPosProducts(branchId);
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products for damage tab:', error);
            setProducts([]);
        }
    };

    useEffect(() => {
        loadItems();
        loadProducts();
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
        const selectedProductId =
            form.item_name === '__other__' ? 0 : Number(form.item_name);
        const selectedProduct = products.find(
            product => Number(product.id) === selectedProductId,
        );
        const itemName = (
            form.item_name === '__other__'
                ? form.manual_item_name
                : selectedProduct?.product_name || ''
        ).trim();
        const reason = form.reason.trim();
        const quantity = Number(form.quantity);

        if (!itemName) {
            Alert.alert(
                'Missing item',
                'Please select a product or enter the damaged item name.',
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
            item_name: itemName,
            quantity,
            reason: reason || 'No reason provided',
            created_at: new Date().toISOString(),
        };

        const nextItems = [newItem, ...items];
        await persistItems(nextItems);

        try {
            const branchId = Number(await AsyncStorage.getItem('branch_id')) || 0;
            const cashierId = Number(await AsyncStorage.getItem('userid')) || 0;
            const result = await savePosDamageItem({
                branch_id: branchId,
                cashier_id: cashierId,
                product_id: selectedProductId > 0 ? selectedProductId : undefined,
                item_name: itemName,
                quantity,
                description: reason || 'No reason provided',
            });

            if (result?.result) {
                newItem.server_id = result.damage_id ?? null;
                await persistItems([newItem, ...items]);
                onStockChanged?.();
                setSuccessMessage(result.message || 'Damage item saved successfully.');
                setSuccessModalVisible(true);
            } else {
                Alert.alert(
                    'Saved locally',
                    `Damage item logged locally but failed to sync: ${result?.message || 'Unknown error'}`,
                );
            }
        } catch (error) {
            console.error('Failed to push damaged item to server:', error);
            Alert.alert(
                'Saved locally',
                'Damage item logged locally but failed to sync to the server.',
            );
        }

        setModalVisible(false);
    };

    const deleteItem = async id => {
        const itemToDelete = items.find(item => item.id === id);
        let stockWasRestored = false;
        if (itemToDelete?.server_id) {
            const response = await deletePosDamageItem({damage_id: itemToDelete.server_id});
            if (!response?.result) {
                Alert.alert(
                    'Delete failed',
                    response?.message || 'Unable to delete damage item from the server.',
                );
                return;
            }
            stockWasRestored = true;
        }

        const nextItems = items.filter(item => item.id !== id);
        await persistItems(nextItems);
        if (stockWasRestored) {
            onStockChanged?.();
        }
    };

    const confirmDeleteItem = id => {
        setDeleteTargetId(id);
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteTargetId) return;
        await deleteItem(deleteTargetId);
        setDeleteModalVisible(false);
        setDeleteTargetId(null);
    };

    const cancelDelete = () => {
        setDeleteModalVisible(false);
        setDeleteTargetId(null);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadItems();
        setRefreshing(false);
    };

    const totalQuantity = useMemo(
        () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        [items],
    );

    return (
        <View style={styles.screen}>
            <View style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                    <MaterialCommunityIcons
                        name="alert-octagon-outline"
                        size={22}
                        color="#0f766e"
                    />
                </View>
                <View style={{flex: 1}}>
                    <TextComponent style={styles.summaryLabel}>
                        Manage damaged items
                    </TextComponent>
                    <TextComponent style={styles.summaryText}>
                        Track damaged items reported by the cashier.
                    </TextComponent>
                </View>
                <View style={styles.summaryCountWrap}>
                    <TextComponent style={styles.summaryCount}>
                        {items.length}
                    </TextComponent>
                    <TextComponent style={styles.summaryCountLabel}>
                        records
                    </TextComponent>
                </View>
            </View>

            <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                    <TextComponent style={styles.metricValue}>
                        {items.length}
                    </TextComponent>
                    <TextComponent style={styles.metricLabel}>
                        Entries
                    </TextComponent>
                </View>
                <View style={styles.metricCard}>
                    <TextComponent style={styles.metricValue}>
                        {totalQuantity}
                    </TextComponent>
                    <TextComponent style={styles.metricLabel}>
                        Qty marked
                    </TextComponent>
                </View>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={openComposer}>
                <MaterialCommunityIcons name="plus" size={18} color="#ffffff" />
                <TextComponent style={styles.addBtnText}>
                    Add damaged item
                </TextComponent>
            </TouchableOpacity>

            <FlatList
                data={items}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <MaterialCommunityIcons
                            name="package-variant-closed"
                            size={28}
                            color="#94a3b8"
                        />
                        <TextComponent style={styles.emptyText}>
                            No damaged items logged yet.
                        </TextComponent>
                    </View>
                }
                renderItem={({item}) => (
                    <View style={styles.itemCard}>
                        <View style={styles.itemTopRow}>
                            <View style={styles.itemBadge}>
                                <MaterialCommunityIcons
                                    name="cube-off-outline"
                                    size={16}
                                    color="#0f766e"
                                />
                            </View>
                            <View style={{flex: 1}}>
                                <TextComponent style={styles.itemName}>
                                    {item.item_name}
                                </TextComponent>
                                <TextComponent style={styles.itemMeta}>
                                    Qty: {item.quantity} •{' '}
                                    {formatDateTime(item.created_at)}
                                </TextComponent>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => confirmDeleteItem(item.id)}>
                                <MaterialCommunityIcons
                                    name="trash-can-outline"
                                    size={18}
                                    color="#dc2626"
                                />
                            </TouchableOpacity>
                        </View>
                        <TextComponent style={styles.reasonLabel}>
                            Reason
                        </TextComponent>
                        <TextComponent style={styles.reasonText}>
                            {item.reason}
                        </TextComponent>
                    </View>
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <TextComponent style={styles.modalTitle}>
                                Add damaged item
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
                                    onValueChange={value =>
                                        setForm(prev => ({
                                            ...prev,
                                            item_name: value,
                                            manual_item_name:
                                                value === '__other__'
                                                    ? prev.manual_item_name
                                                    : '',
                                        }))
                                    }
                                    style={styles.picker}>
                                    <Picker.Item
                                        label="Select a product"
                                        value=""
                                    />
                                    {products.map(product => (
                                        <Picker.Item
                                            key={product.id}
                                            label={product.product_name}
                                            value={product.id}
                                        />
                                    ))}
                                    <Picker.Item
                                        label="Other (enter manually)"
                                        value="__other__"
                                    />
                                </Picker>
                            </View>
                        </View>
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
                        <TextInput
                            placeholder="Reason"
                            placeholderTextColor="#94a3b8"
                            multiline
                            value={form.reason}
                            onChangeText={text =>
                                setForm(prev => ({...prev, reason: text}))
                            }
                            style={[styles.input, styles.textArea]}
                        />

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={saveItem}>
                            <TextComponent style={styles.saveBtnText}>
                                Save item
                            </TextComponent>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={successModalVisible} animationType="fade" transparent>
                <View style={styles.successModalBackdrop}>
                    <View style={styles.successModalBox}>
                        <TextComponent style={styles.successModalTitle}>
                            Success
                        </TextComponent>
                        <TextComponent style={styles.successModalText}>
                            {successMessage}
                        </TextComponent>
                        <TouchableOpacity
                            style={styles.successModalButton}
                            onPress={() => setSuccessModalVisible(false)}>
                            <TextComponent style={styles.successModalButtonText}>
                                OK
                            </TextComponent>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={deleteModalVisible} animationType="fade" transparent>
                <View style={styles.successModalBackdrop}>
                    <View style={styles.deleteModalBox}>
                        <TextComponent style={styles.successModalTitle}>
                            Confirm Delete
                        </TextComponent>
                        <TextComponent style={styles.successModalText}>
                            Are you sure you want to remove this damaged item?
                        </TextComponent>
                        <View style={styles.deleteModalActions}>
                            <TouchableOpacity
                                style={[styles.deleteModalButton, styles.cancelButton]}
                                onPress={cancelDelete}>
                                <TextComponent style={styles.cancelButtonText}>
                                    Cancel
                                </TextComponent>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.deleteModalButton, styles.confirmButton]}
                                onPress={handleDeleteConfirmed}>
                                <TextComponent style={styles.confirmButtonText}>
                                    Delete
                                </TextComponent>
                            </TouchableOpacity>
                        </View>
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
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
    },
    reasonLabel: {
        fontSize: 11,
        color: '#0f766e',
        fontWeight: '700',
        marginTop: 12,
    },
    reasonText: {fontSize: 13, color: '#334155', marginTop: 4, lineHeight: 18},
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
    textArea: {
        minHeight: 96,
        textAlignVertical: 'top',
    },
    saveBtn: {
        marginTop: 14,
        borderRadius: 16,
        paddingVertical: 13,
        alignItems: 'center',
        backgroundColor: '#0f766e',
    },
    saveBtnText: {color: '#ffffff', fontWeight: '800', fontSize: 14},
    successModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    successModalBox: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: {width: 0, height: 4},
        elevation: 6,
    },
    successModalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f766e',
        marginBottom: 12,
    },
    successModalText: {
        fontSize: 14,
        color: '#334155',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    successModalButton: {
        backgroundColor: '#0f766e',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 28,
    },
    successModalButtonText: {
        color: '#ffffff',
        fontWeight: '800',
        fontSize: 14,
    },
    deleteModalBox: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: {width: 0, height: 4},
        elevation: 6,
    },
    deleteModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    deleteModalButton: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e2e8f0',
        marginRight: 10,
    },
    confirmButton: {
        backgroundColor: '#dc2626',
    },
    cancelButtonText: {
        color: '#0f172a',
        fontWeight: '800',
        fontSize: 14,
    },
    confirmButtonText: {
        color: '#ffffff',
        fontWeight: '800',
        fontSize: 14,
    },
});

export default POSDamageTab;
