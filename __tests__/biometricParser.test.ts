import {normalizeBiometricCode, parseBiometricData} from '../src/utils/biometricParser';

describe('shared biometric parser', () => {
    it('uses the attendance state column from standard four-column DAT files', () => {
        const rows = parseBiometricData(
            '00123\t2026-08-10 08:00:00\t15\t0\n00123\t2026-08-10 17:00:00\t15\t1',
        );

        expect(rows).toHaveLength(2);
        expect(rows[0].id).toBe('00123');
        expect(rows[0].attendanceType).toBe('0');
        expect(rows[1].attendanceType).toBe('1');
    });

    it('normalizes matching without losing the original code', () => {
        expect(normalizeBiometricCode('  EMP-001 ')).toBe('emp-001');
        expect(parseBiometricData('EMP-001,2026-08-10 08:00:00,19')[0].id).toBe(
            'EMP-001',
        );
    });
});
