import {
    calculateDiscount,
    calculateQuotationTotals,
    calculateTax,
    calculateTotal,
    convertToSquareMeters,
    calculatePerimeter,
} from '../src/utils/quotationCalculator';

describe('quotation calculator', () => {
    it('converts dimensions to square meters and perimeter', () => {
        expect(convertToSquareMeters(100, 100, 'CM')).toBe(1);
        expect(calculatePerimeter(100, 100, 'CM')).toBe(4);
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
});
