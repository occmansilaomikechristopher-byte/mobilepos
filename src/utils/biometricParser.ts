import dayjs from 'dayjs';

type BiometricEntry = {
    id: string;
    dateTime: string;
    attendanceType: string;
};

export const normalizeBiometricCode = (value: unknown): string =>
    String(value ?? '').replace(/\s/g, '').trim().toLowerCase();

export const parseBiometricData = (fileContent: string): BiometricEntry[] =>
    fileContent
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const delimiter = line.includes('\t') ? '\t' : ',';
            const parts = line.split(delimiter).map(part => part.trim());
            if (parts.length < 3) return null;

            const id = parts[0];
            const dateTime = parts[1];
            // Standard biometric exports use column 4 for attendance state;
            // legacy exports use column 3.
            const isStandardDat =
                parts.length >= 4 && ['0', '1'].includes(parts[3]);
            const attendanceType = isStandardDat ? parts[3] : parts[2];
            const parsedDateTime = dayjs(dateTime, 'YYYY-MM-DD HH:mm:ss', true);

            if (!id || !dateTime || !attendanceType || !parsedDateTime.isValid()) {
                return null;
            }

            return {
                id,
                dateTime: parsedDateTime.format('YYYY-MM-DD HH:mm:ss'),
                attendanceType,
            };
        })
        .filter((entry): entry is BiometricEntry => entry !== null);
