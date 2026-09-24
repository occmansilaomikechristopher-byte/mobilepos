// Quotation Calculation Engine for Glass & Aluminum Supply

import {
    QuotationDimensions,
    GlassPanel,
    AluminumBar,
    Accessory,
    LaborConfig,
    QuotationLineItem,
} from '../types/quotation';

/**
 * Convert dimensions to square meters
 */
export const convertToSquareMeters = (
    width: number,
    height: number,
    unit: 'MM' | 'CM' | 'IN' | 'Ft' | 'M',
): number => {
    const conversion: Record<string, number> = {
        MM: 0.000001,
        CM: 0.0001,
        IN: 0.00064516,
        Ft: 0.092903,
        M: 1,
    };
    return width * height * conversion[unit];
};

/**
 * Convert dimensions to square feet for glass pricing.
 * Dimensions are first converted to inches, then divided by 144 square inches
 * per square foot (for example, 48 × 48 inches = 16 square feet).
 */
export const convertToSquareFeet = (
    width: number,
    height: number,
    unit: 'MM' | 'CM' | 'IN' | 'Ft' | 'M',
): number => {
    const conversionToInches: Record<string, number> = {
        MM: 1 / 25.4,
        CM: 1 / 2.54,
        IN: 1,
        Ft: 12,
        M: 39.37007874015748,
    };
    const inchesPerUnit = conversionToInches[unit];
    return (width * inchesPerUnit * height * inchesPerUnit) / 144;
};

/**
 * Convert dimensions to meters (for linear measurements)
 */
export const convertToMeters = (
    length: number,
    unit: 'MM' | 'CM' | 'IN' | 'Ft' | 'M',
): number => {
    const conversion: Record<string, number> = {
        MM: 0.001,
        CM: 0.01,
        IN: 0.0254,
        Ft: 0.3048,
        M: 1,
    };
    return length * conversion[unit];
};

/**
 * Calculate glass cost based on panel type and area
 */
export const calculateGlassCost = (
    glassPanel: GlassPanel,
    squareFeet: number,
): number => {
    const typePremium: Record<string, number> = {
        Clear: 1.0,
        Tinted: 1.2,
        Reflective: 1.5,
        Frosted: 1.3,
        Tempered: 1.4,
    };
    const premium = typePremium[glassPanel.type] || 1.0;
    return glassPanel.pricePerUnit * squareFeet * premium;
};

/**
 * Calculate aluminum cost based on profile and length
 */
export const calculateAluminumCost = (
    aluminumBar: AluminumBar,
    perimeterMeters: number,
): number => {
    const profileMultiplier: Record<string, number> = {
        Frame: 1.0,
        Channel: 0.8,
        Angle: 0.9,
        Flat: 0.7,
    };
    const multiplier = profileMultiplier[aluminumBar.type] || 1.0;
    return aluminumBar.pricePerUnit * perimeterMeters * multiplier;
};

/**
 * Calculate perimeter from dimensions
 */
export const calculatePerimeter = (
    width: number,
    height: number,
    unit: 'MM' | 'CM' | 'IN' | 'Ft' | 'M',
): number => {
    const conversion: Record<string, number> = {
        MM: 0.001,
        CM: 0.01,
        IN: 0.0254,
        Ft: 0.3048,
        M: 1,
    };
    const factor = conversion[unit];
    return (2 * (width + height)) * factor;
};

/**
 * Calculate total accessories cost
 */
export const calculateAccessoriesCost = (accessories: Accessory[]): number => {
    return accessories.reduce((sum, acc) => sum + acc.pricePerUnit, 0);
};

/**
 * Calculate labor cost
 */
export const calculateLaborCost = (
    laborConfig: LaborConfig,
    panelCount: number,
    installationRequired: boolean,
    customDesign: boolean,
    measurementRequired: boolean,
): {
    installation: number;
    design: number;
    measurement: number;
    total: number;
} => {
    const installation = installationRequired
        ? panelCount * laborConfig.installationFeePerPanel
        : 0;
    const design = customDesign ? laborConfig.designCustomizationFee : 0;
    const measurement = measurementRequired ? laborConfig.measurementFee : 0;

    return {
        installation,
        design,
        measurement,
        total: installation + design + measurement,
    };
};

