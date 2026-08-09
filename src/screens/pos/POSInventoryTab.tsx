// @ts-nocheck
import React, {useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Image,
    TouchableOpacity,
    Alert,
    Modal,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../../components';
import {fetchPosProducts, updatePosProductStock} from '../../utils/posService';
import {PRIMARY_COLOR, PRODUCT_IMG_URL} from '../../utils/constant';

const BASE_IMG = PRODUCT_IMG_URL;

const POSInventoryTab = ({refreshKey = 0}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addQty, setAddQty] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadProducts = async () => {
        try {
            const bId = Number(await AsyncStorage.getItem('branch_id')) || 0;
            const data = await fetchPosProducts(bId);
            setProducts(data);
        } catch (error) {
            console.error('Load inventory products failed:', error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        loadProducts();
    }, [refreshKey]);

    const openAddStock = product => {
        setSelectedProduct(product);
        setAddQty('');
        setModalVisible(true);
    };

    const handleSaveStock = async () => {
        const qty = Number(addQty);
        if (!selectedProduct || qty <= 0) {
            Alert.alert(
                'Invalid quantity',
                'Enter a positive stock quantity to add.',
            );
            return;
        }
        setSaving(true);
        try {
            const bId = Number(await AsyncStorage.getItem('branch_id')) || 0;
            const res = await updatePosProductStock(
                bId,
                Number(selectedProduct.id),
                qty,
            );
            if (res?.result) {
                Alert.alert(
                    'Stock updated',
                    `Added ${qty} units to ${selectedProduct.product_name}.`,
                );
                setModalVisible(false);
                setSelectedProduct(null);
                setAddQty('');
                loadProducts();
            } else {
                Alert.alert(
                    'Update failed',
                    res?.message || 'Could not update stock.',
                );
            }
        } catch (error) {
            console.error('Update stock error:', error);
            Alert.alert('Update failed', 'Please try again.');
        }
        setSaving(false);
    };

    const text = search.toLowerCase();
    const list = products.filter(
        p =>
            p.product_name.toLowerCase().includes(text) ||
            p.product_code.toLowerCase().includes(text),
    );

    const renderItem = ({item}) => {
        const low =
            Number(item.quantity_on_hand) <= Number(item.reorder_level || 0);
        return (
            <View style={styles.row}>
                {item.image ? (
                    <Image
                        source={{uri: BASE_IMG + item.image}}
                        style={styles.image}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <MaterialCommunityIcons
                            name="cube-outline"
                            size={22}
                            color="#0f766e"
                        />
                    </View>
                )}
                <View style={{flex: 1}}>
                    <TextComponent style={styles.name}>
                        {item.product_name}
                    </TextComponent>
                    <TextComponent style={styles.code}>
                        {item.product_code}
                    </TextComponent>
                    <TextComponent style={styles.price}>
                        {'₱ ' +
                            Number(item.unit_price || 0).toLocaleString(
                                'en-PH',
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                },
                            )}
                    </TextComponent>
                </View>
                <View style={styles.rightColumn}>
                    <View style={styles.stockWrap}>
                        <TextComponent
                            style={[styles.stock, low && styles.stockLow]}>
                            {Number(item.quantity_on_hand)}
                        </TextComponent>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => openAddStock(item)}>
                        <MaterialCommunityIcons
                            name="plus"
                            size={18}
                            color="#fff"
                        />
                    </TouchableOpacity>
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
            <View style={styles.searchWrap}>
                <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color="#64748b"
                />
                <TextInput
                    placeholder="Search inventory..."
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
            </View>
            <FlatList
                data={list}
                keyExtractor={i => i.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadProducts();
                        }}
                    />
                }
                ListEmptyComponent={
                    <TextComponent style={styles.empty}>
                        No inventory items found.
                    </TextComponent>
                }
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <TextComponent style={styles.modalTitle}>
                            Add Stock
                        </TextComponent>
                        <TextComponent
                            style={styles.modalSubtitle}
                            numberOfLines={2}>
                            {selectedProduct?.product_name ||
                                'Select a product'}
                        </TextComponent>
                        <View style={styles.modalRow}>
                            <TextComponent style={styles.modalLabel}>
                                Current stock
                            </TextComponent>
                            <TextComponent style={styles.modalValue}>
                                {selectedProduct?.quantity_on_hand ?? 0}
                            </TextComponent>
                        </View>
                        <View style={styles.inputWrap}>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Quantity to add"
                                placeholderTextColor="#94a3b8"
                                value={addQty}
                                onChangeText={setAddQty}
                                style={styles.modalInput}
                            />
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setModalVisible(false)}>
                                <TextComponent style={styles.cancelText}>
                                    Cancel
                                </TextComponent>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    saving && {opacity: 0.7},
                                ]}
                                onPress={handleSaveStock}
                                disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <TextComponent style={styles.saveText}>
                                        Save
                                    </TextComponent>
                                )}
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
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    empty: {textAlign: 'center', color: '#64748b', marginTop: 30},
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 4},
    },
    searchInput: {flex: 1, marginLeft: 8, color: '#0f172a'},
    listContent: {paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20},
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 6},
        elevation: 2,
    },
    image: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        marginRight: 12,
    },
    imagePlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#ecfeff',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {fontSize: 15, fontWeight: '700', color: '#0f172a'},
    code: {fontSize: 12, color: '#64748b', marginTop: 2},
    price: {fontSize: 14, color: '#0f766e', fontWeight: '700', marginTop: 4},
    rightColumn: {alignItems: 'flex-end'},
    stockWrap: {
        backgroundColor: '#f8fafc',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 8,
    },
    stock: {fontSize: 12, color: '#0f172a', fontWeight: '600'},
    stockLow: {color: '#dc2626', fontWeight: '700'},
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0f766e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#0f172a',
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: {width: 0, height: 8},
        elevation: 8,
    },
    modalTitle: {fontSize: 18, fontWeight: '800', color: '#0f172a'},
    modalSubtitle: {fontSize: 14, color: '#475569', marginTop: 6},
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalLabel: {color: '#64748b', fontSize: 13},
    modalValue: {fontSize: 14, color: '#0f172a', fontWeight: '700'},
    inputWrap: {
        marginTop: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalInput: {
        padding: Platform.OS === 'ios' ? 14 : 10,
        color: '#0f172a',
        fontSize: 15,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 22,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
    },
    cancelText: {color: '#0f172a', fontWeight: '700'},
    saveButton: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 16,
        backgroundColor: '#0f766e',
    },
    saveText: {color: '#fff', fontWeight: '700'},
});

export default POSInventoryTab;
