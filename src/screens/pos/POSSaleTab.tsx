// @ts-nocheck
import React, {useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    RefreshControl,
    TouchableOpacity,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../../components';
import {fetchPosProducts, savePosSale} from '../../utils/posService';
import {PRIMARY_COLOR, PRODUCT_IMG_URL} from '../../utils/constant';

const BASE_IMG = PRODUCT_IMG_URL;
import {
    getLimitedCartQuantity,
    normalizeInventoryQuantity,
    parseCartPrice,
} from '../../utils/posInventory';

const money = n =>
    '₱ ' +
    Number(n || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const POSSaleTab = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [discount, setDiscount] = useState('');
    const [payment, setPayment] = useState('');
    const [saving, setSaving] = useState(false);
    const [branchId, setBranchId] = useState(0);
    const [cashierId, setCashierId] = useState(0);

    const load = async () => {
        try {
            const bId = Number(await AsyncStorage.getItem('branch_id')) || 0;
            const cId = Number(await AsyncStorage.getItem('userid')) || 0;
            setBranchId(bId);
            setCashierId(cId);
            const data = await fetchPosProducts(bId);
            setProducts(data);
        } catch {
            Alert.alert('Error', 'Failed to load products.');
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        load();
    }, []);

    const text = search.toLowerCase();
    const list = products.filter(
        p =>
            p.product_name.toLowerCase().includes(text) ||
            p.product_code.toLowerCase().includes(text),
    );

    const addToCart = product => {
        const maxQty = normalizeInventoryQuantity(product.quantity_on_hand);
        if (maxQty <= 0) {
            Alert.alert(
                'Out of stock',
                'This product is currently unavailable.',
            );
            return;
        }

        setCart(prev => {
            const found = prev.find(c => c.product_id === product.id);
            if (found) {
                const nextQty = getLimitedCartQuantity(found.qty, 1, maxQty);
                return prev.map(c =>
                    c.product_id === product.id ? {...c, qty: nextQty} : c,
                );
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    product_name: product.product_name,
                    price: Number(product.unit_price),
                    qty: 1,
                },
            ];
        });
    };

    const changeQty = (id, delta) => {
        setCart(prev =>
            prev
                .map(item => {
                    if (item.product_id !== id) {
                        return item;
                    }

                    const product = products.find(p => p.id === id);
                    const maxQty = normalizeInventoryQuantity(
                        product?.quantity_on_hand,
                    );
                    const nextQty = getLimitedCartQuantity(
                        item.qty,
                        delta,
                        maxQty,
                    );
                    return nextQty > 0 ? {...item, qty: nextQty} : null;
                })
                .filter(Boolean),
        );
    };

    const changePrice = (id, value) => {
        const nextPrice = parseCartPrice(value);
        if (nextPrice === null) {
            return;
        }

        setCart(prev =>
            prev.map(item =>
                item.product_id === id ? {...item, price: nextPrice} : item,
            ),
        );
    };

    const removeItem = id => setCart(cart.filter(c => c.product_id !== id));

    let cartCount = 0;
    let subtotal = 0;
    cart.forEach(c => {
        cartCount += c.qty;
        subtotal += c.price * c.qty;
    });

    // Require Discount and Payment fields to be present (non-empty)
    const discountValue = discount?.toString().trim();
    const paymentValue = payment?.toString().trim();

    // Convert to numbers only after presence check
    const discountNum =
        discountValue === undefined ||
        discountValue === null ||
        discountValue === ''
            ? NaN
            : Number(discountValue);
    const total =
        subtotal -
        (Number.isFinite(discountNum) ? Math.min(discountNum, subtotal) : 0);
    const paymentNum =
        paymentValue === undefined ||
        paymentValue === null ||
        paymentValue === ''
            ? NaN
            : Number(paymentValue);
    const change =
        Number.isFinite(paymentNum) && paymentNum > 0
            ? Math.max(0, paymentNum - total)
            : 0;

    const checkout = async () => {
        if (cart.length === 0) {
            return;
        }
        // Validate required fields
        if (
            discountValue === undefined ||
            discountValue === null ||
            discountValue === ''
        ) {
            Alert.alert(
                'Validation',
                'Please enter Discount and Cash Payment(if no Discount enter 0)',
            );
            return;
        }
        if (!Number.isFinite(discountNum) || discountNum < 0) {
            Alert.alert(
                'Validation',
                'Enter a valid non-negative Discount amount.',
            );
            return;
        }
        if (discountNum > subtotal) {
            Alert.alert('Validation', 'Discount cannot exceed subtotal.');
            return;
        }
        if (
            paymentValue === undefined ||
            paymentValue === null ||
            paymentValue === ''
        ) {
            Alert.alert(
                'Validation',
                'Please enter Cash Payment (enter 0 if none).',
            );
            return;
        }
        if (!Number.isFinite(paymentNum) || paymentNum < 0) {
            Alert.alert(
                'Validation',
                'Enter a valid non-negative Cash Payment amount.',
            );
            return;
        }
        if (paymentNum > 0 && paymentNum < total) {
            Alert.alert('Not enough', 'Payment is less than the total.');
            return;
        }
        setSaving(true);
        try {
            const res = await savePosSale({
                branch_id: branchId,
                cashier_id: cashierId,
                discount: discountNum,
                payment: paymentNum,
                items: cart,
            });
            if (res && res.result) {
                Alert.alert(
                    'Sale Complete',
                    'Invoice: ' +
                        res.invoice_no +
                        '\nChange: ' +
                        money(res.change),
                );
                setCart([]);
                setDiscount('');
                setPayment('');
                setCartOpen(false);
                load();
            } else {
                Alert.alert('Error', (res && res.message) || 'Failed to save.');
            }
        } catch {
            Alert.alert('Error', 'Failed to save sale.');
        }
        setSaving(false);
    };

    const renderProduct = ({item}) => {
        const inCart = cart.find(c => c.product_id === item.id);
        const out = Number(item.quantity_on_hand) <= 0;
        return (
            <TouchableOpacity
                style={[styles.row, out && styles.rowMuted]}
                onPress={() => !out && addToCart(item)}
                activeOpacity={0.9}>
                {item.image ? (
                    <Image
                        source={{uri: BASE_IMG + item.image}}
                        style={styles.productImage}
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
                <View style={styles.cardText}>
                    <TextComponent style={styles.name}>
                        {item.product_name}
                    </TextComponent>
                    <TextComponent style={styles.sub}>
                        {money(item.unit_price)}
                    </TextComponent>
                    <TextComponent style={styles.meta}>
                        Stock {Number(item.quantity_on_hand)}
                    </TextComponent>
                </View>
                <View style={styles.cardAction}>
                    <View
                        style={[
                            styles.stockBadge,
                            out && styles.stockBadgeMuted,
                        ]}>
                        <TextComponent style={styles.stockBadgeText}>
                            {Number(item.quantity_on_hand)}
                        </TextComponent>
                    </View>
                    <LinearGradient
                        colors={
                            out
                                ? ['#cbd5e1', '#94a3b8']
                                : ['#0f766e', '#14b8a6']
                        }
                        style={styles.addButton}>
                        {inCart ? (
                            <TextComponent style={styles.qty}>
                                {inCart.qty}
                            </TextComponent>
                        ) : (
                            <MaterialCommunityIcons
                                name="plus"
                                size={18}
                                color="#fff"
                            />
                        )}
                    </LinearGradient>
                </View>
            </TouchableOpacity>
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
                renderItem={renderProduct}
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

            {cartCount > 0 && (
                <TouchableOpacity
                    style={styles.cartBar}
                    onPress={() => setCartOpen(true)}>
                    <View>
                        <TextComponent style={styles.cartBarText}>
                            View cart
                        </TextComponent>
                        <TextComponent style={styles.cartBarMeta}>
                            {cartCount} items
                        </TextComponent>
                    </View>
                    <TextComponent style={styles.cartBarText}>
                        {money(total)}
                    </TextComponent>
                </TouchableOpacity>
            )}

            <Modal visible={cartOpen} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalTop}>
                            <TextComponent style={styles.modalTitle}>
                                Cart ({cartCount})
                            </TextComponent>
                            <TouchableOpacity
                                onPress={() => setCartOpen(false)}>
                                <TextComponent style={styles.close}>
                                    ✕
                                </TextComponent>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={cart}
                            keyExtractor={i => i.product_id.toString()}
                            style={styles.cartList}
                            renderItem={({item}) => (
                                <View style={styles.cartRow}>
                                    <View style={{flex: 1}}>
                                        <TextComponent style={styles.name}>
                                            {item.product_name}
                                        </TextComponent>
                                        <TextComponent style={styles.label}>
                                            Unit price
                                        </TextComponent>
                                        <TextInput
                                            value={String(item.price)}
                                            onChangeText={value =>
                                                changePrice(
                                                    item.product_id,
                                                    value,
                                                )
                                            }
                                            keyboardType="decimal-pad"
                                            selectTextOnFocus
                                            style={styles.priceInput}
                                        />
                                        <TextComponent style={styles.sub}>
                                            {money(item.price)} × {item.qty}
                                        </TextComponent>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() =>
                                            changeQty(item.product_id, -1)
                                        }>
                                        <TextComponent style={styles.stepText}>
                                            −
                                        </TextComponent>
                                    </TouchableOpacity>
                                    <TextComponent style={styles.stepQty}>
                                        {item.qty}
                                    </TextComponent>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() =>
                                            changeQty(item.product_id, 1)
                                        }>
                                        <TextComponent style={styles.stepText}>
                                            +
                                        </TextComponent>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() =>
                                            removeItem(item.product_id)
                                        }>
                                        <TextComponent style={styles.remove}>
                                            Remove
                                        </TextComponent>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />

                        <View style={styles.inputRow}>
                            <View style={{flex: 1, marginRight: 8}}>
                                <TextComponent style={styles.label}>
                                    Discount
                                </TextComponent>
                                <TextInput
                                    value={discount}
                                    onChangeText={setDiscount}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    style={styles.input}
                                />
                            </View>
                            <View style={{flex: 1}}>
                                <TextComponent style={styles.label}>
                                    Cash Payment
                                </TextComponent>
                                <TextInput
                                    value={payment}
                                    onChangeText={setPayment}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        <View style={styles.totalRow}>
                            <TextComponent style={styles.totalLabel}>
                                Subtotal
                            </TextComponent>
                            <TextComponent style={styles.totalValue}>
                                {money(subtotal)}
                            </TextComponent>
                        </View>
                        <View style={styles.totalRow}>
                            <TextComponent style={styles.totalLabel}>
                                Discount
                            </TextComponent>
                            <TextComponent style={styles.totalValue}>
                                - {money(discountNum)}
                            </TextComponent>
                        </View>
                        <View style={styles.totalRow}>
                            <TextComponent style={styles.bold}>
                                Total
                            </TextComponent>
                            <TextComponent style={styles.bold}>
                                {money(total)}
                            </TextComponent>
                        </View>
                        {paymentNum > 0 && (
                            <View style={styles.totalRow}>
                                <TextComponent style={styles.totalLabel}>
                                    Change
                                </TextComponent>
                                <TextComponent style={styles.totalValue}>
                                    {money(change)}
                                </TextComponent>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.checkoutBtn}
                            onPress={checkout}
                            disabled={saving}>
                            <TextComponent style={styles.checkoutText}>
                                {saving
                                    ? 'Saving...'
                                    : 'Complete Sale ' + money(total)}
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
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 4},
    },
    searchInput: {flex: 1, marginLeft: 8, color: '#0f172a'},
    listContent: {paddingHorizontal: 16, paddingTop: 6, paddingBottom: 90},
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 6},
        elevation: 2,
    },
    rowMuted: {opacity: 0.6},
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#ecfeff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardText: {flex: 1},
    name: {fontSize: 15, fontWeight: '700', color: '#0f172a'},
    sub: {fontSize: 13, color: '#0f766e', fontWeight: '700', marginTop: 2},
    meta: {fontSize: 12, color: '#64748b', marginTop: 2},
    cardAction: {alignItems: 'flex-end', gap: 8},
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#ecfdf5',
    },
    stockBadgeMuted: {backgroundColor: '#f1f5f9'},
    stockBadgeText: {fontSize: 11, color: '#16a34a', fontWeight: '700'},
    productImage: {
        width: 56,
        height: 56,
        borderRadius: 16,
        marginRight: 12,
        backgroundColor: '#f8fafc',
    },
    imagePlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 16,
        marginRight: 12,
        backgroundColor: '#ecfeff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qty: {fontSize: 14, color: '#fff', fontWeight: '700'},
    cartBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 16,
        backgroundColor: '#0f766e',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#0f172a',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: {width: 0, height: 10},
        elevation: 4,
    },
    cartBarText: {color: '#ffffff', fontWeight: '700', fontSize: 15},
    cartBarMeta: {color: '#ccfbf1', fontSize: 12, marginTop: 2},
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
    cartList: {maxHeight: 260},
    cartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    stepBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        marginHorizontal: 2,
    },
    stepText: {fontSize: 16, color: '#0f766e', fontWeight: '700'},
    stepQty: {
        minWidth: 24,
        textAlign: 'center',
        fontWeight: '700',
        color: '#0f172a',
    },
    remove: {color: '#dc2626', marginLeft: 8, fontWeight: '600'},
    inputRow: {flexDirection: 'row', marginTop: 10},
    label: {fontSize: 12, color: '#64748b', marginBottom: 4},
    priceInput: {
        width: 110,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontSize: 13,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#f8fafc',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    totalLabel: {color: '#64748b'},
    totalValue: {color: '#0f172a', fontWeight: '600'},
    bold: {fontWeight: '800', fontSize: 15, color: '#0f172a'},
    checkoutBtn: {
        backgroundColor: '#0f766e',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        marginTop: 14,
    },
    checkoutText: {color: '#ffffff', fontWeight: '700', fontSize: 15},
});

export default POSSaleTab;
