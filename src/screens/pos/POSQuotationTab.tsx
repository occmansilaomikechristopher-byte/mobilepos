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
    FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextComponent} from '../../components';
import {
    fetchPosProducts,
    fetchPosProductCategories,
    fetchPosQuotations,
    savePosQuotation,
} from '../../utils/posService';
import {
    ALL_PRODUCTS_CATEGORY,
    filterProductsByCategory,
} from '../../utils/posProductGrouping';
import {
    calculateSubtotal,
    calculateDiscount,
    calculateTax,
    calculateTotal,
    calculateQuotationTotals,
    calculateQuotationEstimate,
    formatCurrency,
} from '../../utils/quotationCalculator';

/**
 * Modern Price Quotation Management System
 * For Glass & Aluminum Supply Business
 * 
 * Features:
 * - Glass panel selection with type/thickness
 * - Aluminum bar profile configuration
 * - Accessories management
 * - Automatic price calculations based on dimensions
 * - Labor cost configuration
 * - Discount and tax handling
 * - Professional quotation generation
 */

const choices = {
    unit: ['MM', 'CM', 'IN', 'Ft', 'M'],
    thickness: ['5mm', '6mm', '8mm'],
    glassColor: ['Clear', 'Dark Gray', 'Bronze', 'Reflective', 'Mirror', 'Smoke Glass'],
    aluminumProfile: ['White', 'Black', 'Silver', 'Bronze', 'Gray', 'Dark Gray', 'Gold', 'Champagne'],
};

