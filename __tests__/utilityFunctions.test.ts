import {getTextColor} from '../src/utils/utilityFunctions';

describe('getTextColor', () => {
    it('returns white for dark themes', () => {
        expect(getTextColor(true)).toBe('white');
    });

    it('returns black for light themes', () => {
        expect(getTextColor(false)).toBe('black');
    });
});