/**
 * Generate quotation line items
 */
export const generateLineItems = (
    glassPanel: GlassPanel,
    aluminumBar: AluminumBar,
    accessories: Accessory[],
    dimensions: QuotationDimensions,
    laborConfig: LaborConfig,
    panelCount: number,
    customDesign: boolean,
    installationRequired: boolean,
): QuotationLineItem[] => {
    const items: QuotationLineItem[] = [];
    const squareFeet = convertToSquareFeet(dimensions.width, dimensions.height, dimensions.unit);
    const perimeterMeters = calculatePerimeter(dimensions.width, dimensions.height, dimensions.unit);

    // Glass item
    const glassCost = calculateGlassCost(glassPanel, squareFeet);
    items.push({
        id: `glass-${glassPanel.id}`,
        type: 'glass',
        name: `${glassPanel.type} Glass Panel (${glassPanel.thickness}mm)`,
        quantity: panelCount,
        unitPrice: glassCost / panelCount,
        description: `${dimensions.width} × ${dimensions.height} ${dimensions.unit}, ${squareFeet.toFixed(2)}ft²`,
        lineTotal: glassCost,
    });

    // Aluminum item
    const aluminumCost = calculateAluminumCost(aluminumBar, perimeterMeters);
    items.push({
        id: `aluminum-${aluminumBar.id}`,
        type: 'aluminum',
        name: `${aluminumBar.type} Aluminum Bar (${aluminumBar.profile})`,
        quantity: 1,
        unitPrice: aluminumCost,
        description: `Perimeter: ${perimeterMeters.toFixed(2)}m`,
        lineTotal: aluminumCost,
    });

    // Accessories
    accessories.forEach((acc) => {
        items.push({
            id: `accessory-${acc.id}`,
            type: 'accessory',
            name: acc.name,
            quantity: 1,
            unitPrice: acc.pricePerUnit,
            description: acc.description,
            lineTotal: acc.pricePerUnit,
        });
    });

    // Labor costs
    const laborCosts = calculateLaborCost(
        laborConfig,
        panelCount,
        installationRequired,
        customDesign,
        true,
    );

    if (laborCosts.installation > 0) {
        items.push({
            id: 'labor-installation',
            type: 'labor',
            name: 'Installation Labor',
            quantity: panelCount,
            unitPrice: laborConfig.installationFeePerPanel,
            description: `Installation for ${panelCount} panel(s)`,
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
            description: 'Custom design fee',
            lineTotal: laborCosts.design,
        });
    }

    if (laborCosts.measurement > 0) {
        items.push({
            id: 'labor-measurement',
            type: 'labor',
            name: 'Measurement & Consultation',
            quantity: 1,
            unitPrice: laborConfig.measurementFee,
            description: 'On-site measurement and consultation',
            lineTotal: laborCosts.measurement,
        });
    }

    return items;
};

/**
 * Calculate subtotal from line items
 */
export const calculateSubtotal = (items: QuotationLineItem[]): number => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
};

/**
 * Calculate discounted amount
 */
export const calculateDiscount = (
    subtotal: number,
    discountType: 'fixed' | 'percentage',
    discountValue: number,
): number => {
    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    const safeValue = Math.max(0, Number(discountValue) || 0);
    if (discountType === 'fixed') {
        return Math.min(safeValue, safeSubtotal);
    }
    return (safeSubtotal * Math.min(safeValue, 100)) / 100;
};

/**
 * Calculate tax
 */
export const calculateTax = (
    subtotal: number,
    taxPercentage: number,
    discountAmount: number,
): number => {
    const taxableAmount = Math.max(0, (Number(subtotal) || 0) - (Number(discountAmount) || 0));
    return (taxableAmount * Math.max(0, Number(taxPercentage) || 0)) / 100;
};

/**
 * Calculate total with all components
 */
export const calculateTotal = (
    subtotal: number,
    discountAmount: number,
    taxAmount: number,
): number => {
    return Math.max(0, (Number(subtotal) || 0) - (Number(discountAmount) || 0) + (Number(taxAmount) || 0));
};