const POSQuotationTab = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ALL_PRODUCTS_CATEGORY);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [productId, setProductId] = useState(0);
    const [branchId, setBranchId] = useState(0);

    // Product Specifications
    const [unit, setUnit] = useState('IN');
    const design = 'None' as const;
    const [glassThickness, setGlassThickness] = useState(choices.thickness[1]);
    const [glassColor, setGlassColor] = useState(choices.glassColor[0]);
    const [aluminumProfile, setAluminumProfile] = useState(choices.aluminumProfile[0]);
    const [width, setWidth] = useState('48');
    const [height, setHeight] = useState('48');
    const [panelCount, setPanelCount] = useState('1');
    const [basePrice, setBasePrice] = useState('');
    
    // Labor & Customization Options
    const serviceMode = 'Supply Only' as const;
    const selectedAddOns: string[] = [];
    
    // Quotation defaults.
    const discountType = 'fixed';
    const discountValue = '0';
    const taxPercentage = '0';
    
    // UI State
    const [cart, setCart] = useState<any[]>([]);
    const [calculatedInputKey, setCalculatedInputKey] = useState<string | null>(null);
    const [priceError, setPriceError] = useState('');
    const [lineItemPriceOverrides, setLineItemPriceOverrides] = useState<Record<string, string>>({});
    const [lineItems, setLineItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedQuoteIndex, setExpandedQuoteIndex] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const branchId = Number(await AsyncStorage.getItem('branch_id')) || 0;
                setBranchId(branchId);
                const [items, saved, productCategories] = await Promise.all([
                    fetchPosProducts(branchId),
                    fetchPosQuotations(branchId),
                    fetchPosProductCategories(),
                ]);
                setProducts(items);
                setQuotes(saved);
                setCategories(productCategories);
                if (items[0]) setProductId(Number(items[0].id));
            } catch (error) {
                console.error('Quotation load error:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filteredProducts = useMemo(
        () => filterProductsByCategory(products, selectedCategoryId),
        [products, selectedCategoryId],
    );

    const availableCategories = useMemo(() => {
        if (categories.length > 0) return categories;

        const categoryMap = new Map<string, {id: number; category_name: string}>();
        products.forEach(product => {
            if (product.category_id === null || product.category_id === undefined || !product.category_name) {
                return;
            }
            const id = Number(product.category_id);
            if (Number.isFinite(id)) {
                categoryMap.set(String(id), {id, category_name: product.category_name});
            }
        });
        return Array.from(categoryMap.values());
    }, [categories, products]);

    useEffect(() => {
        if (!filteredProducts.some(item => Number(item.id) === productId)) {
            setProductId(filteredProducts[0] ? Number(filteredProducts[0].id) : 0);
        }
    }, [filteredProducts, productId]);

    const selectedProduct = products.find(item => Number(item.id) === productId);
    
    // Generate line items and calculate prices
    const quotationSummary = useMemo(() => {
        if (!selectedProduct || Number(width) <= 0 || Number(height) <= 0) {
            return {
                lineItems: [],
                areaSqFt: 0,
                subtotal: 0,
                discountAmount: 0,
                taxAmount: 0,
                total: 0,
            };
        }

        const estimate = calculateQuotationEstimate({
            basePrice: Number(basePrice),
            width: Number(width),
            height: Number(height),
            unit: unit as any,
            panelCount: Number(panelCount),
            thickness: Number(glassThickness.replace('mm', '')) as 5 | 6 | 8,
            glassColor: glassColor as any,
            design,
            addOns: selectedAddOns,
            serviceMode,
        });

        // Generate line items
        const items: any[] = [];

        // Glass line item
        items.push({
            id: `glass-1`,
            type: 'glass',
            name: `${glassThickness} ${glassColor} Glass Panel`,
            quantity: Number(panelCount),
            unitPrice: estimate.glassCost / Number(panelCount),
            description: `${width} × ${height} ${unit} | ${estimate.squareFeet.toFixed(2)}ft²`,
            lineTotal: estimate.glassCost,
        });

        // Aluminum line item
        items.push({
            id: `aluminum-1`,
            type: 'aluminum',
            name: `${aluminumProfile} - Aluminum Bar`,
            quantity: 1,
            unitPrice: estimate.aluminumCost,
            description: `Perimeter: ${(estimate.perimeterMeters * 3.28084).toFixed(2)} ft`,
            lineTotal: estimate.aluminumCost,
        });

        const pricedItems = items.map(item => {
            if (lineItemPriceOverrides[item.id] === undefined) return item;

            const unitPrice = Math.max(0, Number(lineItemPriceOverrides[item.id]) || 0);
            return {
                ...item,
                unitPrice,
                lineTotal: unitPrice * item.quantity,
            };
        });

        // Calculate totals
        const subtotal = calculateSubtotal(pricedItems);
        const discountAmount = calculateDiscount(
            subtotal,
            discountType,
            Number(discountValue) || 0,
        );
        const taxAmount = calculateTax(subtotal, Number(taxPercentage) || 0, discountAmount);
        const total = calculateTotal(subtotal, discountAmount, taxAmount);

        return {
            lineItems: pricedItems,
            areaSqFt: estimate.squareFeet,
            subtotal,
            discountAmount,
            taxAmount,
            total,
        };
    }, [
        selectedProduct,
        width,
        height,
        unit,
        design,
        glassThickness,
        glassColor,
        aluminumProfile,
        panelCount,
        basePrice,
        lineItemPriceOverrides,
        serviceMode,
        selectedAddOns,
        discountType,
        discountValue,
        taxPercentage,
    ]);

    const quotationInputKey = JSON.stringify([
        productId, width, height, unit, design, glassThickness, glassColor,
        aluminumProfile, panelCount, basePrice, serviceMode, selectedAddOns,
        discountType, discountValue, taxPercentage,
    ]);
    const isCalculated = calculatedInputKey === quotationInputKey;

    useEffect(() => {
        setLineItemPriceOverrides({});
    }, [quotationInputKey]);

    const emptySummary = {
        lineItems: [],
        areaSqFt: 0,
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        total: 0,
    };
    const displayedSummary = isCalculated ? quotationSummary : emptySummary;

    const calculateQuotation = () => {
        if (!selectedProduct || Number(width) <= 0 || Number(height) <= 0 || Number(panelCount) <= 0) {
            return Alert.alert('Quotation', 'Please select a product and enter valid dimensions.');
        }
        if (Number(basePrice) <= 0) {
            setPriceError('Please enter a valid price before calculating.');
            return;
        }
        setPriceError('');
        setCalculatedInputKey(quotationInputKey);
    };

    const money = (value: number) => formatCurrency(value);

    const cartSummary = useMemo(() => calculateQuotationTotals(
        cart,
        discountType,
        Number(discountValue) || 0,
        Number(taxPercentage) || 0,
    ), [cart, discountType, discountValue, taxPercentage]);

    const addToQuotation = () => {
        if (!isCalculated || !selectedProduct || quotationSummary.total <= 0) {
            return Alert.alert('Quotation', 'Please click Calculate before adding this quotation.');
        }
        
        const quotationItem = {
            product_id: Number(selectedProduct.id),
            product_name: selectedProduct.product_name,
            // Store the raw line amount. Discount and tax apply once to the cart.
            price: quotationSummary.subtotal,
            qty: 1,
            description: `${glassThickness} ${glassColor}, ${width}×${height}${unit}, ${serviceMode}`,
            lineItems: quotationSummary.lineItems,
        };
        
        setCart(items => [...items, quotationItem]);
        Alert.alert('Added', 'Quotation added to cart successfully!');
    };

    const generateQuotationNumber = () => {
        const date = new Date();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000);
        return `QT-${date.getFullYear()}${month}${day}-${random}`;
    };

    const saveQuotation = async () => {
        if (!cart.length || branchId <= 0 || cartSummary.subtotal <= 0) {
            return Alert.alert('Quotation', 'Please add items to your quotation before saving.');
        }

        setSaving(true);
        try {
            const result = await savePosQuotation({
                branch_id: branchId,
                discount: cartSummary.discountAmount,
                tax_percentage: Number(taxPercentage) || 0,
                tax: cartSummary.taxAmount,
                items: cart,
            });

            if (!result?.result) {
                throw new Error(result?.message || 'Unable to save quotation');
            }

            Alert.alert(
                'Quotation Saved',
                `Quotation #${result.quotation_no} saved successfully!`,
            );

            // Reset form
            setCart([]);
            setQuotes(await fetchPosQuotations(branchId));
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Unable to save quotation.');
        } finally {
            setSaving(false);
        }
    };

    const deleteQuotationItem = (index: number) => {
        setCart(items => items.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to clear all items?',
            [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Clear', onPress: () => setCart([]), style: 'destructive'},
            ],
        );
    };

    const renderLineItem = (item: any) => (
        <View style={styles.lineItemBox}>
            <View style={styles.lineItemHeader}>
                <TextComponent style={styles.lineItemName}>{item.name}</TextComponent>
                <TextComponent style={styles.lineItemPrice}>{money(item.lineTotal)}</TextComponent>
            </View>
            <TextComponent style={styles.lineItemDesc}>{item.description}</TextComponent>
            <View style={styles.lineItemFooter}>
                <TextComponent style={styles.lineItemQty}>Qty: {item.quantity}</TextComponent>
                <View style={styles.editablePriceBox}>
                    <TextComponent style={styles.priceCurrency}>₱</TextComponent>
                    <TextInput
                        value={lineItemPriceOverrides[item.id] ?? Number(item.unitPrice).toFixed(2)}
                        onChangeText={value => setLineItemPriceOverrides(current => ({
                            ...current,
                            [item.id]: value,
                        }))}
                        keyboardType="decimal-pad"
                        style={styles.linePriceInput}
                    />
                    <TextComponent style={styles.lineItemUnit}> each</TextComponent>
                </View>
            </View>
        </View>
    );

    const renderCartItem = (item: any, index: number) => (
        <View style={styles.cartItemContainer}>
            <View style={styles.cartItemHeader}>
                <View style={{flex: 1}}>
                    <TextComponent style={styles.cartItemTitle}>{item.product_name}</TextComponent>
                    <TextComponent style={styles.cartItemDesc}>{item.description}</TextComponent>
                </View>
                <TouchableOpacity
                    onPress={() => deleteQuotationItem(index)}
                    style={styles.deleteButton}
                >
                    <MaterialCommunityIcons name="delete" size={18} color="#e74c3c" />
                </TouchableOpacity>
            </View>
            <View style={styles.cartSummary}>
                {item.lineItems?.slice(0, 3).map((lineItem: any) => (
                    <View key={lineItem.id} style={styles.cartLinePreview}>
                        <TextComponent style={styles.cartLineText}>
                            • {lineItem.name}: {money(lineItem.lineTotal)}
                        </TextComponent>
                    </View>
                ))}
                {item.lineItems?.length > 3 && (
                    <TextComponent style={styles.cartLineMore}>
                        + {item.lineItems.length - 3} more items
                    </TextComponent>
                )}
            </View>
            <View style={styles.cartItemFooter}>
                <TextComponent style={styles.cartItemTotal}>{money(item.price)}</TextComponent>
            </View>
        </View>
    );

    const renderSavedQuote = (quote: any, index: number) => (
        <TouchableOpacity
            style={styles.quoteCard}
            onPress={() => setExpandedQuoteIndex(expandedQuoteIndex === index ? null : index)}
        >
            <View style={styles.quoteHeader}>
                <View style={{flex: 1}}>
                    <TextComponent style={styles.quoteNo}>{quote.quotation_no}</TextComponent>
                    <TextComponent style={styles.quoteDetails}>
                        Created quotation
                    </TextComponent>
                </View>
                <TextComponent style={styles.quoteTotal}>{money(Number(quote.total))}</TextComponent>
            </View>
            {expandedQuoteIndex === index && (
                <View style={styles.quoteExpandedContent}>
                    <TextComponent style={styles.quoteMeta}>
                        Subtotal: {money(Number(quote.subtotal))} | Discount: {money(Number(quote.discount))}
                    </TextComponent>
                    <TextComponent style={styles.quoteMeta}>
                        Created: {new Date(quote.created_at).toLocaleDateString('en-PH')}
                    </TextComponent>
                </View>
            )}
        </TouchableOpacity>
    );

    const option = (value: string, active: boolean, onPress: () => void) => (
        <TouchableOpacity
            key={value}
            style={[styles.optionButton, active && styles.optionButtonActive]}
            onPress={onPress}
        >
            <TextComponent style={[styles.optionText, active && styles.optionTextActive]}>
                {value}
            </TextComponent>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#0f766e" size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.headerCard}>
                <TextComponent style={styles.headerTitle}>
                    💼 Price Quotation System
                </TextComponent>
                <TextComponent style={styles.headerSubtitle}>
                    Glass & Aluminum Supply Management
                </TextComponent>
            </View>

            {/* Product Selection */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>🏭 Product Selection</TextComponent>
                <TextComponent style={styles.label}>Category</TextComponent>
                <View style={styles.picker}>
                    <Picker
                        selectedValue={selectedCategoryId}
                        onValueChange={value => setSelectedCategoryId(String(value))}
                    >
                        <Picker.Item label="All Categories" value={ALL_PRODUCTS_CATEGORY} />
                        {availableCategories.map(category => (
                            <Picker.Item
                                key={category.id}
                                label={category.category_name}
                                value={String(category.id)}
                            />
                        ))}
                    </Picker>
                </View>
                <TextComponent style={styles.label}>Product</TextComponent>
                <View style={styles.picker}>
                    <Picker selectedValue={productId} onValueChange={setProductId}>
                        {filteredProducts.length > 0 ? filteredProducts.map(item => (
                            <Picker.Item
                                key={item.id}
                                label={item.product_name}
                                value={Number(item.id)}
                            />
                        )) : (
                            <Picker.Item label="No products in this category" value={0} />
                        )}
                    </Picker>
                </View>
            </View>

            {/* Frame & Glass Options */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>🎨 Frame & Glass Specifications</TextComponent>
                
                <TextComponent style={styles.sectionLabel}>
                    Glass Thickness <TextComponent style={styles.required}>*</TextComponent>
                </TextComponent>
                <View style={styles.picker}>
                    <Picker selectedValue={glassThickness} onValueChange={setGlassThickness}>
                        {choices.thickness.map(type => (
                            <Picker.Item key={type} label={type} value={type} />
                        ))}
                    </Picker>
                </View>

                <TextComponent style={styles.sectionLabel}>
                    Glass Type / Color <TextComponent style={styles.required}>*</TextComponent>
                </TextComponent>
                <View style={styles.optionsGrid}>
                    {choices.glassColor.map(value => option(value, glassColor === value, () => setGlassColor(value)))}
                </View>

                <TextComponent style={styles.sectionLabel}>
                    Aluminum Profile <TextComponent style={styles.required}>*</TextComponent>
                </TextComponent>
                <View style={styles.picker}>
                    <Picker selectedValue={aluminumProfile} onValueChange={setAluminumProfile}>
                        {choices.aluminumProfile.map(profile => (
                            <Picker.Item key={profile} label={profile} value={profile} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Dimensions */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>📐 Dimensions</TextComponent>
                <View style={styles.dimensionsRow}>
                    <View style={styles.dimensionInputGroup}>
                        <TextComponent style={styles.label}>Width (Lapad)</TextComponent>
                        <TextInput
                            value={width}
                            onChangeText={setWidth}
                            keyboardType="numeric"
                            style={styles.input}
                            placeholder="Width"
                        />
                    </View>
                    <View style={styles.dimensionInputGroup}>
                        <TextComponent style={styles.label}>Height (Taas)</TextComponent>
                        <TextInput
                            value={height}
                            onChangeText={setHeight}
                            keyboardType="numeric"
                            style={styles.input}
                            placeholder="Height"
                        />
                    </View>
                </View>

                <TextComponent style={styles.sectionLabel}>
                    Unit <TextComponent style={styles.required}>*</TextComponent>
                </TextComponent>
                <View style={styles.optionsGrid}>
                    {choices.unit.map(value => (
                        <TouchableOpacity
                            key={value}
                            style={[
                                styles.optionButton,
                                unit === value && styles.optionButtonActive,
                            ]}
                            onPress={() => setUnit(value)}
                        >
                            <TextComponent
                                style={[
                                    styles.optionText,
                                    unit === value && styles.optionTextActive,
                                ]}
                            >
                                {value}
                            </TextComponent>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextComponent style={styles.sectionLabel}>
                    Number of Panels
                </TextComponent>
                <View style={styles.quantityInputGroup}>
                    <TouchableOpacity
                        onPress={() => setPanelCount(String(Math.max(1, Number(panelCount) - 1)))}
                        style={styles.quantityButton}
                    >
                        <TextComponent style={styles.quantityButtonText}>−</TextComponent>
                    </TouchableOpacity>
                    <TextInput
                        value={panelCount}
                        onChangeText={setPanelCount}
                        keyboardType="numeric"
                        style={styles.quantityInput}
                    />
                    <TouchableOpacity
                        onPress={() => setPanelCount(String(Number(panelCount) + 1))}
                        style={styles.quantityButton}
                    >
                        <TextComponent style={styles.quantityButtonText}>+</TextComponent>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Line Items Breakdown */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>📋 Cost Breakdown</TextComponent>
                {displayedSummary.lineItems.length > 0 ? (
                    <View>
                        {displayedSummary.lineItems.map((item, idx) => (
                            <View key={`lineitem-${idx}`}>
                                {renderLineItem(item)}
                            </View>
                        ))}
                    </View>
                ) : (
                    <TextComponent style={styles.emptyMessage}>
                        Enter specifications, then tap Calculate to see the cost breakdown
                    </TextComponent>
                )}
            </View>

            {/* Pricing */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>💰 Pricing</TextComponent>
                <TextComponent style={styles.label}>
                    Price per Square Foot <TextComponent style={styles.required}>*</TextComponent>
                </TextComponent>
                <TextInput
                    value={basePrice}
                    onChangeText={value => {
                        setBasePrice(value);
                        if (Number(value) > 0) setPriceError('');
                    }}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    placeholder="Enter price"
                    placeholderTextColor="#94a3b8"
                />
                {!!priceError && (
                    <TextComponent style={styles.inputError}>{priceError}</TextComponent>
                )}
                <TextComponent style={styles.priceHint}>
                    Enter the current price per sq. ft. before tapping Calculate.
                </TextComponent>
            </View>

            {/* Quotations */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>📊 Quotations</TextComponent>
                <View style={[styles.summaryRow, styles.totalSummaryRow]}>
                    <TextComponent style={styles.totalSummaryLabel}>Total:</TextComponent>
                    <TextComponent style={styles.totalSummaryValue}>
                        {money(displayedSummary.total)}
                    </TextComponent>
                </View>

                <TouchableOpacity
                    style={[styles.calculateButton, (!selectedProduct || Number(width) <= 0 || Number(height) <= 0) && styles.buttonDisabled]}
                    onPress={calculateQuotation}
                    disabled={!selectedProduct || Number(width) <= 0 || Number(height) <= 0}
                >
                    <MaterialCommunityIcons name="calculator" size={20} color="#fff" />
                    <TextComponent style={styles.buttonText}>Calculate</TextComponent>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.addToCartButton,
                        (!isCalculated || displayedSummary.total <= 0) && styles.buttonDisabled,
                    ]}
                    onPress={addToQuotation}
                    disabled={!isCalculated || displayedSummary.total <= 0}
                >
                    <MaterialCommunityIcons name="cart-plus" size={20} color="#fff" />
                    <TextComponent style={styles.buttonText}>Add to Quotation</TextComponent>
                </TouchableOpacity>
            </View>

            {/* Cart Items */}
            {cart.length > 0 && (
                <View style={styles.card}>
                    <View style={styles.cartHeader}>
                        <TextComponent style={styles.sectionTitle}>🛒 Quotation Items</TextComponent>
                        <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
                            <TextComponent style={styles.clearButtonText}>Clear All</TextComponent>
                        </TouchableOpacity>
                    </View>
                    {cart.map((item, index) => (
                        <View key={`cart-${index}-${item.id || item.type}`}>
                            {renderCartItem(item, index)}
                        </View>
                    ))}
                </View>
            )}

            {/* Final Total & Save */}
            {cart.length > 0 && (
                <View style={styles.card}>
                    <View style={styles.finalSummaryRow}>
                        <TextComponent style={styles.finalLabel}>Final Total:</TextComponent>
                        <TextComponent style={styles.finalTotal}>
                            {money(cartSummary.total)}
                        </TextComponent>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveQuotationButton, saving && styles.buttonDisabled]}
                        onPress={saveQuotation}
                        disabled={saving}
                    >
                        <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                        <TextComponent style={styles.buttonText}>
                            {saving ? 'Saving...' : 'Save / Submit Quotation'}
                        </TextComponent>
                    </TouchableOpacity>
                </View>
            )}

            {/* Saved Quotations */}
            {quotes.length > 0 && (
                <View style={styles.card}>
                    <TextComponent style={styles.sectionTitle}>📁 Saved Quotations</TextComponent>
                    {quotes.slice(0, 15).map((quote, index) => (
                        <View key={`quote-${quote.id || index}`}>
                            {renderSavedQuote(quote, index)}
                        </View>
                    ))}
                </View>
            )}

            {!cart.length && !quotes.length && (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="inbox-outline" size={60} color="#bdc3c7" />
                    <TextComponent style={styles.emptyStateText}>
                        No quotations yet
                    </TextComponent>
                    <TextComponent style={styles.emptyStateSubtext}>
                        Create your first quotation above
                    </TextComponent>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    // Layout
    screen: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    content: {
        padding: 12,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Cards & Containers
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#ecf0f3',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    headerCard: {
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        // Simulate gradient with background
        backgroundColor: '#0f766e',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#d0f1e8',
        fontWeight: '500',
    },

    // Typography
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 12,
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    required: {
        color: '#ef4444',
        fontSize: 14,
    },
    emptyMessage: {
        fontSize: 13,
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 16,
    },
    priceHint: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    inputError: {
        fontSize: 12,
        color: '#dc2626',
        marginBottom: 4,
    },

    // Inputs
    input: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 14,
        paddingVertical: 11,
        color: '#0f172a',
        fontSize: 14,
        fontWeight: '500',
        marginVertical: 6,
    },
    picker: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
        height: 52,
        justifyContent: 'center',
        marginVertical: 8,
    },

    // Options & Buttons
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginVertical: 10,
    },
    optionButton: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        backgroundColor: '#f1f5f9',
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionButtonActive: {
        borderColor: '#0f766e',
        backgroundColor: '#d0f1e8',
        borderWidth: 2,
    },
    optionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        textAlign: 'center',
    },
    optionTextActive: {
        color: '#0f766e',
        fontWeight: '700',
    },

    // Dimensions
    dimensionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginVertical: 10,
    },
    dimensionInputGroup: {
        flex: 1,
    },

    // Quantity
    quantityInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        marginVertical: 10,
        overflow: 'hidden',
    },
    quantityButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#ecfeff',
        borderRightWidth: 1.5,
        borderRightColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f766e',
    },
    quantityInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: '#0f172a',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Switches
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    switchLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
    },

    // Discount Type
    discountTypeRow: {
        flexDirection: 'row',
        gap: 10,
        marginVertical: 10,
    },
    discountTypeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    discountTypeButtonActive: {
        borderColor: '#0f766e',
        backgroundColor: '#d0f1e8',
        borderWidth: 2,
    },
    discountTypeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },

    // Line Items
    lineItemBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#0f766e',
    },
    lineItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    lineItemName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
    },
    lineItemPrice: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f766e',
    },
    lineItemDesc: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    lineItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lineItemQty: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },
    lineItemUnit: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0f766e',
    },
    editablePriceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0f766e',
        borderRadius: 6,
        paddingLeft: 6,
        backgroundColor: '#ffffff',
    },
    priceCurrency: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0f766e',
    },
    linePriceInput: {
        minWidth: 70,
        paddingHorizontal: 5,
        paddingVertical: 4,
        color: '#0f172a',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'right',
    },
    readOnlyLinePrice: {
        opacity: 0.8,
    },

    // Summary
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    totalSummaryRow: {
        backgroundColor: '#ecfeff',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 0,
        marginTop: 6,
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    totalSummaryLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f766e',
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
    },
    totalSummaryValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f766e',
    },

    // Cart
    cartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cartItemContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cartItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cartItemTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
    },
    cartItemDesc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 3,
    },
    deleteButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#fee2e2',
    },
    cartSummary: {
        backgroundColor: '#ffffff',
        borderRadius: 6,
        padding: 8,
        marginVertical: 8,
    },
    cartLinePreview: {
        paddingVertical: 3,
    },
    cartLineText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
    },
    cartLineMore: {
        fontSize: 11,
        color: '#0f766e',
        fontWeight: '600',
        marginTop: 3,
        fontStyle: 'italic',
    },
    cartItemFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    cartItemTotal: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f766e',
    },

    // Quotes
    quoteCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    quoteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quoteNo: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
    },
    quoteDetails: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 3,
    },
    quoteTotal: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f766e',
    },
    quoteExpandedContent: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    quoteMeta: {
        fontSize: 12,
        color: '#64748b',
        marginVertical: 3,
    },

    // Buttons
    addToCartButton: {
        backgroundColor: '#075da5',
        borderRadius: 8,
        paddingVertical: 13,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
    },
    calculateButton: {
        backgroundColor: '#075da5',
        borderRadius: 8,
        paddingVertical: 13,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
    },
    saveQuotationButton: {
        backgroundColor: '#0f766e',
        borderRadius: 8,
        paddingVertical: 13,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
    },
    clearButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#fee2e2',
    },
    clearButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#dc2626',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 13,
    },
    buttonDisabled: {
        opacity: 0.5,
    },

    // Final Summary
    finalSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#d0f1e8',
        marginBottom: 14,
    },
    finalLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    finalTotal: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f766e',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 8,
    },
});

export default POSQuotationTab;
