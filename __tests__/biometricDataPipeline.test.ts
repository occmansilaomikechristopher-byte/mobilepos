import dayjs from 'dayjs';

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

const groupDataByIdAndDate = (parsedData: any[]) => {
    return parsedData.reduce((acc, entry) => {
        const date = dayjs(entry.dateTime).format('YYYY-MM-DD');
        if (!acc[entry.id]) {
            acc[entry.id] = {};
        }
        if (!acc[entry.id][date]) {
            acc[entry.id][date] = [];
        }
        acc[entry.id][date].push({
            dateTime: entry.dateTime,
            attendanceType: entry.attendanceType,
        });
        return acc;
    }, {} as Record<string, Record<string, any>>);
};

const calculateHoursLoggedPerDay = (groupedData: Record<string, Record<string, any>>) => {
    const result = [];
    Object.keys(groupedData).forEach(id => {
        Object.keys(groupedData[id]).forEach(date => {
            const entries = groupedData[id][date]
                .slice()
                .sort((a: any, b: any) => dayjs(a.dateTime).diff(dayjs(b.dateTime)));

            if (entries.length === 0) return;

            const attendanceType = entries[0].attendanceType;
            const dateTimes = entries.map((e: any) => e.dateTime);
            const updateDateTimes = dateTimes.map(item => ({
                dateTime: item,
                type: 'bio',
            }));

            const firstLogTime = dayjs(dateTimes[0]);
            const lastLogTime = dayjs(dateTimes[dateTimes.length - 1]);
            let hours = Math.max(0, lastLogTime.diff(firstLogTime, 'hour', true) - 1);

            result.push({
                id: id.replace(/\s/g, ''),
                employee_id: '',
                name: 'No Employee Assigned',
                date,
                hours: Math.max(0, hours).toFixed(2),
                logs: updateDateTimes,
                status: 'auto',
                type: attendanceType,
            });
        });
    });
    return result;
};

describe('DTR Data Transformation Pipeline', () => {
    it('transforms attendance file to DTR details matching backend contract', () => {
        const fileContent = `2026-58843\t2026-08-10 08:00:00\t19
2026-58843\t2026-08-10 08:30:00\t19
2026-58843\t2026-08-10 17:00:00\t19`;

        const parsed = parseBiometricData(fileContent);
        expect(parsed).toHaveLength(3);
        expect(parsed[0].attendanceType).toBe('19');

        const grouped = groupDataByIdAndDate(parsed);
        expect(grouped['2026-58843']['2026-08-10']).toHaveLength(3);

        const dtrDetails = calculateHoursLoggedPerDay(grouped);
        expect(dtrDetails).toHaveLength(1);

        const detail = dtrDetails[0];
        expect(detail.id).toBe('2026-58843');
        expect(detail.date).toBe('2026-08-10');
        expect(detail.type).toBe('19');
        expect(detail.logs).toHaveLength(3);
        expect(detail.status).toBe('auto');
    });

    it('handles multiple employees with different status codes', () => {
        const fileContent = `EMP-001\t2026-08-10 08:00:00\t01
EMP-002\t2026-08-10 08:00:00\t04
EMP-001\t2026-08-10 17:00:00\t01`;

        const parsed = parseBiometricData(fileContent);
        expect(parsed).toHaveLength(3);

        const grouped = groupDataByIdAndDate(parsed);
        expect(Object.keys(grouped)).toHaveLength(2);

        const dtrDetails = calculateHoursLoggedPerDay(grouped);
        expect(dtrDetails).toHaveLength(2);

        const emp1 = dtrDetails.find(d => d.id === 'EMP-001');
        const emp2 = dtrDetails.find(d => d.id === 'EMP-002');

        expect(emp1?.type).toBe('01');
        expect(emp2?.type).toBe('04');
    });

    it('extracts date range correctly for backend DTR header', () => {
        const fileContent = `2026-58843\t2026-08-10 08:00:00\t19
2026-58843\t2026-08-11 09:00:00\t19
2026-58843\t2026-08-12 17:00:00\t19`;

        const parsed = parseBiometricData(fileContent);
        const dateTimes = parsed.map(entry => dayjs(entry.dateTime));
        const sorted = dateTimes.sort((a, b) => a.diff(b));
        const minDate = sorted[0];
        const maxDate = sorted[sorted.length - 1];

        expect(minDate.format('YYYY-MM-DD')).toBe('2026-08-10');
        expect(maxDate.format('YYYY-MM-DD')).toBe('2026-08-12');
    });

    it('rejects invalid files early with 0 valid records', () => {
        const fileContent = `invalid line\nanother bad line\n2026-58843\tbad-datetime\t19`;

        const parsed = parseBiometricData(fileContent);
        expect(parsed).toHaveLength(0);
    });
});