export interface QuotationTotalLine {
    price: number;
    qty: number;
}

export interface QuotationTotals {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
}

export type GlassThickness = 5 | 6;
export type QuotationAluminumProfile = 'Black' | 'White';
export type GlassColor =
    | 'Clear Glass'
    | 'Bronze Glass'
    | 'Dark Gray Glass'
    | 'Reflective Blue'
    | 'Reflective Green'
    | 'Reflective Bronze'
    | 'Reflective Dark Gray'
    | 'Reflective Gold'
    // Keep legacy values valid for previously saved quotations.
    | 'Clear'
    | 'Dark Gray'
    | 'Bronze'
    | 'Reflective'
    | 'Mirror'
    | 'Smoke Glass';
export type QuotationServiceMode = 'Supply Only' | 'Delivery & Installation';

export interface QuotationPricingEntry {
    width: number;
    height: number;
    unit: QuotationDimensions['unit'];
    glassColor: GlassColor;
    thickness: GlassThickness;
    aluminumProfile: QuotationAluminumProfile;
    pricePerSqFt: number;
}

export interface CombinedQuotationPriceOptions {
    width: number;
    height: number;
    unit: QuotationDimensions['unit'];
    panelCount: number;
    glassColor?: GlassColor;
    thickness: number;
    aluminumProfile?: string;
    pricing: QuotationPricingEntry[];
}

export interface CombinedQuotationPrice {
    areaSqFt: number;
    pricePerSqFt: number;
    materialCost: number;
    pricingEntry: QuotationPricingEntry;
}

const normalizeNumber = (value: number): string => Number(value).toFixed(4);

export const createQuotationPricingKey = (
    width: number,
    height: number,
    unit: QuotationDimensions['unit'],
    glassColor: string | undefined,
    _thickness: number,
    aluminumProfile: string | undefined,
): string => {
    const dimensions = [Number(width), Number(height)].sort((a, b) => a - b);
    return [
        unit,
        normalizeNumber(dimensions[0]),
        normalizeNumber(dimensions[1]),
        glassColor || '',
        aluminumProfile || '',
    ].join('|');
};

export const calculateCombinedQuotationPrice = ({
    width,
    height,
    unit,
    panelCount,
    glassColor,
    thickness,
    aluminumProfile,
    pricing,
}: CombinedQuotationPriceOptions): CombinedQuotationPrice => {
    if (![5, 6].includes(Number(thickness))) {
        throw new Error('Only 5mm and 6mm glass are supported.');
    }
    if (aluminumProfile && !['Black', 'White'].includes(aluminumProfile)) {
        throw new Error('Only Black and White aluminum profiles are supported.');
    }

    const safeWidth = Number(width);
    const safeHeight = Number(height);
    const safePanels = Number(panelCount);
    if (!Number.isFinite(safeWidth) || !Number.isFinite(safeHeight) || safeWidth <= 0 || safeHeight <= 0) {
        throw new Error('Width and height must be greater than zero.');
    }
    if (!Number.isFinite(safePanels) || safePanels <= 0) {
        throw new Error('Panel count must be greater than zero.');
    }

    // Thickness remains a separate customer selection, but both 5mm and 6mm
    // use the same configured rate. Pricing varies only by glass color/profile.
    const entry = pricing.find(item => createQuotationPricingKey(
        item.width,
        item.height,
        item.unit,
        item.glassColor,
        item.thickness,
        item.aluminumProfile,
    ) === createQuotationPricingKey(
        safeWidth,
        safeHeight,
        unit,
        glassColor || '',
        Number(thickness),
        aluminumProfile || '',
    ));

    const baseEntry = !glassColor && !aluminumProfile
        ? pricing.find(item => createQuotationPricingKey(
            item.width,
            item.height,
            item.unit,
            '',
            item.thickness,
            '',
        ) === createQuotationPricingKey(
            safeWidth,
            safeHeight,
            unit,
            '',
            Number(thickness),
            '',
        ))
        : undefined;

    // Matrix prices are stored using 48x48 as the reference size. If the
    // selected dimensions do not have an exact row, reuse the matching
    // reference rate and apply it to the actual calculated area.
    const referenceEntry = entry || baseEntry || pricing.find(item =>
        item.unit === unit &&
        item.glassColor === (glassColor || '') &&
        item.aluminumProfile === (aluminumProfile || '')
    );

    const selectedEntry = referenceEntry;
    if (!selectedEntry || !Number.isFinite(Number(selectedEntry.pricePerSqFt)) || Number(selectedEntry.pricePerSqFt) <= 0) {
        throw new Error('No configured quotation price is available for this size and selection.');
    }

    const areaSqFt = convertToSquareFeet(safeWidth, safeHeight, unit);
    const pricePerSqFt = Number(selectedEntry.pricePerSqFt);
    return {
        areaSqFt,
        pricePerSqFt,
        materialCost: areaSqFt * pricePerSqFt * safePanels,
        pricingEntry: selectedEntry,
    };
};

