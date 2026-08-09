// @ts-nocheck
import React, {useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Image,
    Platform,
    TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../../components';
import {
    fetchPosProducts,
    updatePosProductPrice,
} from '../../utils/posService';
import {PRIMARY_COLOR, PRODUCT_IMG_URL} from '../../utils/constant';

const BASE_IMG = PRODUCT_IMG_URL;

const POSProductsTab = ({refreshKey = 0}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [isCashier, setIsCashier] = useState(false);
    const [priceDrafts, setPriceDrafts] = useState({});
    const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
    const [savingPriceId, setSavingPriceId] = useState<number | null>(null);

    const setPriceDraft = (productId, value) => {
        const sanitized = value.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        const normalized =
            parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;

        setPriceDrafts(prev => ({...prev, [productId]: normalized}));
    };

    const toggleEditPrice = async productId => {
        if (editingPriceId === productId) {
            await savePrice(productId);
            return;
        }

        const product = products.find(p => p.id === productId);
        setPriceDrafts(prev => ({
            ...prev,
            [productId]: product?.unit_price?.toString() || '',
        }));
        setEditingPriceId(productId);
    };

    const savePrice = async productId => {
        const draft = (priceDrafts[productId] || '').trim();
        if (draft === '') {
            Alert.alert('Validation', 'Please enter a valid price.');
            return;
        }
        if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(draft)) {
            Alert.alert('Validation', 'Enter a numeric price with up to 2 decimals.');
            return;
        }

        const priceValue = Number(draft);
        if (isNaN(priceValue) || priceValue < 0) {
            Alert.alert('Validation', 'Enter a valid non-negative price.');
            return;
        }

        setSavingPriceId(productId);
        try {
            const res = await updatePosProductPrice(productId, priceValue);
            if (res?.result) {
                setProducts(prev =>
                    prev.map(p =>
                        p.id === productId
                            ? {...p, unit_price: priceValue.toFixed(2)}
                            : p,
                    ),
                );
                setEditingPriceId(null);
                Alert.alert('Success', 'Price updated successfully.');
            } else {
                Alert.alert('Error', res?.message || 'Unable to update price.');
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to update price.');
        } finally {
            setSavingPriceId(null);
        }
    };

    const load = async () => {
        try {
            const bId = Number(await AsyncStorage.getItem('branch_id')) || 0;
            const userType = Number(await AsyncStorage.getItem('userType')) || 0;
            setIsCashier(userType === 8);
            const data = await fetchPosProducts(bId);
            setProducts(data);
        } catch {
            // ignore, pull to refresh
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        load();
    }, [refreshKey]);

    const text = search.toLowerCase();
    const list = products.filter(
        p =>
            p.product_name.toLowerCase().includes(text) ||
            p.product_code.toLowerCase().includes(text),
    );

    const renderItem = ({item}) => {
        const low =
            Number(item.quantity_on_hand) <= Number(item.reorder_level || 0);
        const editing = editingPriceId === item.id;

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
                    <View style={styles.priceRow}>
                        {isCashier ? (
                            <TextInput
                                keyboardType="numeric"
                                editable={editing}
                                value={
                                    editing
                                        ? priceDrafts[item.id] ||
                                          item.unit_price?.toString() ||
                                          ''
                                        : item.unit_price?.toString() || ''
                                }
                                onFocus={() => setEditingPriceId(item.id)}
                                onChangeText={value =>
                                    setPriceDraft(item.id, value)
                                }
                                style={[
                                    styles.priceInput,
                                    editing && styles.priceInputActive,
                                ]}
                                placeholder="0.00"
                                placeholderTextColor="#94a3b8"
                            />
                        ) : (
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
                        )}
                        {isCashier && (
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => toggleEditPrice(item.id)}
                                disabled={savingPriceId === item.id}>
                                {savingPriceId === item.id ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <MaterialCommunityIcons
                                        name={editing ? 'check' : 'pencil'}
                                        size={18}
                                        color="#fff"
                                    />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <View style={styles.stockWrap}>
                    <TextComponent
                        style={[styles.stock, low && styles.stockLow]}>
                        {Number(item.quantity_on_hand)}
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
            <View style={styles.searchWrap}>
                <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color="#64748b"
                />
                <TextInput
                    placeholder="Search products..."
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
                            load();
                        }}
                    />
                }
                ListEmptyComponent={
                    <TextComponent style={styles.empty}>
                        No products found.
                    </TextComponent>
                }
            />
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
    priceInput: {
        flex: 1,
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        fontSize: 14,
        color: '#0f766e',
        backgroundColor: '#f8fafc',
    },
    priceInputActive: {
        borderColor: '#0f766e',
        backgroundColor: '#ecfdf5',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 10,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 14,
        backgroundColor: '#0f766e',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    stockWrap: {
        backgroundColor: '#f8fafc',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginLeft: 8,
    },
    stock: {fontSize: 12, color: '#0f172a', fontWeight: '600'},
    stockLow: {color: '#dc2626', fontWeight: '700'},
});

export default POSProductsTab;
