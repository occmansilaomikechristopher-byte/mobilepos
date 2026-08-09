import {
    getTabConfig,
    CASHIER_TABS,
    SECRETARY_TABS,
} from '../src/screens/pos/tabConfig';

describe('POS dashboard tabs', () => {
    it('includes the Damage tab with a supported icon', () => {
        const tabs = getTabConfig(true);
        const damageTab = tabs.find(tab => tab.label === 'Damage');

        expect(damageTab).toBeDefined();
        expect(damageTab?.icon).toBe('alert-outline');
    });

    it('keeps the cashier tab list consistent', () => {
        expect(CASHIER_TABS.some(tab => tab.label === 'Damage')).toBe(true);
    });

    it('includes the Request tab for secretaries', () => {
        const tabs = getTabConfig(false, true);
        const requestTab = tabs.find(tab => tab.label === 'Request');
        const damageTab = tabs.find(tab => tab.label === 'Damage');

        expect(requestTab).toBeDefined();
        expect(requestTab?.icon).toBe('clipboard-outline');
        expect(damageTab).toBeDefined();
        expect(damageTab?.icon).toBe('alert-outline');
        expect(SECRETARY_TABS).toEqual(tabs);
    });

    it('keeps the standard non-cashier tabs unchanged', () => {
        expect(getTabConfig(false).some(tab => tab.label === 'Request')).toBe(
            false,
        );
    });
});
