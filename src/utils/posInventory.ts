export const normalizeInventoryQuantity = (
    value: number | string | null | undefined,
) => {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) {
        return 0;
    }
    return Math.max(0, parsed);
};

export const getLimitedCartQuantity = (
    currentQty: number,
    delta: number,
    maxQty: number | string | null | undefined,
) => {
    const safeMax = normalizeInventoryQuantity(maxQty);
    if (safeMax <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(currentQty + delta, safeMax));
};

export const parseCartPrice = (value: string): number | null => {
    if (value.trim() === '') {
        return 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
