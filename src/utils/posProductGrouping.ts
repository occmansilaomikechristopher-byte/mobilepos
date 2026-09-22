export const ALL_PRODUCTS_CATEGORY = 'all';

export interface ProductCategoryLike {
    id: number | string;
    category_name: string;
}

export interface ProductLike {
    category_id?: number | string | null;
}

export const filterProductsByCategory = <T extends ProductLike>(
    products: T[],
    categoryId: number | string = ALL_PRODUCTS_CATEGORY,
): T[] => {
    if (String(categoryId) === ALL_PRODUCTS_CATEGORY) return products;
    return products.filter(product => String(product.category_id) === String(categoryId));
};