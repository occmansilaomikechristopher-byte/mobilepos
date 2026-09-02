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
    Switch,
    FlatList,
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
import {
    convertToSquareMeters,
    calculatePerimeter,
    calculateGlassCost,
    calculateAluminumCost,
    calculateLaborCost,
    calculateAccessoriesCost,
    calculateSubtotal,
    calculateDiscount,
    calculateTax,
    calculateTotal,
    formatCurrency,
    generateLineItems,
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
    frame: ['UPVC White Frame', 'UPVC Brown Frame'],
    unit: ['MM', 'CM', 'IN', 'Ft', 'M'],
    design: ['None', 'French Type Design'],
    glassType: ['6mm Clear', '8mm Clear', '6mm Tinted', '8mm Tinted', '6mm Reflective', 'Tempered'],
    aluminumProfile: ['Standard Frame', 'Heavy Duty Frame', 'Slim Frame', 'Custom Profile'],
};

const laborConfig = {
    hourlyRate: 350,
    installationFeePerPanel: 500,
    designCustomizationFee: 1500,
    measurementFee: 300,
};

const POSQuotationTab = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [productId, setProductId] = useState(0);

    // Product Specifications
    const [frame, setFrame] = useState(choices.frame[0]);
    const [unit, setUnit] = useState('IN');
    const [design, setDesign] = useState('None');
    const [glassType, setGlassType] = useState(choices.glassType[0]);
    const [aluminumProfile, setAluminumProfile] = useState(choices.aluminumProfile[0]);
    const [width, setWidth] = useState('48');
    const [height, setHeight] = useState('48');
    const [panelCount, setPanelCount] = useState('1');
    
    // Labor & Customization Options
    const [installationRequired, setInstallationRequired] = useState(false);
    const [customDesignRequired, setCustomDesignRequired] = useState(false);
    const [measurementRequired, setMeasurementRequired] = useState(false);
    
    // Pricing Configuration
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
    const [discountValue, setDiscountValue] = useState('0');
    const [taxPercentage, setTaxPercentage] = useState('12');
    
    // UI State
    const [cart, setCart] = useState<any[]>([]);
    const [lineItems, setLineItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedQuoteIndex, setExpandedQuoteIndex] = useState<number | null>(null);

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
    
    // Generate line items and calculate prices
    const quotationSummary = useMemo(() => {
        if (!selectedProduct || Number(width) <= 0 || Number(height) <= 0) {
            return {
                lineItems: [],
                subtotal: 0,
                discountAmount: 0,
                taxAmount: 0,
                total: 0,
            };
        }

        // Calculate areas and perimeters
        const squareMeters = convertToSquareMeters(
            Number(width),
            Number(height),
            unit as any,
        );
        const perimeterMeters = calculatePerimeter(
            Number(width),
            Number(height),
            unit as any,
        );

        // Mock glass and aluminum pricing (would come from database in real app)
        const glassPrice = Number(selectedProduct.unit_price || 0);
        const aluminumPrice = glassPrice * 0.5;

        // Generate line items
        const items: any[] = [];

        // Glass line item
        const glassCost = glassPrice * squareMeters * (design !== 'None' ? 1.1 : 1.0);
        items.push({
            id: `glass-1`,
            type: 'glass',
            name: `${glassType} Glass Panel`,
            quantity: Number(panelCount),
            unitPrice: glassCost / Number(panelCount),
            description: `${width} × ${height} ${unit} | ${squareMeters.toFixed(2)}m²`,
            lineTotal: glassCost,
        });

        // Aluminum line item
        const aluminumCost = aluminumPrice * perimeterMeters;
        items.push({
            id: `aluminum-1`,
            type: 'aluminum',
            name: `${aluminumProfile} - Aluminum Bar`,
            quantity: 1,
            unitPrice: aluminumCost,
            description: `Perimeter: ${perimeterMeters.toFixed(2)}m`,
            lineTotal: aluminumCost,
        });

        // Labor costs
        const laborCosts = calculateLaborCost(
            laborConfig,
            Number(panelCount),
            installationRequired,
            customDesignRequired,
            measurementRequired,
        );

        if (laborCosts.installation > 0) {
            items.push({
                id: 'labor-installation',
                type: 'labor',
                name: 'Installation Labor',
                quantity: Number(panelCount),
                unitPrice: laborConfig.installationFeePerPanel,
                description: `Professional installation service`,
                lineTotal: laborCosts.installation,
            });
        }

        if (laborCosts.design > 0) {
            items.push({
                id: 'labor-design',
                type: 'labor',
                name: 'Design Customization',
                quantity: 1,
                unitPrice: laborConfig.designCustomizationFee,
                description: `Custom design and consultation`,
                lineTotal: laborCosts.design,
            });
        }

        if (laborCosts.measurement > 0) {
            items.push({
                id: 'labor-measurement',
                type: 'labor',
                name: 'Measurement & Site Visit',
                quantity: 1,
                unitPrice: laborConfig.measurementFee,
                description: `On-site measurement and assessment`,
                lineTotal: laborCosts.measurement,
            });
        }

        // Calculate totals
        const subtotal = calculateSubtotal(items);
        const discountAmount = calculateDiscount(
            subtotal,
            discountType,
            Number(discountValue) || 0,
        );
        const taxAmount = calculateTax(subtotal, Number(taxPercentage) || 0, discountAmount);
        const total = calculateTotal(subtotal, discountAmount, taxAmount);

        return {
            lineItems: items,
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
        glassType,
        aluminumProfile,
        panelCount,
        installationRequired,
        customDesignRequired,
        measurementRequired,
        discountType,
        discountValue,
        taxPercentage,
    ]);

    const money = (value: number) => formatCurrency(value);

    const addToQuotation = () => {
        if (!selectedProduct || quotationSummary.total <= 0) {
            return Alert.alert('Quotation', 'Please select a product and enter valid dimensions.');
        }
        
        const quotationItem = {
            product_id: Number(selectedProduct.id),
            product_name: selectedProduct.product_name,
            price: quotationSummary.total,
            qty: 1,
            description: `${frame}, ${glassType}, ${width}×${height}${unit}, ${design}`,
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
        if (!cart.length || quotationSummary.total <= 0) {
            return Alert.alert('Quotation', 'Please add items to your quotation before saving.');
        }

        setSaving(true);
        try {
            const result = await savePosQuotation({
                customer_name: 'Walk-in Customer',
                discount: quotationSummary.discountAmount,
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
            setQuotes(await fetchPosQuotations());
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
                <TextComponent style={styles.lineItemUnit}>
                    {money(item.unitPrice)} each
                </TextComponent>
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
                        {quote.customer_name || 'No Customer'} • {quote.status}
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
        <TouchableOpacity key={value} style={[styles.choice, active && styles.choiceActive]} onPress={onPress}>
            <TextComponent style={[styles.choiceText, active && styles.choiceTextActive]}>{value}</TextComponent>
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
                <TextComponent style={styles.label}>Product</TextComponent>
                <View style={styles.picker}>
                    <Picker selectedValue={productId} onValueChange={setProductId}>
                        {products.map(item => (
                            <Picker.Item
                                key={item.id}
                                label={item.product_name}
                                value={Number(item.id)}
                            />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Frame & Glass Options */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>🎨 Frame & Glass Specifications</TextComponent>
                
                <TextComponent style={styles.sectionLabel}>
                    Frame Color <TextComponent style={styles.required}>*</TextComponent>
                </TextComponent>
                <View style={styles.optionsGrid}>
                    {choices.frame.map(value => (
                        <TouchableOpacity
                            key={value}
                            style={[
                                styles.optionButton,
                                frame === value && styles.optionButtonActive,
                            ]}
                            onPress={() => setFrame(value)}
                        >
                            <TextComponent
                                style={[
                                    styles.optionText,
                                    frame === value && styles.optionTextActive,
                                ]}
                            >
                                {value}
                            </TextComponent>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextComponent style={styles.sectionLabel}>
                    Glass Type <TextComponent style={styles.required}>*</TextComponent>
                </TextComponent>
                <View style={styles.picker}>
                    <Picker selectedValue={glassType} onValueChange={setGlassType}>
                        {choices.glassType.map(type => (
                            <Picker.Item key={type} label={type} value={type} />
                        ))}
                    </Picker>
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

            {/* Design & Customization */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>✨ Design & Customization</TextComponent>
                
                <TextComponent style={styles.sectionLabel}>Design Option</TextComponent>
                <View style={styles.optionsGrid}>
                    {choices.design.map(value => (
                        <TouchableOpacity
                            key={value}
                            style={[
                                styles.optionButton,
                                design === value && styles.optionButtonActive,
                            ]}
                            onPress={() => setDesign(value)}
                        >
                            <TextComponent
                                style={[
                                    styles.optionText,
                                    design === value && styles.optionTextActive,
                                ]}
                            >
                                {value}
                            </TextComponent>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextComponent style={styles.sectionLabel}>Labor & Services</TextComponent>
                <View style={styles.switchRow}>
                    <TextComponent style={styles.switchLabel}>Installation Required</TextComponent>
                    <Switch
                        value={installationRequired}
                        onValueChange={setInstallationRequired}
                        trackColor={{false: '#ccc', true: '#81c784'}}
                        thumbColor={installationRequired ? '#4caf50' : '#f1f1f1'}
                    />
                </View>

                <View style={styles.switchRow}>
                    <TextComponent style={styles.switchLabel}>Custom Design Fee</TextComponent>
                    <Switch
                        value={customDesignRequired}
                        onValueChange={setCustomDesignRequired}
                        trackColor={{false: '#ccc', true: '#81c784'}}
                        thumbColor={customDesignRequired ? '#4caf50' : '#f1f1f1'}
                    />
                </View>

                <View style={styles.switchRow}>
                    <TextComponent style={styles.switchLabel}>Measurement Service</TextComponent>
                    <Switch
                        value={measurementRequired}
                        onValueChange={setMeasurementRequired}
                        trackColor={{false: '#ccc', true: '#81c784'}}
                        thumbColor={measurementRequired ? '#4caf50' : '#f1f1f1'}
                    />
                </View>
            </View>

            {/* Pricing Configuration */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>💰 Pricing Configuration</TextComponent>

                <TextComponent style={styles.label}>Discount Type</TextComponent>
                <View style={styles.discountTypeRow}>
                    <TouchableOpacity
                        style={[
                            styles.discountTypeButton,
                            discountType === 'fixed' && styles.discountTypeButtonActive,
                        ]}
                        onPress={() => setDiscountType('fixed')}
                    >
                        <TextComponent style={styles.discountTypeText}>Fixed (₱)</TextComponent>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.discountTypeButton,
                            discountType === 'percentage' && styles.discountTypeButtonActive,
                        ]}
                        onPress={() => setDiscountType('percentage')}
                    >
                        <TextComponent style={styles.discountTypeText}>Percentage (%)</TextComponent>
                    </TouchableOpacity>
                </View>

                <TextComponent style={styles.label}>
                    Discount Value ({discountType === 'fixed' ? '₱' : '%'})
                </TextComponent>
                <TextInput
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    placeholder="0"
                />

                <TextComponent style={styles.label}>Tax Percentage (%)</TextComponent>
                <TextInput
                    value={taxPercentage}
                    onChangeText={setTaxPercentage}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    placeholder="12"
                />
            </View>

            {/* Line Items Breakdown */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>📋 Cost Breakdown</TextComponent>
                {quotationSummary.lineItems.length > 0 ? (
                    <View>
                        {quotationSummary.lineItems.map((item, idx) => (
                            <View key={`lineitem-${idx}`}>
                                {renderLineItem(item)}
                            </View>
                        ))}
                    </View>
                ) : (
                    <TextComponent style={styles.emptyMessage}>
                        Enter dimensions to see cost breakdown
                    </TextComponent>
                )}
            </View>

            {/* Quotation Summary */}
            <View style={styles.card}>
                <TextComponent style={styles.sectionTitle}>📊 Quotation Summary</TextComponent>
                <View style={styles.summaryRow}>
                    <TextComponent style={styles.summaryLabel}>Subtotal:</TextComponent>
                    <TextComponent style={styles.summaryValue}>
                        {money(quotationSummary.subtotal)}
                    </TextComponent>
                </View>
                <View style={styles.summaryRow}>
                    <TextComponent style={styles.summaryLabel}>Discount:</TextComponent>
                    <TextComponent style={styles.summaryValue}>
                        −{money(quotationSummary.discountAmount)}
                    </TextComponent>
                </View>
                <View style={styles.summaryRow}>
                    <TextComponent style={styles.summaryLabel}>Tax ({taxPercentage}%):</TextComponent>
                    <TextComponent style={styles.summaryValue}>
                        +{money(quotationSummary.taxAmount)}
                    </TextComponent>
                </View>
                <View style={[styles.summaryRow, styles.totalSummaryRow]}>
                    <TextComponent style={styles.totalSummaryLabel}>Total:</TextComponent>
                    <TextComponent style={styles.totalSummaryValue}>
                        {money(quotationSummary.total)}
                    </TextComponent>
                </View>

                <TouchableOpacity
                    style={[
                        styles.addToCartButton,
                        (!selectedProduct || quotationSummary.total <= 0) && styles.buttonDisabled,
                    ]}
                    onPress={addToQuotation}
                    disabled={!selectedProduct || quotationSummary.total <= 0}
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
                            {money(cart.reduce((sum, item) => sum + item.price, 0))}
                        </TextComponent>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveQuotationButton, saving && styles.buttonDisabled]}
                        onPress={saveQuotation}
                        disabled={saving}
                    >
                        <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                        <TextComponent style={styles.buttonText}>
                            {saving ? 'Saving...' : 'Save Quotation'}
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
        backgroundColor: 'linear-gradient(135deg, #0f766e 0%, #14a085 100%)',
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
