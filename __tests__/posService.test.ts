import axiosConfig from '../src/utils/axiosConfig';
import {savePosDamageItem} from '../src/utils/posService';

jest.mock('../src/utils/axiosConfig', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
    },
}));

describe('POS damage service', () => {
    it('submits the product and quantity for server-side stock deduction', async () => {
        (axiosConfig.post as jest.Mock).mockResolvedValueOnce({
            data: {result: true, damage_id: 42},
        });

        const payload = {
            branch_id: 3,
            cashier_id: 9,
            product_id: 17,
            item_name: 'Glass Panel',
            quantity: 2,
            description: 'Cracked during handling',
        };

        await savePosDamageItem(payload);

        expect(axiosConfig.post).toHaveBeenCalledWith(
            '?action=mobile-pos-save-damage',
            payload,
        );
    });
});
