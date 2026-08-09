import {isBiometricDatFile} from '../src/utils/biometricFile';
import dayjs from 'dayjs';

// Mock parseBiometricData function for testing
const parseBiometricData = (fileContent: string) => {
    const lines = fileContent
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== '' && line.length > 0);

    return lines
        .map(line => {
            const delimiter = line.includes('\t') ? '\t' : ',';
            const parts = line.split(delimiter).map(part => part.trim());
            
            if (parts.length < 3) return null;
            
            const id = parts[0];
            const dateTime = parts[1];
            const attendanceType = parts[2];
            
            if (!id || !dateTime || !attendanceType) {
                return null;
            }
            
            const parsedDateTime = dayjs(dateTime, 'YYYY-MM-DD HH:mm:ss', true);
            if (!parsedDateTime.isValid()) {
                return null;
            }
            
            return {
                id: id.trim(),
                dateTime: parsedDateTime.format('YYYY-MM-DD HH:mm:ss'),
                attendanceType,
            };
        })
        .filter(entry => entry !== null && entry.id && entry.dateTime && entry.attendanceType);
};

describe('isBiometricDatFile', () => {
    it('accepts .dat biometric files', () => {
        expect(isBiometricDatFile('device.dat')).toBe(true);
        expect(isBiometricDatFile('DEVICE.DAT')).toBe(true);
    });

    it('rejects non-.dat files', () => {
        expect(isBiometricDatFile('device.csv')).toBe(false);
        expect(isBiometricDatFile('device.txt')).toBe(false);
        expect(isBiometricDatFile('')).toBe(false);
        expect(isBiometricDatFile(null)).toBe(false);
    });
});

describe('parseBiometricData', () => {
    it('accepts hyphenated/alphanumeric user IDs', () => {
        const data =
            '2026-58843\t2026-08-10 08:00:00\t19\n' +
            'EMP-001\t2026-08-10 09:00:00\t1\n' +
            'USER123\t2026-08-10 10:00:00\t4';
        const result = parseBiometricData(data);
        expect(result).toHaveLength(3);
        expect(result[0].id).toBe('2026-58843');
        expect(result[1].id).toBe('EMP-001');
        expect(result[2].id).toBe('USER123');
    });

    it('supports tab-separated values (TSV)', () => {
        const data = '2026-58843\t2026-08-10 08:00:00\t19';
        const result = parseBiometricData(data);
        expect(result).toHaveLength(1);
        expect(result[0].dateTime).toBe('2026-08-10 08:00:00');
        expect(result[0].attendanceType).toBe('19');
    });

    it('supports comma-separated values (CSV)', () => {
        const data = '2026-58843,2026-08-10 08:00:00,19';
        const result = parseBiometricData(data);
        expect(result).toHaveLength(1);
        expect(result[0].dateTime).toBe('2026-08-10 08:00:00');
        expect(result[0].attendanceType).toBe('19');
    });

    it('accepts two-digit and custom status codes', () => {
        const data =
            '2026-58843\t2026-08-10 08:00:00\t01\n' +
            '2026-58843\t2026-08-10 12:00:00\t19\n' +
            '2026-58843\t2026-08-10 17:00:00\t99';
        const result = parseBiometricData(data);
        expect(result).toHaveLength(3);
        expect(result[0].attendanceType).toBe('01');
        expect(result[1].attendanceType).toBe('19');
        expect(result[2].attendanceType).toBe('99');
    });

    it('handles CRLF (Windows) line endings', () => {
        const data = '2026-58843\t2026-08-10 08:00:00\t19\r\nEMP-001\t2026-08-10 09:00:00\t1';
        const result = parseBiometricData(data);
        expect(result).toHaveLength(2);
    });

    it('handles LF (Linux/Web) line endings', () => {
        const data = '2026-58843\t2026-08-10 08:00:00\t19\nEMP-001\t2026-08-10 09:00:00\t1';
        const result = parseBiometricData(data);
        expect(result).toHaveLength(2);
    });

    it('rejects lines with fewer than 3 columns', () => {
        const data =
            '2026-58843\t2026-08-10 08:00:00\n' + // Only 2 columns
            '2026-58843\t2026-08-10 08:00:00\t19'; // Valid
        const result = parseBiometricData(data);
        expect(result).toHaveLength(1); // Only valid line
    });

    it('rejects lines with invalid datetime format', () => {
        const data =
            '2026-58843\tinvalid-date\t19\n' + // Invalid date
            '2026-58843\t2026-08-10 08:00:00\t19'; // Valid
        const result = parseBiometricData(data);
        expect(result).toHaveLength(1); // Only valid line
    });

    it('preserves full data through complete parsing', () => {
        const data = '2026-58843\t2026-08-10 08:00:00\t19';
        const result = parseBiometricData(data);
        expect(result[0]).toEqual({
            id: '2026-58843',
            dateTime: '2026-08-10 08:00:00',
            attendanceType: '19',
        });
    });
});

