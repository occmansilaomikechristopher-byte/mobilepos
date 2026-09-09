import axiosConfig from './axiosConfig';

export interface PosProduct {
    id: number;
    product_code: string;
    product_name: string;
    unit_price: string;
    quantity_on_hand: string;
    unit: string | null;
    image: string | null;
}

export interface CartItem {
    product_id: number;
    product_name: string;
    price: number;
    qty: number;
}

export const fetchPosProducts = async (
    branchId: number,
): Promise<PosProduct[]> => {
    const res = await axiosConfig.post('?action=mobile-pos-products', {
        branch_id: branchId,
    });
    return res.data?.products || [];
};

export const updatePosProductStock = async (
    branchId: number,
    productId: number,
    addedQuantity: number,
) => {
    const res = await axiosConfig.post(
        '?action=mobile-pos-update-product-stock',
        {
            branch_id: branchId,
            product_id: productId,
            quantity: addedQuantity,
        },
    );
    return res.data;
};

export const updatePosProductPrice = async (
    productId: number,
    price: number,
) => {
    const res = await axiosConfig.post('?action=mobile-pos-update-product-price', {
        product_id: productId,
        unit_price: price,
    });
    return res.data;
};

export interface PosSale {
    id: number;
    invoice_no: string;
    subtotal: string;
    discount: string;
    total: string;
    payment: string;
    change_due: string;
    created_at: string;
}

export interface PosSaleItem {
    product_id: number;
    product_name: string;
    price: string;
    qty: string;
    line_total: string;
}

export const fetchPosSales = async (
    branchId: number,
    from?: string,
    to?: string,
): Promise<PosSale[]> => {
    const res = await axiosConfig.post('?action=mobile-pos-sales', {
        branch_id: branchId,
        from: from || '',
        to: to || '',
    });
    return res.data?.sales || [];
};

export const fetchPosSaleDetails = async (
    saleId: number,
): Promise<{sale: PosSale; items: PosSaleItem[]} | null> => {
    const res = await axiosConfig.post('?action=mobile-pos-sale-details', {
        sale_id: saleId,
    });
    if (!res.data?.result) {
        return null;
    }
    return {sale: res.data.sale, items: res.data.items || []};
};

export const savePosSale = async (payload: {
    branch_id: number;
    cashier_id: number;
    discount: number;
    payment: number;
    items: CartItem[];
}) => {
    const res = await axiosConfig.post('?action=mobile-pos-save-sale', payload);
    return res.data; // { result, message, invoice_no, subtotal, discount, total, change }
};

export interface PosQuotationItem extends CartItem {
    description?: string;
    line_total?: string;
}

export interface PosQuotation {
    id: number;
    quotation_no: string;
    subtotal: string;
    discount: string;
    total: string;
    created_at: string;
}

export const savePosQuotation = async (payload: {
    branch_id: number;
    discount: number;
    tax_percentage: number;
    tax: number;
    items: PosQuotationItem[];
}) => {
    const res = await axiosConfig.post('?action=save_pos_quotation', payload);
    return res.data;
};

export const fetchPosQuotations = async (branchId?: number): Promise<PosQuotation[]> => {
    const query = branchId && branchId > 0
        ? `?action=get_pos_quotations&branch_id=${branchId}`
        : '?action=get_pos_quotations';
    const res = await axiosConfig.get(query);
    return res.data?.quotations || [];
};

export const fetchPosQuotationDetails = async (quotationId: number, branchId: number) => {
    const res = await axiosConfig.post('?action=get_pos_quotation_details', {
        quotation_id: quotationId,
        branch_id: branchId,
    });
    return res.data?.result ? res.data : null;
};

export const savePosDamageItem = async (payload: {
    branch_id: number;
    cashier_id: number;
    product_id?: number;
    item_name: string;
    quantity: number;
    description: string;
}) => {
    const res = await axiosConfig.post('?action=mobile-pos-save-damage', payload);
    return res.data; // { result, message, damage_id }
};

export const deletePosDamageItem = async (payload: {
    damage_id: number;
}) => {
    const res = await axiosConfig.post('?action=mobile-pos-delete-damage', payload);
    return res.data; // { result, message }
};

export const savePosOwnerRequisition = async (payload: {
    item_name: string;
    quantity: number;
    branch_id: number;
    description: string;
}) => {
    const res = await axiosConfig.post('?action=mobile-pos-save-owner-requisition', payload);
    return res.data; // { result, message, requisition_id }
};

export const deletePosOwnerRequisition = async (payload: {
    requisition_id: number;
}) => {
    const res = await axiosConfig.post('?action=mobile-pos-delete-owner-requisition', payload);
    return res.data; // { result, message }
};

export const updatePosOwnerRequisitionStatus = async (payload: {
    requisition_id: number;
    status: string;
}) => {
    const res = await axiosConfig.post('?action=mobile-pos-update-owner-requisition-status', payload);
    return res.data; // { result, message }
};

export const updatePosOwnerRequisitionPayment = async (payload: {
    requisition_id: number;
    amount_paid: number;
}) => {
    const res = await axiosConfig.post(
        '?action=mobile-pos-update-owner-requisition-payment',
        payload,
    );
    return res.data; // { result, message }
};
