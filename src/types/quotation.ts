// Glass & Aluminum Supply Quotation Types

export interface MaterialPrice {
    id: number;
    name: string;
    unit: string;
    pricePerUnit: number;
    lastUpdated: string;
}

export interface GlassPanel extends MaterialPrice {
    type: 'Clear' | 'Tinted' | 'Reflective' | 'Frosted' | 'Tempered';
    thickness: number; // in mm
}

export interface AluminumBar extends MaterialPrice {
    type: 'Frame' | 'Channel' | 'Angle' | 'Flat';
    profile: string;
}

export interface Accessory extends MaterialPrice {
    category: string;
    description: string;
}

export interface LaborConfig {
    hourlyRate: number;
    installationFeePerPanel: number;
    designCustomizationFee: number;
    measurementFee: number;
}

export interface QuotationDimensions {
    width: number;
    height: number;
    unit: 'MM' | 'CM' | 'IN' | 'Ft' | 'M';
}

export interface QuotationLineItem {
    id: string;
    type: 'glass' | 'aluminum' | 'accessory' | 'labor' | 'custom';
    name: string;
    quantity: number;
    unitPrice: number;
    description: string;
    lineTotal: number;
}

export interface QuotationTemplate {
    id: number;
    name: string;
    description: string;
    items: QuotationLineItem[];
    laborIncluded: boolean;
    discountPercentage: number;
}

export interface CustomerQuotation {
    id: number;
    quotationNo: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    dimensions: QuotationDimensions;
    glassType: GlassPanel;
    aluminumType: AluminumBar;
    accessories: Accessory[];
    laborCost: number;
    customCharges: {
        design: number;
        installation: number;
        measurement: number;
        other: number;
    };
    lineItems: QuotationLineItem[];
    subtotal: number;
    discount: {
        type: 'fixed' | 'percentage';
        value: number;
        amount: number;
    };
    tax: {
        percentage: number;
        amount: number;
    };
    total: number;
    notes: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'completed';
    createdAt: string;
    expiryDate?: string;
    validityDays?: number;
}

export interface QuotationCalculationContext {
    glassArea: number; // in square meters or appropriate unit
    aluminumLength: number;
    laborHours: number;
    customizationFactors: {
        frameType: string;
        design: string;
        installationRequired: boolean;
    };
}