export interface QuotationEstimateOptions {
    /** Current configured glass price per square foot. */
    basePrice: number;
    width: number;
    height: number;
    unit: QuotationDimensions['unit'];
    panelCount: number;
    thickness: GlassThickness;
    glassColor: GlassColor;
    design?: string;
    addOns?: string[];
    serviceMode?: QuotationServiceMode;
    measurementRequired?: boolean;
}

export interface QuotationEstimate {
    glassCost: number;
    aluminumCost: number;
    designCost: number;
    addOnCost: number;
    serviceCost: number;
    measurementCost: number;
    subtotal: number;
    squareFeet: number;
    perimeterMeters: number;
}

/**
 * Estimate a GV Aluminum and Glass Supply window quotation from the selected
 * product, material options, dimensions, and service choices.
 */
export const calculateQuotationEstimate = ({
    basePrice,
    width,
    height,
    unit,
    panelCount,
    thickness,
    glassColor,
    design = 'None',
    addOns = [],
    serviceMode = 'Supply Only',
    measurementRequired = false,
}: QuotationEstimateOptions): QuotationEstimate => {
    const safePanels = Math.max(1, Number(panelCount) || 1);
    const squareFeet = convertToSquareFeet(width, height, unit);
    const perimeterMeters = calculatePerimeter(width, height, unit);
    const safeBasePrice = Math.max(0, Number(basePrice) || 0);
    // basePrice is the configured price per square foot for the selected
    // glass-color/aluminum-color combination. Thickness does not add an
    // automatic multiplier; clients may configure the same rate for 5mm/6mm.
    const glassCost = safeBasePrice * squareFeet * safePanels;
    const aluminumCost = 0;
    const designCost = 0;
    const addOnCost = 0;
    const serviceCost = serviceMode === 'Delivery & Installation'
        ? 750 + (500 * safePanels)
        : 0;
    const measurementCost = measurementRequired ? 300 : 0;

    return {
        glassCost,
        aluminumCost,
        designCost,
        addOnCost,
        serviceCost,
        measurementCost,
        subtotal: glassCost + serviceCost + measurementCost,
        squareFeet,
        perimeterMeters,
    };
};

/** Calculate one quotation's totals from its un-discounted line prices. */
export const calculateQuotationTotals = (
    lines: QuotationTotalLine[],
    discountType: 'fixed' | 'percentage',
    discountValue: number,
    taxPercentage: number,
): QuotationTotals => {
    const subtotal = lines.reduce(
        (sum, line) => sum + Math.max(0, Number(line.price) || 0) * Math.max(0, Number(line.qty) || 0),
        0,
    );
    const discountAmount = calculateDiscount(subtotal, discountType, discountValue);
    const taxAmount = calculateTax(subtotal, taxPercentage, discountAmount);
    return {
        subtotal,
        discountAmount,
        taxAmount,
        total: calculateTotal(subtotal, discountAmount, taxAmount),
    };
};

/**
 * Format currency for PH Peso
 */
export const formatCurrency = (amount: number): string => {
    return `₱ ${amount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

/**
 * Format date for display
 */
export const formatQuotationDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};
