// @ts-nocheck
import React, {useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../../components';
import {
    fetchPosProducts,
    fetchPosQuotations,
    savePosQuotation,
} from '../../utils/posService';

const choices = {
    frame: ['UPVC White Frame', 'UPVC Brown Frame'],
    unit: ['MM', 'CM', 'IN', 'Ft', 'M'],
    design: ['None', 'French Type Design'],
    service: ['Supply only', 'Deliver&Installation'],
};

const POSQuotationTab = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [productId, setProductId] = useState(0);
    const [customer, setCustomer] = useState('');
    const [frame, setFrame] = useState(choices.frame[0]);
    const [unit, setUnit] = useState('IN');
    const [design, setDesign] = useState('None');
    const [service, setService] = useState('Supply only');
    const [glass, setGlass] = useState('6mm Clear Glass');
    const [width, setWidth] = useState('48');
    const [height, setHeight] = useState('48');
    const [quantity, setQuantity] = useState('1');
    const [discount, setDiscount] = useState('0');
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const branchId = Number(await AsyncStorage.getItem('branch_id')) || 0;
                const [items, saved] = await Promise.all([
                    fetchPosProducts(branchId),
                    fetchPosQuotations(),
                ]);
                setProducts(items);
                setQuotes(saved);
                if (items[0]) setProductId(Number(items[0].id));
            } catch (error) {
                console.error('Quotation load error:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const selectedProduct = products.find(item => Number(item.id) === productId);
    const price = useMemo(() => {
        if (!selectedProduct || Number(width) <= 0 || Number(height) <= 0) return 0;
        const conversion: any = {MM: 0.0393701, CM: 0.393701, IN: 1, Ft: 12, M: 39.3701};
        let value = Number(selectedProduct.unit_price || 0) *
            ((Number(width) * conversion[unit]) * (Number(height) * conversion[unit])) / (48 * 48);
        if (design !== 'None') value *= 1.1;
        if (service === 'Deliver&Installation') value *= 1.15;
        return Math.max(0, value);
    }, [selectedProduct, width, height, unit, design, service]);

    const money = (value: number) => `₱ ${Number(value || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}`;
    const addToCart = () => {
        if (!selectedProduct || price <= 0) return Alert.alert('Quotation', 'Select a product and valid dimensions.');
        const description = `${frame}, ${glass}, ${width} × ${height} ${unit}, ${design}, ${service}`;
        setCart(items => [...items, {
            product_id: Number(selectedProduct.id),
            product_name: selectedProduct.product_name,
            price,
            qty: Math.max(1, Number(quantity) || 1),
            description,
        }]);
    };
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const total = Math.max(0, subtotal - Math.min(subtotal, Number(discount) || 0));
    const save = async () => {
        if (!cart.length || total <= 0) return;
        setSaving(true);
        try {
            const result = await savePosQuotation({customer_name: customer, discount: Number(discount) || 0, items: cart});
            if (!result?.result) throw new Error(result?.message || 'Unable to save');
            Alert.alert('Quotation saved', result.quotation_no || 'Quotation saved successfully.');
            setCart([]);
            setCustomer('');
            setQuotes(await fetchPosQuotations());
        } catch (error: any) {
            Alert.alert('Quotation', error.message || 'Unable to save quotation.');
        } finally {
            setSaving(false);
        }
    };
    const option = (value: string, active: boolean, onPress: () => void) => (
        <TouchableOpacity key={value} style={[styles.choice, active && styles.choiceActive]} onPress={onPress}>
            <TextComponent style={[styles.choiceText, active && styles.choiceTextActive]}>{value}</TextComponent>
        </TouchableOpacity>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator color="#0f766e" size="large" /></View>;
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <TextComponent style={styles.pageTitle}>Quotation Builder</TextComponent>
                <TextInput value={customer} onChangeText={setCustomer} placeholder="Customer name (optional)" style={styles.input} />
                <TextComponent style={styles.label}>Product</TextComponent>
                <View style={styles.picker}><Picker selectedValue={productId} onValueChange={setProductId}>{products.map(item => <Picker.Item key={item.id} label={item.product_name} value={Number(item.id)} />)}</Picker></View>
                <TextComponent style={styles.sectionLabel}>Color of UPVC frame<TextComponent style={styles.required}>*</TextComponent></TextComponent><View style={styles.options}>{choices.frame.map(value => option(value, frame === value, () => setFrame(value)))}</View>
                <TextComponent style={styles.sectionLabel}>Options of glasses<TextComponent style={styles.required}>*</TextComponent></TextComponent><View style={styles.picker}><Picker selectedValue={glass} onValueChange={setGlass}><Picker.Item label="6mm Clear Glass" value="6mm Clear Glass" /><Picker.Item label="6mm Tinted Glass" value="6mm Tinted Glass" /><Picker.Item label="6mm Reflective Glass" value="6mm Reflective Glass" /></Picker></View>
                <View style={styles.row}><View style={styles.half}><TextComponent style={styles.label}>Width (Lapad)</TextComponent><TextInput value={width} onChangeText={setWidth} keyboardType="numeric" style={styles.input} /></View><View style={styles.half}><TextComponent style={styles.label}>Height (Taas)</TextComponent><TextInput value={height} onChangeText={setHeight} keyboardType="numeric" style={styles.input} /></View></View>
                <TextComponent style={styles.sectionLabel}>Measurement Units that you used<TextComponent style={styles.required}>*</TextComponent></TextComponent><View style={styles.options}>{choices.unit.map(value => option(value, unit === value, () => setUnit(value)))}</View>
                <TextComponent style={styles.sectionLabel}>Add On Design<TextComponent style={styles.required}>*</TextComponent></TextComponent><View style={styles.options}>{choices.design.map(value => option(value, design === value, () => setDesign(value)))}</View>
                <TextComponent style={styles.sectionLabel}>Services<TextComponent style={styles.required}>*</TextComponent></TextComponent><View style={styles.options}>{choices.service.map(value => option(value, service === value, () => setService(value)))}</View>
                <TextComponent style={styles.warning}>Minimum 30K Total Orders For The{`\n`}Delivery&amp;Installation Service</TextComponent>
                <View style={styles.actionRow}><TouchableOpacity style={styles.calculate} onPress={() => Alert.alert('Estimated price', money(price))}><MaterialCommunityIcons name="calculator" size={19} color="#fff" /><TextComponent style={styles.buttonText}>Calculate</TextComponent></TouchableOpacity><TextComponent style={styles.estimate}>{price > 0 ? money(price) : ''}</TextComponent></View>
                <View style={styles.actionRow}><View style={styles.quantityControl}><TouchableOpacity onPress={() => setQuantity(String(Math.max(1, Number(quantity) - 1)))}><TextComponent style={styles.quantitySign}>−</TextComponent></TouchableOpacity><TextComponent style={styles.quantityValue}>{quantity}</TextComponent><TouchableOpacity onPress={() => setQuantity(String(Number(quantity) + 1))}><TextComponent style={styles.quantitySign}>+</TextComponent></TouchableOpacity></View><TouchableOpacity style={styles.addButton} onPress={addToCart}><MaterialCommunityIcons name="cart-outline" size={20} color="#fff" /><TextComponent style={styles.buttonText}>Add to cart</TextComponent></TouchableOpacity></View>
            </View>
            <View style={styles.card}><TextComponent style={styles.sectionTitle}>Quotation cart</TextComponent>{cart.map((item, index) => <View key={`${item.product_id}-${index}`} style={styles.cartRow}><View style={{flex: 1}}><TextComponent style={styles.itemName}>{item.product_name}</TextComponent><TextComponent style={styles.muted}>{item.description}</TextComponent></View><TextComponent style={styles.itemPrice}>{money(item.price * item.qty)}</TextComponent></View>)}{!cart.length && <TextComponent style={styles.muted}>No items in quotation.</TextComponent>}<TextInput value={discount} onChangeText={setDiscount} keyboardType="numeric" placeholder="Discount" style={styles.input} /><View style={styles.totalRow}><TextComponent>Subtotal</TextComponent><TextComponent>{money(subtotal)}</TextComponent></View><View style={styles.totalRow}><TextComponent style={styles.totalLabel}>Total</TextComponent><TextComponent style={styles.total}>{money(total)}</TextComponent></View><TouchableOpacity style={[styles.saveButton, (!cart.length || saving) && styles.disabled]} disabled={!cart.length || saving} onPress={save}><TextComponent style={styles.buttonText}>{saving ? 'Saving...' : 'Save Quotation'}</TextComponent></TouchableOpacity></View>
            <View style={styles.card}><TextComponent style={styles.sectionTitle}>Saved quotations</TextComponent>{quotes.slice(0, 20).map(quote => <View style={styles.quoteRow} key={quote.id}><View style={{flex: 1}}><TextComponent style={styles.itemName}>{quote.quotation_no}</TextComponent><TextComponent style={styles.muted}>{quote.customer_name || 'No customer'} · {quote.status}</TextComponent></View><TextComponent style={styles.itemPrice}>{money(Number(quote.total))}</TextComponent></View>)}{!quotes.length && <TextComponent style={styles.muted}>No quotations found.</TextComponent>}</View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {padding: 10, paddingBottom: 30},
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 0,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 14,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e8e8e8',
    },
    iconCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ecfeff',
    },
    pageTitle: {
        textAlign: 'center',
        marginBottom: 8,
        color: '#0f172a',
        fontSize: 18,
        fontWeight: '800',
    },
    message: {
        marginTop: 6,
        color: '#64748b',
        fontSize: 13,
    },
    heading: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
    sectionTitle: {fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10},
    label: {fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 10, marginBottom: 5},
    sectionLabel: {fontSize: 18, fontWeight: '800', color: '#252525', textAlign: 'center', marginTop: 10, marginBottom: 7},
    required: {fontSize: 18, color: '#d83c4d'},
    input: {borderWidth: 1, borderColor: '#d6d6d6', borderRadius: 7, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 9, color: '#0f172a'},
    picker: {borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 7, overflow: 'hidden', backgroundColor: '#fff', height: 52, justifyContent: 'center'},
    options: {flexDirection: 'row', flexWrap: 'wrap'},
    choice: {borderWidth: 1, borderColor: '#d5d9df', borderRadius: 2, paddingHorizontal: 13, paddingVertical: 10, marginRight: 6, marginBottom: 6, backgroundColor: '#42ce91', minWidth: 76, alignItems: 'center'},
    choiceActive: {borderColor: '#202020', borderWidth: 2},
    choiceText: {fontSize: 14, color: '#194d3c'},
    choiceTextActive: {fontWeight: '700', color: '#123d2b'},
    row: {flexDirection: 'row', gap: 8},
    half: {flex: 1},
    warning: {color: '#b4232c', fontSize: 15, lineHeight: 21, fontWeight: '800', marginTop: 5, marginBottom: 2},
    actionRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12},
    calculate: {backgroundColor: '#075da5', borderRadius: 5, paddingVertical: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 5},
    addButton: {flex: 1, backgroundColor: '#075da5', borderRadius: 5, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6},
    saveButton: {backgroundColor: '#0f766e', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 12},
    disabled: {opacity: 0.5},
    buttonText: {color: '#fff', fontWeight: '700', fontSize: 13},
    estimate: {color: '#0f766e', fontWeight: '800'},
    quantity: {width: 70, borderWidth: 1, borderColor: '#dbe2ea', borderRadius: 8, backgroundColor: '#fff', padding: 9, textAlign: 'center'},
    quantityControl: {width: 150, height: 48, borderWidth: 1, borderColor: '#1b5c7e', borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#fff'},
    quantitySign: {fontSize: 22, color: '#6b7280'},
    quantityValue: {fontSize: 17, color: '#6b7280'},
    cartRow: {flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eef2f6', paddingVertical: 9},
    quoteRow: {flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eef2f6', paddingVertical: 10},
    itemName: {fontWeight: '700', color: '#0f172a'},
    itemPrice: {fontWeight: '800', color: '#0f766e'},
    muted: {fontSize: 11, color: '#64748b', marginTop: 3},
    totalRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 8},
    totalLabel: {fontWeight: '800'},
    total: {fontSize: 17, fontWeight: '800', color: '#0f766e'},
});

export default POSQuotationTab;
