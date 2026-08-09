export const CASHIER_TABS = [
    {label: 'POS', icon: 'point-of-sale'},
    {label: 'Products', icon: 'cube-outline'},
    {label: 'Inventory', icon: 'warehouse'},
    {label: 'Sales', icon: 'clipboard-text-outline'},
    {label: 'Logs', icon: 'fingerprint'},
    {label: 'Damage', icon: 'alert-outline'},
    {label: 'Request', icon: 'clipboard-outline'},
    {label: 'Settings', icon: 'cog-outline'},
];

const REQUEST_TAB = {label: 'Request', icon: 'clipboard-outline'};
const DAMAGE_TAB = {label: 'Damage', icon: 'alert-outline'};

export const NON_CASHIER_TABS = [
    {label: 'POS', icon: 'point-of-sale'},
    {label: 'Products', icon: 'cube-outline'},
    {label: 'Inventory', icon: 'warehouse'},
    {label: 'Sales', icon: 'clipboard-text-outline'},
    {label: 'Settings', icon: 'cog-outline'},
];

export const SECRETARY_TABS = [
    ...NON_CASHIER_TABS.slice(0, -1),
    DAMAGE_TAB,
    REQUEST_TAB,
    NON_CASHIER_TABS[NON_CASHIER_TABS.length - 1],
];

export const getTabConfig = (isCashier: boolean, isSecretary = false) => {
    if (isCashier) {
        return CASHIER_TABS;
    }

    return isSecretary ? SECRETARY_TABS : NON_CASHIER_TABS;
};
