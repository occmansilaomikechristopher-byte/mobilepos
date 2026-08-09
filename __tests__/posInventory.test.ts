import {
    getLimitedCartQuantity,
    normalizeInventoryQuantity,
    parseCartPrice,
} from '../src/utils/posInventory';

describe('pos inventory helpers', () => {
    it('keeps quantities at zero minimum', () => {
        expect(normalizeInventoryQuantity('-3')).toBe(0);
        expect(normalizeInventoryQuantity(null)).toBe(0);
    });

    it('caps cart quantity at available stock', () => {
        expect(getLimitedCartQuantity(2, 1, 3)).toBe(3);
        expect(getLimitedCartQuantity(3, 1, 3)).toBe(3);
        expect(getLimitedCartQuantity(1, -2, 3)).toBe(0);
        expect(getLimitedCartQuantity(1, 5, 0)).toBe(0);
    });

    it('parses non-negative editable prices', () => {
        expect(parseCartPrice('2500.50')).toBe(2500.5);
        expect(parseCartPrice('0')).toBe(0);
    });

    it('treats an empty price field as zero', () => {
        expect(parseCartPrice('')).toBe(0);
    });

    it('rejects invalid and negative prices', () => {
        expect(parseCartPrice('abc')).toBeNull();
        expect(parseCartPrice('-1')).toBeNull();
    });
});
