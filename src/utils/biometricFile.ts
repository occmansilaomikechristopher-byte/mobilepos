export const isBiometricDatFile = (fileName?: string | null) => {
    if (!fileName || typeof fileName !== 'string') {
        return false;
    }

    const normalized = fileName.trim().toLowerCase();
    return normalized.endsWith('.dat');
};
