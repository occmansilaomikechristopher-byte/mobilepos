import {
    ALL_PRODUCTS_CATEGORY,
    filterProductsByCategory,
} from '../src/utils/posProductGrouping';

describe('quotation product category filtering', () => {
    const products = [
        {id: 1, product_name: 'Glass Panel', category_id: 10},
        {id: 2, product_name: 'Window Profile', category_id: 20},
        {id: 3, product_name: 'Uncategorized Item', category_id: null},
    ];

    it('returns all products for the All filter', () => {
        expect(filterProductsByCategory(products, ALL_PRODUCTS_CATEGORY)).toEqual(products);
    });

    it('matches products by backend category ID', () => {
        expect(filterProductsByCategory(products, '10')).toEqual([products[0]]);
    });

    it('returns no products for an empty or unknown category', () => {
        expect(filterProductsByCategory([], 10)).toEqual([]);
        expect(filterProductsByCategory(products, 999)).toEqual([]);
    });

    it('preserves products without a category only in All', () => {
        expect(filterProductsByCategory(products, 10)).not.toContain(products[2]);
        expect(filterProductsByCategory(products)).toContain(products[2]);
    });
});
