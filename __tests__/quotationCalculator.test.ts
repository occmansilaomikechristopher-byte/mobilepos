import {
    calculateDiscount,
    calculateQuotationTotals,
    calculateTax,
    calculateTotal,
    convertToSquareMeters,
    convertToSquareFeet,
    calculatePerimeter,
    calculateQuotationEstimate,
    calculateCombinedQuotationPrice,
    createQuotationPricingKey,
} from '../src/utils/quotationCalculator';

describe('quotation calculator', () => {
    const pricing = [
        {width: 48, height: 48, unit: 'IN' as const, glassColor: 'Clear Glass' as const, thickness: 5 as const, aluminumProfile: 'Black' as const, pricePerSqFt: 300},
        {width: 48, height: 48, unit: 'IN' as const, glassColor: 'Bronze Glass' as const, thickness: 6 as const, aluminumProfile: 'Black' as const, pricePerSqFt: 300},
        {width: 48, height: 48, unit: 'IN' as const, glassColor: 'Dark Gray Glass' as const, thickness: 5 as const, aluminumProfile: 'Black' as const, pricePerSqFt: 331.25},
    ];

    it('uses a normalized pricing key and calculates combined material cost', () => {
        expect(createQuotationPricingKey(48, 36, 'IN', 'Clear Glass', 5, 'Black'))
            .toBe(createQuotationPricingKey(36, 48, 'IN', 'Clear Glass', 5, 'Black'));
        expect(createQuotationPricingKey(48, 48, 'IN', 'Clear Glass', 5, 'Black'))
            .toBe(createQuotationPricingKey(48, 48, 'IN', 'Clear Glass', 6, 'Black'));

        expect(calculateCombinedQuotationPrice({
            width: 48,
            height: 48,
            unit: 'IN',
            panelCount: 2,
            glassColor: 'Clear Glass',
            thickness: 6,
            aluminumProfile: 'Black',
            pricing,
        })).toMatchObject({
            areaSqFt: 16,
            pricePerSqFt: 300,
            materialCost: 9600,
        });
    });

    it('supports the configured Clear Glass 5mm rate for White Aluminum', () => {
        expect(calculateCombinedQuotationPrice({
            width: 48,
            height: 48,
            unit: 'IN',
            panelCount: 1,
            glassColor: 'Clear Glass',
            thickness: 5,
            aluminumProfile: 'White',
            pricing: [{
                width: 48,
                height: 48,
                unit: 'IN',
                glassColor: 'Clear Glass',
                thickness: 5,
                aluminumProfile: 'White',
                pricePerSqFt: 300,
            }],
        }).materialCost).toBe(4800);
    });

    it('calculates Product + Glass Thickness without optional selections', () => {
        expect(calculateCombinedQuotationPrice({
            width: 48,
            height: 48,
            unit: 'IN',
            panelCount: 1,
            thickness: 6,
            pricing: [{
                width: 48,
                height: 48,
                unit: 'IN',
                glassColor: '' as any,
                thickness: 5,
                aluminumProfile: '' as any,
                pricePerSqFt: 300,
            }],
        }).materialCost).toBe(4800);
    });

    it('scales the 48 by 48 reference rate to changed dimensions', () => {
        expect(calculateCombinedQuotationPrice({
            width: 30,
            height: 48,
            unit: 'IN',
            panelCount: 1,
            glassColor: 'Clear Glass',
            thickness: 6,
            aluminumProfile: 'Black',
            pricing: [{
                width: 48,
                height: 48,
                unit: 'IN',
                glassColor: 'Clear Glass',
                thickness: 5,
                aluminumProfile: 'Black',
                pricePerSqFt: 300,
            }],
        })).toMatchObject({
            areaSqFt: 10,
            pricePerSqFt: 300,
            materialCost: 3000,
        });
    });

    it('selects the configured glass and profile combination', () => {
        expect(calculateCombinedQuotationPrice({
            width: 48,
            height: 48,
            unit: 'IN',
            panelCount: 1,
            glassColor: 'Bronze Glass',
            thickness: 6,
            aluminumProfile: 'Black',
            pricing,
        }).materialCost).toBe(4800);
    });

    it('calculates all supplied 48 by 48 Black Aluminum prices', () => {
        const configuredPrices = [
            ['Clear Glass', 4500],
            ['Bronze Glass', 4800],
            ['Dark Gray Glass', 5300],
            ['Reflective Blue', 5500],
            ['Reflective Green', 5500],
            ['Reflective Bronze', 5500],
            ['Reflective Dark Gray', 6400],
            ['Reflective Gold', 7200],
        ] as const;

        configuredPrices.forEach(([glassColor, expectedTotal]) => {
            const rate = expectedTotal / 16;
            expect(calculateCombinedQuotationPrice({
                width: 48,
                height: 48,
                unit: 'IN',
                panelCount: 1,
                glassColor,
                thickness: 6,
                aluminumProfile: 'Black',
                pricing: [{
                    width: 48,
                    height: 48,
                    unit: 'IN',
                    glassColor,
                    thickness: 6,
                    aluminumProfile: 'Black',
                    pricePerSqFt: rate,
                }],
            }).materialCost).toBe(expectedTotal);
        });
    });

    it('rejects unsupported thickness, profile, and missing prices', () => {
        const base = {
            width: 48,
            height: 48,
            unit: 'IN' as const,
            panelCount: 1,
            glassColor: 'Clear Glass' as const,
            pricing,
        };
        expect(() => calculateCombinedQuotationPrice({...base, thickness: 8, aluminumProfile: 'Black'})).toThrow('Only 5mm and 6mm');
        expect(() => calculateCombinedQuotationPrice({...base, thickness: 5, aluminumProfile: 'Silver'})).toThrow('Only Black and White');
        expect(() => calculateCombinedQuotationPrice({...base, thickness: 6, aluminumProfile: 'White'}))
            .toThrow('No configured quotation price');
    });

    it('converts dimensions to square meters and perimeter', () => {
        expect(convertToSquareMeters(100, 100, 'CM')).toBe(1);
        expect(calculatePerimeter(100, 100, 'CM')).toBe(4);
    });

    it('converts glass dimensions to square feet using square inches divided by 144', () => {
        expect(convertToSquareFeet(48, 48, 'IN')).toBe(16);
    });

    it('caps fixed and percentage discounts', () => {
        expect(calculateDiscount(1000, 'fixed', 1500)).toBe(1000);
        expect(calculateDiscount(1000, 'percentage', 150)).toBe(1000);
        expect(calculateDiscount(1000, 'percentage', -10)).toBe(0);
    });

    it('calculates tax after discount', () => {
        expect(calculateTax(1000, 12, 100)).toBe(108);
        expect(calculateTotal(1000, 100, 108)).toBe(1008);
    });

    it('aggregates multiple cart lines and applies discount/tax once', () => {
        expect(calculateQuotationTotals(
            [{price: 1000, qty: 1}, {price: 500, qty: 2}],
            'fixed',
            100,
            12,
        )).toEqual({
            subtotal: 2000,
            discountAmount: 100,
            taxAmount: 228,
            total: 2128,
        });
    });

    it('prices the configured square-foot rate without adding aluminum separately', () => {
        const supplyOnly = calculateQuotationEstimate({
            basePrice: 1000,
            width: 100,
            height: 100,
            unit: 'CM',
            panelCount: 1,
            thickness: 6,
            glassColor: 'Clear',
            design: 'None',
            serviceMode: 'Supply Only',
        });
        const delivered = calculateQuotationEstimate({
            basePrice: 1000,
            width: 100,
            height: 100,
            unit: 'CM',
            panelCount: 2,
            thickness: 6,
            glassColor: 'Mirror',
            design: 'French Type Design',
            addOns: ['Mosquito Screen'],
            serviceMode: 'Delivery & Installation',
        });

        expect(supplyOnly.glassCost).toBeCloseTo(10763.910000000002);
        expect(supplyOnly.aluminumCost).toBe(0);
        expect(supplyOnly.subtotal).toBeCloseTo(10763.910000000002);
        expect(delivered.subtotal).toBeGreaterThan(supplyOnly.subtotal);
        expect(delivered.serviceCost).toBe(1750);
        expect(delivered.designCost).toBe(0);
        expect(delivered.addOnCost).toBe(0);
    });

    it('uses the supplied configured price per square foot', () => {
        const estimate = calculateQuotationEstimate({
            basePrice: 300,
            width: 100,
            height: 100,
            unit: 'CM',
            panelCount: 1,
            thickness: 6,
            glassColor: 'Clear',
            serviceMode: 'Supply Only',
        });

        expect(estimate.glassCost).toBeCloseTo(3229.173125);
        expect(estimate.aluminumCost).toBe(0);
        expect(estimate.subtotal).toBeCloseTo(3229.173125);
    });

    it('prices a 48 by 48 inch clear 6mm panel at 300 pesos per square foot', () => {
        const estimate = calculateQuotationEstimate({
            basePrice: 300,
            width: 48,
            height: 48,
            unit: 'IN',
            panelCount: 1,
            thickness: 6,
            glassColor: 'Clear',
            serviceMode: 'Supply Only',
        });

        expect(estimate.squareFeet).toBe(16);
        expect(estimate.glassCost).toBe(4800);
    });

    it('uses the same configured rate for 5mm and 6mm when the client configures it that way', () => {
        const estimate5mm = calculateQuotationEstimate({
            basePrice: 281.25,
            width: 48,
            height: 48,
            unit: 'IN',
            panelCount: 1,
            thickness: 5,
            glassColor: 'Bronze',
            serviceMode: 'Supply Only',
        });
        const estimate6mm = calculateQuotationEstimate({
            basePrice: 281.25,
            width: 48,
            height: 48,
            unit: 'IN',
            panelCount: 1,
            thickness: 6,
            glassColor: 'Bronze',
            serviceMode: 'Supply Only',
        });

        expect(estimate5mm.glassCost).toBe(4500);
        expect(estimate6mm.glassCost).toBe(4500);
    });
});
