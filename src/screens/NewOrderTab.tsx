//@ts-nocheck
import React, {useState, useEffect} from 'react';
import {
    View,
    Alert,
    ScrollView,
    StyleSheet,
    Modal,
    TouchableOpacity,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import minMax from 'dayjs/plugin/minMax';
import {formatDate} from '../utils/helper';
import {TextComponent, MainContainer, DateRangePicker} from '../components/';
import useGlobalStore from '../store/globalState';
import {HomeScreenNavigationProp} from '../AppNavigator';
import {PRIMARY_COLOR, ERROR_COLOR} from '../utils/constant';
import {isBiometricDatFile} from '../utils/biometricFile';
import {
    normalizeBiometricCode,
    parseBiometricData,
} from '../utils/biometricParser';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(minMax);

// Helper function to convert base64 to string safely
const base64ToASCII = (base64String: string): string => {
    try {
        return decodeURIComponent(atob(base64String).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        return atob(base64String);
    }
};

interface Props {
    navigation: HomeScreenNavigationProp;
}

const App = ({navigation}: Props) => {
    const {setLogsSummary, saveDTR, myEmployees, success, setSuccess} =
        useGlobalStore();
    const [hoursLogged, setHoursLogged] = useState([]);
    const [rawData, setRawData] = useState(null);
    const [file, setFile] = useState(null);
    const [uniqueIds, setUniqueIds] = useState([]);
    const [show, setShow] = useState(false);
    const [deviceID, setDeviceID] = useState(null);
    const [date_from, setFrom] = useState(null);
    const [date_to, setTo] = useState(null);
    const [weeklyPayroll, setWeeklyPayroll] = useState(1);

    const [isDateRangePickerVisible, setDateRangePickerVisibility] =
        useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState(undefined);
    const [selectedEndDate, setSelectedEndDate] = useState(undefined);
    const [showUnmatchedCodes, setShowUnmatchedCodes] = useState(false);

    useEffect(() => {
        if (success && success.visible && success.type === 'save-dtr') {
            setHoursLogged([]);
            setShow(false);
            setFile(null);
            setSelectedStartDate(undefined);
            setTimeout(() => setSuccess({visible: false, type: ''}), 1000);
        }
    }, [success]);

    const filterDataByDateRange = (data, startDate, endDate) => {
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        return data.filter(item => {
            const itemDate = dayjs(item.dateTime);
            return itemDate.isSameOrAfter(start) && itemDate.isSameOrBefore(end);
        });
    };

    const handleFileUpload = async () => {
        try {
            const res = await DocumentPicker.pick({
                type: [
                    DocumentPicker.types.plainText,
                    'application/octet-stream',
                ],
                allowMultiSelection: false,
            });
            const pickedFile = res?.[0];
            if (!pickedFile) {
                return;
            }

            const fileName = pickedFile.name || '';
            if (!isBiometricDatFile(fileName)) {
                setFile(null);
                setRawData(null);
                Alert.alert('Error', 'Only biometric .dat files are supported.');
                return;
            }

            const filePath = pickedFile.uri;
            setFile(fileName);
            const base64Data = await RNFS.readFile(filePath, 'base64');
            const base64String = `data:text/plain;base64,${base64Data}`;
            setRawData(base64String);

            let fileContent = '';
            try {
                fileContent = await RNFS.readFile(filePath, 'utf8');
            } catch (encodingError) {
                // Fallback: try reading as base64 and converting to ASCII
                try {
                    const base64Content = await RNFS.readFile(filePath, 'base64');
                    fileContent = base64ToASCII(base64Content);
                } catch (fallbackError) {
                    Alert.alert('Error', 'Unable to read file with supported encoding');
                    throw fallbackError;
                }
            }
            
            const parsedData = parseBiometricData(fileContent);

            if (parsedData.length === 0) {
                setFile(null);
                Alert.alert(
                    'Error',
                    'No valid biometric data found in the file',
                );
                return;
            }
            
            // Extract date range from the parsed data
            const dateTimes = parsedData.map(entry => dayjs(entry.dateTime));
            const minDate = dayjs.min(dateTimes);
            const maxDate = dayjs.max(dateTimes);
            
            const startDate = minDate.format('YYYY-MM-DD') + ' 00:00:00';
            const endDate = maxDate.format('YYYY-MM-DD') + ' 23:59:59';
            
            setFrom(startDate);
            setTo(endDate);
            setSelectedStartDate(minDate.toDate());
            setSelectedEndDate(maxDate.toDate());
            
            const groupedData = groupDataByIdAndDate(parsedData);
            const hoursData = calculateHoursLoggedPerDay(groupedData);
            
            if (hoursData.length === 0) {
                setFile(null);
                Alert.alert(
                    'Error',
                    'There is no data available for this time range',
                );
                return;
            }
            // Device ID is optional; can be set separately in the DTR form
            setDeviceID('');
            setHoursLogged(hoursData);
            const uniqueIdList = [
                ...new Set(
                    parsedData.map(entry => entry.id),
                ),
            ];
            setUniqueIds(uniqueIdList);
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                Alert.alert('Cancelled');
            } else {
                Alert.alert('Error', 'Failed to pick the file');
                console.error(err);
            }
        }
    };

    const groupDataByIdAndDate = (parsedData) => {
        return parsedData.reduce((acc, entry) => {
            const date = dayjs(entry.dateTime).format('YYYY-MM-DD');
            if (!acc[entry.id]) {
                acc[entry.id] = {};
            }
            if (!acc[entry.id][date]) {
                acc[entry.id][date] = [];
            }
            // Store full entry including attendanceType
            acc[entry.id][date].push({
                dateTime: entry.dateTime,
                attendanceType: entry.attendanceType,
            });
            return acc;
        }, {});
    };

    const isAfter730 = datetime => {
        const d = dayjs(datetime);
        return d.hour() > 7 || (d.hour() === 7 && d.minute() > 30);
    };

    const calculateHoursLoggedPerDay = groupedData => {
        const result = [];
        Object.keys(groupedData).forEach(id => {
            Object.keys(groupedData[id]).forEach(date => {
                const entries = groupedData[id][date]
                    .slice()
                    .sort((a, b) => dayjs(a.dateTime).diff(dayjs(b.dateTime)));
                
                if (entries.length === 0) return;
                
                // Extract the attendance type from the first entry (all same for this date/id)
                const attendanceType = entries[0].attendanceType;
                const dateTimes = entries.map(e => e.dateTime);
                
                const updateDateTimes = dateTimes.map(item => ({
                    dateTime: item,
                    type: 'bio',
                }));
                
                const firstLogTime = dayjs(dateTimes[0]);
                const lastLogTime = dayjs(dateTimes[dateTimes.length - 1]);
                
                let hours = Math.max(0, lastLogTime.diff(firstLogTime, 'hour', true) - 1);
                
                const idWithoutSpaces = id.replace(/\s/g, '');
                const normalizedId = normalizeBiometricCode(idWithoutSpaces);
                const employee = myEmployees.find(user => {
                    const employeeCode = normalizeBiometricCode(
                        user.code || user.employee_no,
                    );
                    if (employeeCode === normalizedId) return true;
                    return /^\d+$/.test(employeeCode) && /^\d+$/.test(normalizedId)
                        ? employeeCode.replace(/^0+(?=\d)/, '') ===
                              normalizedId.replace(/^0+(?=\d)/, '')
                        : false;
                });
                
                const name = employee
                    ? `${employee.firstname} ${employee.lastname}`
                    : 'No Employee Assigned';
                
                result.push({
                    id: idWithoutSpaces,
                    employee_id: employee?.id || '',
                    code: idWithoutSpaces,
                    name,
                    date,
                    hours: Math.max(0, hours).toFixed(2),
                    logs: updateDateTimes,
                    status: 'auto',
                    type: attendanceType, // Pass attendance type to backend
                });
            });
        });
        return result;
    };

    const viewLogs = () => {
        if (noNameFilter.length > 0) {
            Alert.alert(
                'Unmatched biometric codes',
                `Assign these codes to employees before continuing: ${noNameFilter.join(', ')}`,
            );
            return;
        }
        hoursLogged.sort((a, b) => new Date(a.date) - new Date(b.date));
        const startDate =
            dayjs(selectedStartDate).format('YYYY-MM-DD') + ' 00:00:00';
        const endDate =
            dayjs(selectedEndDate).format('YYYY-MM-DD') + ' 23:59:59';
        const dtr = {
            date_from: startDate,
            date_to: endDate,
            device_id: deviceID,
            file: rawData,
            status: 'new',
            weekly_payroll: weeklyPayroll,
        };
        setLogsSummary({dtr, dtrDetails: hoursLogged});
        navigation.navigate('LogsDetails');
    };

    const handleApplyDateRange = (startDate, endDate) => {
        setSelectedStartDate(startDate);
        setSelectedEndDate(endDate);
    };

    const noName = hoursLogged.filter(obj => obj.employee_id === '');
    const noNameFilter = [
        ...new Set(noName.map(entry => entry.id.replace(/\s/g, ''))),
    ];

    const dateRangeLabel =
        selectedStartDate && selectedEndDate
            ? `${formatDate(selectedStartDate, false, false)} - ${formatDate(
                  selectedEndDate,
              )}`
            : null;

    const dayCount =
        selectedStartDate && selectedEndDate
            ? dayjs(selectedEndDate).diff(dayjs(selectedStartDate), 'day') + 1
            : null;

    const cancelDtr = () => {
        Alert.alert('Cancel DTR', 'Are you sure you want to cancel?', [
            {text: 'No', style: 'cancel'},
            {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: () => {
                    setHoursLogged([]);
                    setShow(false);
                    setFile(null);
                    setSelectedStartDate(undefined);
                },
            },
        ]);
    };

    return (
        <MainContainer>
            <ScrollView contentContainerStyle={{paddingBottom: 40}}>
                <TextComponent style={styles.pageTitle}>
                    Create New DTR
                </TextComponent>

                {/* SETUP */}
                {!show && (
                    <View>
                        {/* Step 1 - upload */}
                        <View style={styles.box}>
                            <TextComponent style={styles.stepTitle}>
                                1. Upload Biometric File
                            </TextComponent>
                            {file ? (
                                <View>
                                    <TextComponent style={styles.value}>
                                        {file}
                                    </TextComponent>
                                    <TouchableOpacity
                                        onPress={handleFileUpload}>
                                        <TextComponent style={styles.link}>
                                            Change file
                                        </TextComponent>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.selectBtn}
                                    onPress={handleFileUpload}>
                                    <TextComponent style={styles.selectBtnText}>
                                        Browse file
                                    </TextComponent>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.mainBtn,
                                (!file || hoursLogged.length === 0) &&
                                    styles.mainBtnDisabled,
                            ]}
                            disabled={!file || hoursLogged.length === 0}
                            onPress={() => setShow(true)}>
                            <TextComponent style={styles.mainBtnText}>
                                Generate Attendance
                            </TextComponent>
                        </TouchableOpacity>
                    </View>
                )}

                {/* RESULTS */}
                {show && (
                    <View>
                        <View style={styles.box}>
                            <TextComponent style={styles.sub}>
                                Period
                            </TextComponent>
                            <TextComponent style={styles.value}>
                                {formatDate(date_from, false, false)} -{' '}
                                {formatDate(date_to)}
                            </TextComponent>
                            <TextComponent style={styles.sub}>
                                {weeklyPayroll === 1 ? 'WEEKLY' : 'MONTHLY'}
                            </TextComponent>
                        </View>

                        {/* stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <TextComponent style={styles.statValue}>
                                    {hoursLogged.length}
                                </TextComponent>
                                <TextComponent style={styles.statLabel}>
                                    Records
                                </TextComponent>
                            </View>
                            <View style={styles.statBox}>
                                <TextComponent style={styles.statValue}>
                                    {uniqueIds.length}
                                </TextComponent>
                                <TextComponent style={styles.statLabel}>
                                    Employees
                                </TextComponent>
                            </View>
                            <View style={styles.statBox}>
                                <TextComponent
                                    style={[
                                        styles.statValue,
                                        noNameFilter.length > 0 && {
                                            color: ERROR_COLOR,
                                        },
                                    ]}>
                                    {noNameFilter.length}
                                </TextComponent>
                                <TextComponent style={styles.statLabel}>
                                    Unmatched
                                </TextComponent>
                            </View>
                        </View>

                        {noNameFilter.length > 0 && (
                            <TouchableOpacity
                                style={styles.alertBox}
                                onPress={() => setShowUnmatchedCodes(true)}>
                                <TextComponent style={styles.alertTitle}>
                                    Unmatched Codes
                                </TextComponent>
                                <TextComponent style={styles.alertSub}>
                                    {noNameFilter.slice(0, 3).join(', ')}
                                    {noNameFilter.length > 3
                                        ? ` +${noNameFilter.length - 3} more`
                                        : ''}
                                </TextComponent>
                            </TouchableOpacity>
                        )}

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={cancelDtr}>
                                <TextComponent style={styles.cancelBtnText}>
                                    Cancel
                                </TextComponent>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.viewBtn}
                                onPress={viewLogs}>
                                <TextComponent style={styles.viewBtnText}>
                                    View Logs
                                </TextComponent>
                            </TouchableOpacity>
                        </View>

                        {/* unmatched modal */}
                        <Modal
                            visible={showUnmatchedCodes}
                            animationType="slide">
                            <View style={styles.modalRoot}>
                                <View style={styles.modalHeader}>
                                    <TextComponent style={styles.modalTitle}>
                                        Unmatched Codes ({noNameFilter.length})
                                    </TextComponent>
                                    <TouchableOpacity
                                        onPress={() =>
                                            setShowUnmatchedCodes(false)
                                        }>
                                        <TextComponent style={styles.close}>
                                            X
                                        </TextComponent>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView
                                    contentContainerStyle={styles.codeWrap}>
                                    {noNameFilter.map((item, i) => (
                                        <View key={i} style={styles.codeChip}>
                                            <TextComponent
                                                style={styles.codeText}>
                                                {item}
                                            </TextComponent>
                                        </View>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity
                                    style={styles.mainBtn}
                                    onPress={() =>
                                        setShowUnmatchedCodes(false)
                                    }>
                                    <TextComponent style={styles.mainBtnText}>
                                        Done
                                    </TextComponent>
                                </TouchableOpacity>
                            </View>
                        </Modal>
                    </View>
                )}
            </ScrollView>
        </MainContainer>
    );
};

const styles = StyleSheet.create({
    pageTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 16},
    box: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#dddddd',
        borderRadius: 6,
        padding: 14,
        marginBottom: 12,
    },
    stepTitle: {fontSize: 14, fontWeight: 'bold', marginBottom: 8},
    value: {fontSize: 14, fontWeight: 'bold', color: '#333333'},
    sub: {fontSize: 12, color: '#777777', marginTop: 2},
    link: {color: PRIMARY_COLOR, marginTop: 6, fontWeight: 'bold'},
    selectBtn: {
        borderWidth: 1,
        borderColor: PRIMARY_COLOR,
        borderRadius: 6,
        borderStyle: 'dashed',
        padding: 12,
        alignItems: 'center',
    },
    selectBtnText: {color: PRIMARY_COLOR, fontWeight: 'bold'},
    payrollRow: {flexDirection: 'row'},
    payrollChip: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 6,
        padding: 12,
        marginRight: 8,
        alignItems: 'center',
    },
    payrollChipActive: {borderColor: PRIMARY_COLOR, backgroundColor: '#e6f5f3'},
    payroll: {color: '#777777'},
    payrollActive: {color: PRIMARY_COLOR, fontWeight: 'bold'},
    mainBtn: {
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 6,
        padding: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    mainBtnDisabled: {backgroundColor: '#cccccc'},
    mainBtnText: {color: '#ffffff', fontWeight: 'bold', fontSize: 15},
    statsRow: {flexDirection: 'row', marginBottom: 12},
    statBox: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#dddddd',
        borderRadius: 6,
        padding: 14,
        marginRight: 8,
        alignItems: 'center',
    },
    statValue: {fontSize: 20, fontWeight: 'bold'},
    statLabel: {fontSize: 11, color: '#777777', marginTop: 2},
    alertBox: {
        backgroundColor: '#fdecec',
        borderWidth: 1,
        borderColor: '#f5c2c2',
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
    },
    alertTitle: {fontWeight: 'bold', color: '#991B1B'},
    alertSub: {fontSize: 12, color: '#cc0000', marginTop: 2},
    actionRow: {flexDirection: 'row'},
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 6,
        padding: 14,
        alignItems: 'center',
        marginRight: 8,
    },
    cancelBtnText: {color: '#555555', fontWeight: 'bold'},
    viewBtn: {
        flex: 2,
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 6,
        padding: 14,
        alignItems: 'center',
    },
    viewBtnText: {color: '#ffffff', fontWeight: 'bold'},
    modalRoot: {flex: 1, backgroundColor: '#ffffff', padding: 16},
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    modalTitle: {fontSize: 16, fontWeight: 'bold'},
    close: {fontSize: 16, fontWeight: 'bold', color: '#777777'},
    codeWrap: {flexDirection: 'row', flexWrap: 'wrap'},
    codeChip: {
        backgroundColor: '#fdecec',
        borderWidth: 1,
        borderColor: '#f5c2c2',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        margin: 4,
    },
    codeText: {color: '#991B1B', fontWeight: 'bold'},
});

export default App;
