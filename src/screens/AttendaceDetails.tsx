//@ts-nocheck
import React, {useEffect, useState} from 'react';
import {
    View,
    FlatList,
    Text,
    Alert,
    StyleSheet,
    PermissionsAndroid,
    Platform,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import axiosConfig from '../utils/axiosConfig';
import {
    Appbar,
    Searchbar,
    TouchableRipple,
    IconButton,
    Badge,
    Menu,
    TextInput,
    FAB,
    Modal,
    Portal,
} from 'react-native-paper';
import useGlobalStore from '../store/globalState';
import {useNavigation} from '@react-navigation/native';
import {formatDate, formatTime} from '../utils/helper';
import {
    RowSeparator,
    Separator,
    TextComponent,
    BottomSheet,
    NumberCounter,
    ButtonComponent,
    MainContainer,
    UpdateHours,
    EarlyInForm,
} from '../components/';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {BORDER_STYLE, BORDER_COLOR, PRIMARY_COLOR} from '../utils/constant';
import {formatName} from '../utils/helper';
import RNFS from 'react-native-fs';
import {zip, zipWithPassword} from 'react-native-zip-archive';
import base64 from 'base-64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {safeJSONParse} from '../utils/helper';
import {fetchDTRDetailsData} from '../utils/databaseService';

const windowHeight = Dimensions.get('window').height;

const password = 'password';

const NAVY_DARK = '#0F172A';
const BRAND_RED = '#D32F2F';
const BG = '#F1F5F9';

const AVATAR_PALETTE = [
    '#7C3AED',
    '#0284C7',
    '#059669',
    '#D97706',
    '#DC2626',
    '#BE185D',
    '#0F766E',
    '#1D4ED8',
];
const getAvatarColor = (seed: any) => {
    const s = String(seed ?? '');
    return AVATAR_PALETTE[(s.charCodeAt(0) || 0) % AVATAR_PALETTE.length];
};
const getInitials = (first: string, last: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?';

/* ── Push-to-cloud confirmation modal ───────────────────────────────────── */
interface PushModalProps {
    visible: boolean;
    onDismiss: () => void;
    onConfirm: (branchId: number) => void;
    totalEmployees: number;
    totalRecords: number;
    drafts: {name: string; ready: number; total: number}[];
}

const PushModal: React.FC<PushModalProps> = ({
    visible,
    onDismiss,
    onConfirm,
    totalEmployees,
    totalRecords,
    drafts,
}) => {
    const hasDrafts = drafts.length > 0;
    const [branches, setBranches] = React.useState([]);
    const [selectedBranch, setSelectedBranch] = React.useState(null);
    const [loadingBranches, setLoadingBranches] = React.useState(false);

    React.useEffect(() => {
        if (visible) {
            setLoadingBranches(true);
            axiosConfig
                .get('?action=mobile-get-branches')
                .then(r => {
                    const list = r.data?.data || [];
                    setBranches(list);
                    if (list.length === 1) {
                        setSelectedBranch(list[0]);
                    } else {
                        setSelectedBranch(null);
                    }
                })
                .catch(() => {})
                .finally(() => setLoadingBranches(false));
        }
    }, [visible]);

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={pushStyles.modal}>
                <View style={pushStyles.iconWrap}>
                    <MaterialIcons
                        name="cloud-upload"
                        size={26}
                        color={BRAND_RED}
                    />
                </View>
                <TextComponent style={pushStyles.title}>
                    Push to Cloud
                </TextComponent>
                <TextComponent style={pushStyles.subtitle}>
                    {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''} ·{' '}
                    {totalRecords} record
                    {totalRecords !== 1 ? 's' : ''}
                </TextComponent>

                {/* Branch selection */}
                <View style={pushStyles.branchSection}>
                    <TextComponent style={pushStyles.branchLabel}>
                        Select Branch
                    </TextComponent>
                    {loadingBranches ? (
                        <ActivityIndicator
                            size="small"
                            color={PRIMARY_COLOR}
                            style={{marginTop: 8}}
                        />
                    ) : (
                        branches.map(b => (
                            <TouchableRipple
                                key={b.id}
                                onPress={() => setSelectedBranch(b)}
                                style={[
                                    pushStyles.branchRow,
                                    selectedBranch?.id === b.id &&
                                        pushStyles.branchRowSelected,
                                ]}>
                                <View style={pushStyles.branchRowInner}>
                                    <MaterialIcons
                                        name={
                                            selectedBranch?.id === b.id
                                                ? 'radio-button-checked'
                                                : 'radio-button-unchecked'
                                        }
                                        size={18}
                                        color={
                                            selectedBranch?.id === b.id
                                                ? PRIMARY_COLOR
                                                : '#94A3B8'
                                        }
                                    />
                                    <TextComponent
                                        style={pushStyles.branchName}>
                                        {b.branch_name}
                                    </TextComponent>
                                </View>
                            </TouchableRipple>
                        ))
                    )}
                </View>

                {hasDrafts ? (
                    <View style={pushStyles.warnBox}>
                        <View style={pushStyles.warnHeader}>
                            <MaterialIcons
                                name="error-outline"
                                size={16}
                                color="#D97706"
                            />
                            <TextComponent style={pushStyles.warnTitle}>
                                {drafts.length} with draft records
                            </TextComponent>
                        </View>
                        <ScrollView
                            style={pushStyles.draftList}
                            showsVerticalScrollIndicator={false}>
                            {drafts.map((e, i) => (
                                <View key={i} style={pushStyles.draftRow}>
                                    <TextComponent
                                        style={pushStyles.draftName}
                                        numberOfLines={1}>
                                        {e.name}
                                    </TextComponent>
                                    <View style={pushStyles.draftBadge}>
                                        <TextComponent
                                            style={pushStyles.draftBadgeText}>
                                            {e.ready}/{e.total}
                                        </TextComponent>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                ) : (
                    <View style={pushStyles.readyBox}>
                        <MaterialIcons
                            name="check-circle"
                            size={16}
                            color="#16A34A"
                        />
                        <TextComponent style={pushStyles.readyText}>
                            All records are ready to push
                        </TextComponent>
                    </View>
                )}

                <View style={pushStyles.actions}>
                    <TouchableRipple
                        onPress={onDismiss}
                        rippleColor="rgba(0,0,0,0.06)"
                        style={pushStyles.cancelBtn}>
                        <TextComponent style={pushStyles.cancelText}>
                            Cancel
                        </TextComponent>
                    </TouchableRipple>
                    <TouchableRipple
                        onPress={() =>
                            selectedBranch && onConfirm(selectedBranch.id)
                        }
                        rippleColor="rgba(255,255,255,0.2)"
                        style={[
                            pushStyles.confirmBtn,
                            !selectedBranch && pushStyles.confirmBtnDisabled,
                        ]}>
                        <View style={pushStyles.confirmInner}>
                            <MaterialIcons
                                name="cloud-upload"
                                size={16}
                                color="#fff"
                            />
                            <TextComponent style={pushStyles.confirmText}>
                                {hasDrafts ? 'Push Anyway' : 'Push'}
                            </TextComponent>
                        </View>
                    </TouchableRipple>
                </View>
            </Modal>
        </Portal>
    );
};

const pushStyles = StyleSheet.create({
    modal: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 24,
        borderRadius: 22,
        paddingHorizontal: 22,
        paddingTop: 24,
        paddingBottom: 18,
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.18,
        shadowRadius: 20,
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: `${BRAND_RED}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: NAVY_DARK,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 3,
        marginBottom: 16,
    },
    warnBox: {
        width: '100%',
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 14,
        padding: 12,
        marginBottom: 18,
    },
    warnHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    warnTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#92400E',
    },
    draftList: {
        maxHeight: 132,
    },
    draftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderTopWidth: 1,
        borderTopColor: '#FEF3C7',
    },
    draftName: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        marginRight: 10,
    },
    draftBadge: {
        backgroundColor: '#FEF3C7',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    draftBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400E',
    },
    readyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        width: '100%',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 18,
    },
    readyText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#16A34A',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        overflow: 'hidden',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    confirmBtn: {
        flex: 1.4,
        backgroundColor: BRAND_RED,
        borderRadius: 12,
        overflow: 'hidden',
    },
    confirmInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 13,
    },
    confirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    confirmBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    branchSection: {
        width: '100%',
        marginBottom: 14,
    },
    branchLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 6,
    },
    branchRow: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 6,
        overflow: 'hidden',
    },
    branchRowSelected: {
        borderColor: PRIMARY_COLOR,
        backgroundColor: '#e6f5f3',
    },
    branchRowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
    },
    branchName: {
        fontSize: 14,
        color: '#374151',
    },
});

interface Employee {
    id: string;
    firstname: string;
    lastname: string;
    employee_no: string;
}

type LogEntry = {
    dateTime: string;
    type: string;
};

type HoursLogged = {
    id: string;
    date: string;
    hours: string;
    logs: LogEntry[];
    status: string;
    employee_id: string;
    date_time: any;
    firstname: string;
    middlename: string;
    lastname: string;
    ot?: number;
    notes?: string; // Added notes field
};

interface Detail {
    date: string;
    hours: string;
    logs: any[];
    status: string;
    notes?: string; // Added notes field
}

interface GroupedItem {
    id: string;
    details: Detail[];
}

interface ModalState {
    visible: boolean;
    details: any;
}

type EmployeeCart = {
    id: number;
};

type SortOption = 'name' | 'date' | 'hours' | 'employee_id';

const AttendaceDetails = () => {
    const navigation = useNavigation();
    const {
        attendanceSummary,
        myEmployees,
        pushDTR,
        dtr,
        setAttendanceSummary,
        updateLogsDTR,
        updateLogsDTRHours,
        updateLogsDTRDetailsAction,
        isertMyDTRDetailsAction,
        success,
        setSuccess,
        setMessage,
        deleteMyDTRDetailsDataAction,
        setLoading,
        loading,
        updateLogsDTRArray,
    } = useGlobalStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearch, setIsSearch] = useState(false);
    const [action, setAction] = useState(false);
    const [action2, setAction2] = useState(false);
    const [pushModal, setPushModal] = useState(false);
    const [manualLogs, setManualogs] = useState(false);
    const [selectDate, setSelectDate] = useState(false);
    const [selectTime, setSelectTime] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState([]);
    const [isEmployee, setEmployee] = useState(false);
    const [employeeSelected, setEmployeeSelected] = useState({});
    const [sortMenuVisible, setSortMenuVisible] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [notesModal, setNotesModal] = useState<ModalState>({
        visible: false,
        details: null,
    });
    const [noteText, setNoteText] = useState('');
    // Add these states near your other state declarations
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Add these functions
    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }

            // Auto-exit selection mode if no items selected
            if (newSet.size === 0) {
                setIsSelectionMode(false);
            }

            return newSet;
        });
    };

    const selectAllItems = () => {
        if (value === 'list') {
            const allIds = summary.map(
                item => item.id.toString() + item.date_time.toString(),
            );
            setSelectedItems(new Set(allIds));
        } else {
            const allIds = byEmployees.flatMap((item: GroupedItem) =>
                item.details.map(
                    detail =>
                        detail.id?.toString() ||
                        `${item.employee_id}-${detail.date_time}`,
                ),
            );
            setSelectedItems(new Set(allIds));
        }
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
        setIsSelectionMode(false);
    };

    const isItemSelected = (itemId: string) => {
        return selectedItems.has(itemId);
    };

    const getLogs = async () => {
        const details = await fetchDTRDetailsData(dtr?.id);
        setAttendanceSummary(details);
        setManualogs(false);
    };

    if (success?.visible && success.type === 'add-logs') {
        getLogs();
        setSuccess({visible: false, type: ''});
    }

    const [ot, setOT] = useState<ModalState>({visible: false, details: null});
    const [ei, setEI] = useState<ModalState>({visible: false, details: null});
    const [hoursDuty, setHoursDuty] = useState<ModalState>({
        visible: false,
        details: null,
    });
    useEffect(() => {
        if (searchQuery) {
            // const filteredData = new_data.filter(
            //     item =>
            //         item.firstname
            //             .toLowerCase()
            //             .includes(searchQuery.toLowerCase()) ||
            //         item.lastname
            //             .toLowerCase()
            //             .includes(searchQuery.toLowerCase()) ||
            //         item.employee_id
            //             .toLowerCase()
            //             .includes(searchQuery.toLowerCase()),
            // );
            // setSummary(filteredData);
        } else {
            setSummary(attendanceSummary);
        }
    }, [attendanceSummary]);

    const [summary, setSummary] = useState([]);

    // Enhanced sorting functionality
    const sortData = (data: HoursLogged[]) => {
        const sortedData = [...data].sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
                    const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
                    comparison = nameA.localeCompare(nameB);
                    break;
                case 'date':
                    comparison =
                        new Date(a.date_time).getTime() -
                        new Date(b.date_time).getTime();
                    break;
                case 'hours':
                    comparison = parseFloat(a.hours) - parseFloat(b.hours);
                    break;
                case 'employee_id':
                    comparison = a.employee_id.localeCompare(b.employee_id);
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return sortedData;
    };

    const groupedData = summary.reduce((acc: any, obj: any) => {
        const name = formatName(obj.firstname, obj.lastname, obj.middlename);
        const {employee_id, code, ...rest} = obj;
        if (!acc[employee_id]) {
            acc[employee_id] = {employee_id, name, code, details: [rest]};
        } else {
            acc[employee_id].details.push(rest);
        }
        return acc;
    }, {});

    const byEmployees: any = Object.values(groupedData);

    // Enhanced hours calculation with half-day support
    const calculateHoursWithHalfDay = (logs: LogEntry[]) => {
        if (!logs || logs.length === 0) {
            return '0.00';
        }

        const sortedLogs = [...logs].sort(
            (a, b) =>
                new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
        );

        const firstLog = dayjs(sortedLogs[0].dateTime);
        const lastLog = dayjs(sortedLogs[sortedLogs.length - 1].dateTime);

        let hours = lastLog.diff(firstLog, 'hour', true) - 1;
        hours = Math.max(0, hours);

        // Apply half-day calculation (4.5625 hours)
        const HALF_DAY_HOURS = 4.5625;
        if (hours <= HALF_DAY_HOURS) {
            return hours.toFixed(2);
        }

        return hours.toFixed(2);
    };

    const renderItem = ({item}: {item: HoursLogged}) => {
        const logsArray = safeJSONParse(item.logs);
        const itemId = item.id.toString() + item.date_time.toString();
        const isSelected = isSelectionMode && isItemSelected(itemId);
        const hours = parseFloat(item.hours) || 0;
        const isHalfDay = hours > 0 && hours <= 4.5625;
        const hasBio =
            Array.isArray(logsArray) &&
            logsArray.some((l: any) => l.type === 'bio');
        const hasManual =
            Array.isArray(logsArray) &&
            logsArray.some((l: any) => l.type === 'manual');
        const barColor =
            hasManual && !hasBio
                ? '#DC2626'
                : hasManual
                ? '#F59E0B'
                : '#0D9488';
        const initials = getInitials(item.firstname, item.lastname);
        const avatarBg = getAvatarColor(
            item.employee_id || item.firstname || 'X',
        );

        return (
            <TouchableRipple
                style={[styles.listCard, isSelected && styles.listCardSelected]}
                rippleColor={`${BRAND_RED}08`}
                onPress={() => {
                    if (isSelectionMode) {
                        toggleItemSelection(itemId);
                    } else {
                        setAction2(true);
                        setOT({visible: false, details: item});
                    }
                }}
                onLongPress={() => {
                    setIsSelectionMode(true);
                    toggleItemSelection(itemId);
                }}>
                <View style={styles.cardInner}>
                    {/* left color bar */}
                    <View
                        style={[
                            styles.colorBar,
                            {
                                backgroundColor: isSelected
                                    ? BRAND_RED
                                    : barColor,
                            },
                        ]}
                    />

                    {/* selection checkbox (selection mode) */}
                    {isSelectionMode && (
                        <View
                            style={[
                                styles.selectBox,
                                isSelected && styles.selectBoxActive,
                            ]}>
                            {isSelected && (
                                <MaterialIcons
                                    name="check"
                                    size={15}
                                    color="#fff"
                                />
                            )}
                        </View>
                    )}

                    {/* avatar */}
                    <View
                        style={[
                            styles.avatarCircle,
                            {backgroundColor: avatarBg},
                            isSelected && styles.avatarDim,
                        ]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                        {isSelected && (
                            <View style={styles.avatarCheck}>
                                <MaterialIcons
                                    name="check"
                                    size={11}
                                    color="#fff"
                                />
                            </View>
                        )}
                    </View>

                    {/* content */}
                    <View style={styles.cardContent}>
                        {/* row 1: name + hours */}
                        <View style={styles.cardRow1}>
                            <TextComponent
                                style={styles.empName}
                                numberOfLines={1}>
                                {formatName(
                                    item.firstname,
                                    item.lastname,
                                    item.middlename,
                                )}
                            </TextComponent>
                            <View
                                style={[
                                    styles.hoursBadge,
                                    isHalfDay && styles.hoursBadgeHalf,
                                ]}>
                                <MaterialIcons
                                    name="schedule"
                                    size={12}
                                    color={isHalfDay ? '#92400E' : '#0D9488'}
                                />
                                <TextComponent
                                    style={[
                                        styles.hoursVal,
                                        isHalfDay && styles.hoursValHalf,
                                    ]}>
                                    {item.hours}h{isHalfDay ? ' ½' : ''}
                                </TextComponent>
                            </View>
                        </View>

                        {/* row 2: id · date */}
                        <View style={styles.cardRow2}>
                            <View style={styles.metaChip}>
                                <MaterialIcons
                                    name="badge"
                                    size={11}
                                    color="#94A3B8"
                                />
                                <TextComponent style={styles.metaText}>
                                    {item.employee_id}
                                </TextComponent>
                            </View>
                            <View style={styles.metaDot} />
                            <View style={styles.metaChip}>
                                <MaterialIcons
                                    name="event"
                                    size={11}
                                    color="#94A3B8"
                                />
                                <TextComponent style={styles.metaText}>
                                    {dayjs(item.date_time).format('ddd, MMM D')}
                                </TextComponent>
                            </View>
                        </View>

                        {/* row 3: status + OT/EI */}
                        <View style={styles.badgesRow}>
                            <View
                                style={[
                                    styles.statusBadge,
                                    item.isCheck
                                        ? styles.statusReady
                                        : styles.statusDraft,
                                ]}>
                                <MaterialIcons
                                    name={
                                        item.isCheck
                                            ? 'check-circle'
                                            : 'schedule'
                                    }
                                    size={11}
                                    color={item.isCheck ? '#16A34A' : '#F59E0B'}
                                />
                                <TextComponent
                                    style={[
                                        styles.statusText,
                                        {
                                            color: item.isCheck
                                                ? '#16A34A'
                                                : '#F59E0B',
                                        },
                                    ]}>
                                    {item.isCheck ? 'Ready' : 'Draft'}
                                </TextComponent>
                            </View>
                            {item.ei > 0 && (
                                <View style={styles.otBadge}>
                                    <TextComponent style={styles.otBadgeText}>
                                        +{item.ei} EI
                                    </TextComponent>
                                </View>
                            )}
                            {item.ot > 0 && (
                                <View style={styles.otBadge}>
                                    <TextComponent style={styles.otBadgeText}>
                                        +{item.ot} OT
                                    </TextComponent>
                                </View>
                            )}
                        </View>

                        {/* row 4: log chips */}
                        {Array.isArray(logsArray) && logsArray.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.chipsRow}>
                                {logsArray.map((log: any, i: number) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.logChip,
                                            log.type === 'bio'
                                                ? styles.bioChip
                                                : styles.manualChip,
                                        ]}>
                                        <MaterialIcons
                                            name={
                                                log.type === 'bio'
                                                    ? 'fingerprint'
                                                    : 'keyboard'
                                            }
                                            size={11}
                                            color={
                                                log.type === 'bio'
                                                    ? '#0D9488'
                                                    : '#DC2626'
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.logTime,
                                                {
                                                    color:
                                                        log.type === 'bio'
                                                            ? '#0D9488'
                                                            : '#DC2626',
                                                },
                                            ]}>
                                            {formatTime(log.dateTime)}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        {/* note preview */}
                        {item.notes && (
                            <View style={styles.notePreviewRow}>
                                <MaterialIcons
                                    name="sticky-note-2"
                                    size={11}
                                    color="#94A3B8"
                                />
                                <TextComponent
                                    style={styles.notePreviewText}
                                    numberOfLines={1}>
                                    {item.notes}
                                </TextComponent>
                            </View>
                        )}
                    </View>

                    {/* note button (hidden during selection) */}
                    {!isSelectionMode && (
                        <TouchableRipple
                            borderless
                            style={styles.noteActionBtn}
                            onPress={() => {
                                setNoteText(item.notes || '');
                                setNotesModal({visible: true, details: item});
                            }}>
                            <MaterialIcons
                                name="note-add"
                                size={18}
                                color="#CBD5E1"
                            />
                        </TouchableRipple>
                    )}
                </View>
            </TouchableRipple>
        );
    };
    const calculateTotalHours = (details: Detail[]): number => {
        return details.reduce((total, detail) => {
            return total + parseFloat(detail.hours);
        }, 0);
    };

    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleExpansion = (employeeId: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(employeeId)) {
                newSet.delete(employeeId);
            } else {
                newSet.add(employeeId);
            }
            return newSet;
        });
    };

    const renderItemEmployee = ({item}: {item: GroupedItem}) => {
        const isExpanded = expandedItems.has(item.employee_id);

        const calculateTotalDays = (details: any[]) => {
            let totalDays = 0;
            details.forEach(detail => {
                const hours = parseFloat(detail.hours) || 0;
                let days = hours === 8 ? 1 : hours === 4.5625 ? 0.5 : hours / 8;
                if (hours === 4.5625 && details.length === 6) {
                    totalDays += 0.56;
                } else {
                    totalDays += days > 1 ? 1 : days;
                }
            });
            return totalDays;
        };

        const totalDays = calculateTotalDays(item.details);
        const readyCount = item.details.filter((d: any) => d.isCheck).length;
        const totalCount = item.details.length;
        const allReady = readyCount === totalCount;
        const nameParts = (item.name || '').split(' ');
        const initials = getInitials(
            nameParts[0] || '',
            nameParts[nameParts.length - 1] || '',
        );
        const avatarBg = getAvatarColor(item.employee_id || '');

        const allSelected = item.details.every((d: any) =>
            isItemSelected(
                d.id?.toString() || `${item.employee_id}-${d.date_time}`,
            ),
        );

        return (
            <View style={styles.empCard}>
                <TouchableRipple
                    onPress={() => toggleExpansion(item.employee_id)}
                    rippleColor={`${BRAND_RED}08`}>
                    <View style={styles.empHeader}>
                        {/* color bar */}
                        <View
                            style={[
                                styles.empColorBar,
                                {
                                    backgroundColor: allReady
                                        ? '#16A34A'
                                        : '#F59E0B',
                                },
                            ]}
                        />

                        {isSelectionMode && (
                            <IconButton
                                icon={
                                    allSelected
                                        ? 'check-circle'
                                        : 'checkbox-blank-circle-outline'
                                }
                                iconColor={allSelected ? BRAND_RED : '#CBD5E1'}
                                size={20}
                                style={{margin: 0}}
                                onPress={() => {
                                    const ids = item.details.map(
                                        (d: any) =>
                                            d.id?.toString() ||
                                            `${item.employee_id}-${d.date_time}`,
                                    );
                                    const newSet = new Set(selectedItems);
                                    ids.forEach((id: string) =>
                                        allSelected
                                            ? newSet.delete(id)
                                            : newSet.add(id),
                                    );
                                    setSelectedItems(newSet);
                                }}
                            />
                        )}

                        {/* avatar */}
                        <View
                            style={[
                                styles.avatarCircle,
                                {
                                    backgroundColor: avatarBg,
                                    marginLeft: 12,
                                    marginRight: 10,
                                },
                            ]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>

                        {/* info */}
                        <View style={styles.empInfo}>
                            <TextComponent
                                style={styles.empName2}
                                numberOfLines={1}>
                                {item.name}
                            </TextComponent>
                            <View style={styles.empMetaRow}>
                                <View style={styles.metaChip}>
                                    <MaterialIcons
                                        name="badge"
                                        size={10}
                                        color="#94A3B8"
                                    />
                                    <TextComponent style={styles.metaText}>
                                        {item.code}
                                    </TextComponent>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        allReady
                                            ? styles.statusReady
                                            : styles.statusDraft,
                                    ]}>
                                    <MaterialIcons
                                        name="check-circle"
                                        size={10}
                                        color={allReady ? '#16A34A' : '#F59E0B'}
                                    />
                                    <TextComponent
                                        style={[
                                            styles.statusText,
                                            {
                                                color: allReady
                                                    ? '#16A34A'
                                                    : '#F59E0B',
                                            },
                                        ]}>
                                        {readyCount}/{totalCount}
                                    </TextComponent>
                                </View>
                            </View>
                        </View>

                        {/* right */}
                        <View style={styles.empRight}>
                            <View style={styles.daysBadge}>
                                <MaterialIcons
                                    name="event"
                                    size={12}
                                    color="#64748B"
                                />
                                <TextComponent style={styles.daysText}>
                                    {totalDays.toFixed(1)}d
                                </TextComponent>
                            </View>
                            {!isSelectionMode && (
                                <MaterialIcons
                                    name={
                                        isExpanded
                                            ? 'expand-less'
                                            : 'expand-more'
                                    }
                                    size={20}
                                    color="#94A3B8"
                                />
                            )}
                        </View>
                    </View>
                </TouchableRipple>

                {/* Expanded detail rows */}
                {isExpanded && !isSelectionMode && (
                    <View style={styles.detailsWrap}>
                        {item.details.map((detail: any, idx: number) => {
                            const logsArray = safeJSONParse(detail.logs);
                            const dispHours = parseFloat(detail.hours) || 0;
                            const isHalfDay =
                                dispHours > 0 && dispHours <= 4.5625;
                            const detailId =
                                detail.id?.toString() ||
                                `${item.employee_id}-${detail.date_time}`;
                            return (
                                <View key={idx} style={styles.detailRow}>
                                    {/* date + controls */}
                                    <View style={styles.detailTop}>
                                        <View style={styles.detailDateWrap}>
                                            <MaterialIcons
                                                name="calendar-today"
                                                size={12}
                                                color="#64748B"
                                            />
                                            <TextComponent
                                                style={styles.detailDate}>
                                                {dayjs(detail.date_time).format(
                                                    'ddd, MMM D',
                                                )}
                                            </TextComponent>
                                        </View>
                                        <View style={styles.detailRight}>
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    detail.isCheck
                                                        ? styles.statusReady
                                                        : styles.statusDraft,
                                                ]}>
                                                <MaterialIcons
                                                    name={
                                                        detail.isCheck
                                                            ? 'check-circle'
                                                            : 'radio-button-unchecked'
                                                    }
                                                    size={10}
                                                    color={
                                                        detail.isCheck
                                                            ? '#16A34A'
                                                            : '#F59E0B'
                                                    }
                                                />
                                                <TextComponent
                                                    style={[
                                                        styles.statusText,
                                                        {
                                                            color: detail.isCheck
                                                                ? '#16A34A'
                                                                : '#F59E0B',
                                                        },
                                                    ]}>
                                                    {detail.isCheck
                                                        ? 'Ready'
                                                        : 'Draft'}
                                                </TextComponent>
                                            </View>
                                            <View
                                                style={[
                                                    styles.hoursBadge,
                                                    isHalfDay &&
                                                        styles.hoursBadgeHalf,
                                                ]}>
                                                <TextComponent
                                                    style={[
                                                        styles.hoursVal,
                                                        isHalfDay &&
                                                            styles.hoursValHalf,
                                                    ]}>
                                                    {detail.hours}h
                                                    {isHalfDay ? ' ½' : ''}
                                                </TextComponent>
                                            </View>
                                            {detail.ot > 0 && (
                                                <View style={styles.otBadge}>
                                                    <TextComponent
                                                        style={
                                                            styles.otBadgeText
                                                        }>
                                                        +{detail.ot}OT
                                                    </TextComponent>
                                                </View>
                                            )}
                                            {detail.ei > 0 && (
                                                <View style={styles.otBadge}>
                                                    <TextComponent
                                                        style={
                                                            styles.otBadgeText
                                                        }>
                                                        +{detail.ei}EI
                                                    </TextComponent>
                                                </View>
                                            )}
                                            <IconButton
                                                icon="dots-vertical"
                                                size={16}
                                                style={{margin: 0}}
                                                onPress={() => {
                                                    setAction2(true);
                                                    setOT({
                                                        visible: false,
                                                        details: {
                                                            ...detail,
                                                            employee_id:
                                                                detail?.id,
                                                        },
                                                    });
                                                }}
                                            />
                                        </View>
                                    </View>

                                    {/* log chips */}
                                    {Array.isArray(logsArray) &&
                                        logsArray.length > 0 && (
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={
                                                    false
                                                }
                                                contentContainerStyle={
                                                    styles.chipsRow
                                                }>
                                                {logsArray.map(
                                                    (log: any, li: number) => (
                                                        <View
                                                            key={li}
                                                            style={[
                                                                styles.logChip,
                                                                log.type ===
                                                                'bio'
                                                                    ? styles.bioChip
                                                                    : styles.manualChip,
                                                            ]}>
                                                            <MaterialIcons
                                                                name={
                                                                    log.type ===
                                                                    'bio'
                                                                        ? 'fingerprint'
                                                                        : 'keyboard'
                                                                }
                                                                size={10}
                                                                color={
                                                                    log.type ===
                                                                    'bio'
                                                                        ? '#0D9488'
                                                                        : '#DC2626'
                                                                }
                                                            />
                                                            <Text
                                                                style={[
                                                                    styles.logTime,
                                                                    {
                                                                        color:
                                                                            log.type ===
                                                                            'bio'
                                                                                ? '#0D9488'
                                                                                : '#DC2626',
                                                                    },
                                                                ]}>
                                                                {formatTime(
                                                                    log.dateTime,
                                                                )}
                                                            </Text>
                                                        </View>
                                                    ),
                                                )}
                                            </ScrollView>
                                        )}

                                    {/* IN/OUT summary */}
                                    {Array.isArray(logsArray) &&
                                        logsArray.length >= 2 && (
                                            <TextComponent
                                                style={styles.inOutSummary}>
                                                IN{' '}
                                                {formatTime(
                                                    logsArray[0].dateTime,
                                                )}{' '}
                                                → OUT{' '}
                                                {formatTime(
                                                    logsArray[
                                                        logsArray.length - 1
                                                    ].dateTime,
                                                )}
                                            </TextComponent>
                                        )}

                                    {detail.notes && (
                                        <View style={styles.notePreviewRow}>
                                            <MaterialIcons
                                                name="sticky-note-2"
                                                size={10}
                                                color="#94A3B8"
                                            />
                                            <TextComponent
                                                style={styles.notePreviewText}
                                                numberOfLines={1}>
                                                {detail.notes}
                                            </TextComponent>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    const [value, setValue] = React.useState('list');

    const hadleSearch = (value: any) => {
        if (value) {
            setSummary(
                summary.filter(
                    item =>
                        item.firstname
                            .toLowerCase()
                            .includes(value.toLowerCase()) ||
                        item.lastname
                            .toLowerCase()
                            .includes(value.toLowerCase()),
                ),
            );
        } else {
            setSummary(attendanceSummary);
        }

        setSearchQuery(value);
    };

    // Apply sorting when sort options change
    useEffect(() => {
        if (summary.length > 0) {
            const sortedSummary = sortData(summary);
            setSummary(sortedSummary);
        }
    }, [sortBy, sortOrder]);

    useEffect(() => {
        requestExternalStoragePermission();
    }, []);

    const requestExternalStoragePermission = async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'External Storage Write Permission',
                        message:
                            'App needs access to write to external storage',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        } catch (err) {
            console.warn(err);
            return false;
        }
    };

    const addEarlyIn = () => {
        try {
            let logs = safeJSONParse(ot?.details?.logs);
            const first_in = logs?.[0]?.dateTime; // e.g. "2025-11-01T07:10:00"

            if (!first_in) {
                Alert.alert('No log found');
                return;
            }

            // Create reference 7:30 AM time on same date
            const earlyTime = new Date(first_in);
            earlyTime.setHours(7, 30, 0, 0);

            // Calculate diff in milliseconds
            const diffMs = new Date(first_in) - earlyTime;

            // Convert to hours
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 0) {
                const earlyInHours = Math.abs(diffHours.toFixed(2));
                setEI({...ot, visible: true, earlyInHours: earlyInHours});
            } else {
                Alert.alert('No Early In', 'You arrived on time or late.');
            }
            setAction2(false);
        } catch (error) {
            setAction2(false);
            console.error('Error in addEarlyIn:', error);
            Alert.alert(
                'Error',
                'Something went wrong while checking early in.',
            );
        }
    };

    const addOvertime = () => {
        setAction2(false);
        setOT({...ot, visible: true});
    };

    const updateTime = () => {
        setAction2(false);
        setHoursDuty({...hoursDuty, visible: true, details: ot?.details});
    };

    const saveOt = async (value: any) => {
        setOT({visible: false, details: null});
        setLoading({
            visible: true,
            message: 'Updating records',
        });
        let new_data = [...attendanceSummary];
        const index = new_data.findIndex(
            (item: any) => item.id === ot?.details.id,
        );
        if (index !== -1) {
            // Update the database first
            await updateLogsDTR({id: ot?.details.id, ot: value});

            // Then update local state
            new_data[index] = {
                ...new_data[index],
                ot: value,
            };
            setAttendanceSummary(new_data);

            // Re-apply search filter if there's an active search
            if (searchQuery) {
                const filteredData = new_data.filter(
                    item =>
                        item.firstname
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        item.lastname
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        item.employee_id
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                );
                setSummary(filteredData);
            } else {
                setSummary(new_data);
            }
        }

        setLoading({visible: false, message: ''});
    };

    const saveEI = async (value: any) => {
        setEI({visible: false, details: null});
        setLoading({
            visible: true,
            message: 'Updating records',
        });
        let new_data = [...attendanceSummary];
        const index = new_data.findIndex(
            (item: any) => item.id === ot?.details.id,
        );
        if (index !== -1) {
            // Update the database first
            await updateLogsDTR({id: ot?.details.id, ei: value});

            // Then update local state
            new_data[index] = {
                ...new_data[index],
                ei: value,
            };
            console.log('new_data ---->', new_data);
            setAttendanceSummary(new_data);

            if (searchQuery) {
                const filteredData = new_data.filter(
                    item =>
                        item.firstname
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        item.lastname
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        item.employee_id
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                );
                setSummary(filteredData);
            } else {
                setSummary(new_data);
            }
        }

        setLoading({visible: false, message: ''});
    };

    const saveNewTime = async (value: any) => {
        setHoursDuty({visible: false, details: null});
        setAction2(false);
        //setHoursDuty({...hoursDuty, visible: true, details: ot?.details});
        let new_data = [...attendanceSummary];
        const index = new_data.findIndex(
            (item: any) => item.id === ot?.details.id,
        );
        if (index !== -1) {
            await updateLogsDTR({id: ot?.details.id, hours: value});
            new_data[index].hours = value;
        }
        setAttendanceSummary(new_data);
        // if (searchQuery) {
        //     const filteredData = new_data.filter(
        //         item =>
        //             item.firstname
        //                 .toLowerCase()
        //                 .includes(searchQuery.toLowerCase()) ||
        //             item.lastname
        //                 .toLowerCase()
        //                 .includes(searchQuery.toLowerCase()) ||
        //             item.employee_id
        //                 .toLowerCase()
        //                 .includes(searchQuery.toLowerCase()),
        //     );
        //     setSummary(filteredData);
        // } else {
        //     setSummary(new_data);
        // }
    };

    const onselectDate = (date: Date) => {
        setSelectDate(false);
        setSelectedDate(dayjs(date).format('YYYY-MM-DD'));
    };

    const onselectTime = (date: Date) => {
        setSelectTime(false);
        const new_time = dayjs(date).format('HH:mm:ss');
        let fomatted_time = selectedDate + ' ' + new_time;
        setSelectedTime(oldData => [...oldData, fomatted_time]);
    };

    const deleteTime = (index: any) => {
        const newData = selectedTime.filter(item => item !== index);
        setSelectedTime(newData);
    };

    const handleSubmit = () => {
        for (let index = 0; index < employeeSelectedCart.length; index++) {
            const prevIndex = attendanceSummary.findIndex(
                (item: any) =>
                    item.date_time === selectedDate &&
                    item.employee_id === employeeSelectedCart[index],
            );

            if (prevIndex !== -1) {
                let old_data = JSON.parse(attendanceSummary[prevIndex].logs);
                let new_data: any = [];
                selectedTime.forEach(item => {
                    new_data.push({
                        dateTime: item,
                        type: 'manual',
                    });
                });
                let mergedArray = [...old_data, ...new_data];
                mergedArray.sort((a, b) => {
                    return new Date(a.dateTime) - new Date(b.dateTime);
                });
                const hours = calculateHoursWithHalfDay(mergedArray);
                updateLogsDTRDetailsAction({
                    id: attendanceSummary[prevIndex].id,
                    logs: mergedArray,
                    hours: hours,
                });
            } else {
                let new_data: any = [];
                selectedTime.forEach(item => {
                    new_data.push({
                        dateTime: item,
                        type: 'manual',
                    });
                });
                const hours = calculateHoursWithHalfDay(new_data);
                // isertMyDTRDetailsAction({
                //     id: dtr?.id,
                //     employee_id: employeeSelectedCart[index],
                //     date_time: selectedDate,
                //     hours: hours,
                //     logs: JSON.stringify(new_data),
                // });
            }
        }
        setSelectedDate('');
        setEmployeeSelectedCart([]);
        setSelectedTime([]);
        setManualogs(false);
    };

    const removeManualLogs = () => {
        setAction2(false);
        let logs = safeJSONParse(ot?.details?.logs);
        let manual_logs = logs.filter((item: any) => item.type === 'manual');
        if (manual_logs.length === 0) {
            setMessage({
                visible: true,
                message: 'No Manual logs found',
                type: 'error',
            });
            return;
        }
        let bio_logs = logs.filter((item: any) => item.type === 'bio');
        if (bio_logs.length === 0) {
            deleteMyDTRDetailsDataAction({
                id: ot?.details?.id,
            });
            return;
        }
        const hours = calculateHoursWithHalfDay(bio_logs);
        updateLogsDTRDetailsAction({
            id: ot?.details?.id,
            logs: bio_logs,
            hours: hours,
        });
    };

    const [employeeSelectedCart, setEmployeeSelectedCart] = useState([]);
    const selectEmployee = (employee: Employee) => {
        setEmployeeSelectedCart((prevCart: any) => {
            const newCart = prevCart.includes(employee.id)
                ? prevCart.filter((id: any) => id !== employee.id)
                : [...prevCart, employee.id];
            return newCart;
        });
    };

    const checkExist = (id: number) => {
        return employeeSelectedCart.includes(id)
            ? {
                  backgroundColor: '#8bc34a94',
              }
            : null;
    };

    // Save note function
    const saveNote = async () => {
        if (notesModal.details) {
            setLoading({
                visible: true,
                message: 'Updating records',
            });
            let new_data = [...attendanceSummary];
            const index = new_data.findIndex(
                (item: any) => item.id === notesModal.details.id,
            );
            if (index !== -1) {
                await updateLogsDTR({
                    id: notesModal.details.id,
                    notes: noteText,
                });
                new_data[index].notes = noteText;
            }
            setAttendanceSummary(new_data);
            setNotesModal({visible: false, details: null});
            setNoteText('');
            setLoading({visible: false, message: ''});
        }
    };

    const addManualLog = () => {
        setSelectedDate(ot?.details?.date_time);
        setEmployeeSelectedCart(prev => {
            const employeeId = ot?.details?.employee_id;
            const newArray = employeeId ? [...prev, employeeId] : prev;
            return [...new Set(newArray.filter(Boolean))];
        });
        setAction2(false);
        setManualogs(true);
    };

    // Add these states at the top of your component
    const [searchQuery2, setSearchQuery2] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState(myEmployees);

    // Add useEffect to filter employees when searchQuery or myEmployees changes
    useEffect(() => {
        if (searchQuery2.trim() === '') {
            setFilteredEmployees(myEmployees);
        } else {
            const query = searchQuery2.toLowerCase().trim();
            const filtered = myEmployees.filter(
                employee =>
                    employee.firstname?.toLowerCase().includes(query) ||
                    employee.lastname?.toLowerCase().includes(query) ||
                    employee.employee_no?.toLowerCase().includes(query) ||
                    // employee.position?.toLowerCase().includes(query) ||
                    // employee.code?.toLowerCase().includes(query) ||
                    `${employee.firstname} ${employee.lastname}`
                        .toLowerCase()
                        .includes(query) ||
                    `${employee.employee_no} ${employee.firstname} ${employee.lastname}`
                        .toLowerCase()
                        .includes(query),
            );
            setFilteredEmployees(filtered);
        }
    }, [searchQuery2, myEmployees]);

    const markSelectedAsReady = async (readyStatus: boolean) => {
        if (selectedItems.size === 0) {
            return;
        }

        Alert.alert(
            `Mark ${selectedItems.size} items as ${
                readyStatus ? 'Ready' : 'Not Ready'
            }`,
            `Are you sure you want to mark ${
                selectedItems.size
            } selected items as ${readyStatus ? 'ready' : 'not ready'}?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setLoading({
                                visible: true,
                                message: 'Updating records',
                            });

                            let new_data = [...attendanceSummary];
                            const selectedItemsArray =
                                Array.from(selectedItems);

                            const updates = [];

                            for (const itemId of selectedItemsArray) {
                                const index = new_data.findIndex(
                                    item =>
                                        item.id.toString() +
                                            item.date_time.toString() ===
                                            itemId ||
                                        item.id?.toString() === itemId ||
                                        `${item.employee_id}-${item.date_time}` ===
                                            itemId,
                                );

                                if (index !== -1) {
                                    new_data[index] = {
                                        ...new_data[index],
                                        isCheck: readyStatus,
                                    };

                                    updates.push({
                                        id: new_data[index].id,
                                        isCheck: readyStatus ? 1 : 0,
                                    });
                                }
                            }

                            // ✅ One database call instead of many
                            await updateLogsDTRArray(updates);

                            setAttendanceSummary(new_data);

                            // Reapply search filter if needed
                            // if (searchQuery) {
                            //     const filteredData = applySearchFilter(
                            //         new_data,
                            //         searchQuery,
                            //     );
                            //     setSummary(filteredData);
                            // } else {
                            //     setSummary(new_data);
                            // }

                            clearSelection();
                            setLoading({visible: false, message: ''});
                            setMessage({
                                visible: true,
                                message: 'DTR successfully saved',
                                type: '',
                            });
                        } catch (error) {
                            setLoading({visible: false, message: ''});
                            console.error('Error updating logs:', error);
                            Alert.alert(
                                'Error',
                                'Failed to update records. Please try again.',
                            );
                        }
                    },
                },
            ],
        );
    };

    /* ── helpers for push action sheet ── */
    const getPushInfo = () => {
        const empStatus: Record<
            string,
            {name: string; ready: number; total: number; allReady: boolean}
        > = {};
        attendanceSummary.forEach((item: any) => {
            if (!empStatus[item.employee_id]) {
                empStatus[item.employee_id] = {
                    name: `${item.firstname} ${item.lastname}`,
                    ready: 0,
                    total: 0,
                    allReady: true,
                };
            }
            empStatus[item.employee_id].total++;
            if (item.isCheck) {
                empStatus[item.employee_id].ready++;
            } else {
                empStatus[item.employee_id].allReady = false;
            }
        });
        return empStatus;
    };

    const handlePush = () => {
        setAction(false);
        setPushModal(true);
    };

    const confirmPush = (branchId: number) => {
        setPushModal(false);
        const hasDrafts = Object.values(getPushInfo()).some(e => !e.allReady);
        if (hasDrafts) {
            const updated = attendanceSummary.map((item: any) => ({
                ...item,
                ot: (
                    (parseFloat(item.ot) || 0) + (parseFloat(item.ei) || 0)
                ).toFixed(2),
                hours: (
                    (parseFloat(item.hours) || 0) + (parseFloat(item.ei) || 0)
                ).toFixed(2),
            }));
            pushDTR({dtr, dtr_details: updated, branch_id: branchId});
        } else {
            pushDTR({dtr, dtr_details: attendanceSummary, branch_id: branchId});
        }
    };

    const pushEmpStatus = getPushInfo();
    const pushDrafts = Object.values(pushEmpStatus).filter(e => !e.allReady);

    const readyCount = summary.filter((i: any) => i.isCheck).length;
    const totalRec = summary.length;
    const empCount = byEmployees.length;

    return (
        <>
            <PushModal
                visible={pushModal}
                onDismiss={() => setPushModal(false)}
                onConfirm={confirmPush}
                totalEmployees={Object.keys(pushEmpStatus).length}
                totalRecords={attendanceSummary.length}
                drafts={pushDrafts}
            />
            <EarlyInForm
                visible={ei}
                close={() => setEI({visible: false, details: null})}
                saveOt={v => saveEI(v)}
            />
            <NumberCounter
                visible={ot}
                close={() => setOT({visible: false, details: null})}
                saveOt={v => saveOt(v)}
            />
            <UpdateHours
                visible={hoursDuty}
                close={() => setHoursDuty({visible: false, details: null})}
                saveOt={v => saveNewTime(v)}
            />

            {/* Notes bottom sheet */}
            <BottomSheet
                visible={notesModal.visible}
                height={320}
                onClose={() => {
                    setNotesModal({visible: false, details: null});
                    setNoteText('');
                }}>
                <View style={styles.sheetPad}>
                    <View style={styles.sheetHandle} />
                    <TextComponent style={styles.sheetTitle}>
                        Add Note
                    </TextComponent>
                    <TextComponent style={styles.sheetSubtitle}>
                        {notesModal.details?.firstname}{' '}
                        {notesModal.details?.lastname} ·{' '}
                        {formatDate(notesModal.details?.date_time)}
                    </TextComponent>
                    <TextInput
                        multiline
                        numberOfLines={3}
                        placeholder="Enter note here..."
                        value={noteText}
                        onChangeText={setNoteText}
                        mode="outlined"
                        style={styles.noteInput}
                    />
                    <View style={styles.sheetBtns}>
                        <TouchableRipple
                            style={styles.cancelBtn}
                            onPress={() => {
                                setNotesModal({visible: false, details: null});
                                setNoteText('');
                            }}>
                            <TextComponent style={styles.cancelBtnText}>
                                Cancel
                            </TextComponent>
                        </TouchableRipple>
                        <TouchableRipple
                            style={styles.saveBtn}
                            onPress={saveNote}>
                            <View style={styles.saveBtnInner}>
                                <MaterialIcons
                                    name="save"
                                    size={16}
                                    color="#fff"
                                />
                                <TextComponent style={styles.saveBtnText}>
                                    Save Note
                                </TextComponent>
                            </View>
                        </TouchableRipple>
                    </View>
                </View>
            </BottomSheet>

            {/* Global actions bottom sheet */}
            <BottomSheet
                visible={action}
                height={130}
                onClose={() => setAction(false)}>
                <View style={styles.sheetPad}>
                    <View style={styles.sheetHandle} />
                    <TextComponent style={styles.sheetLabel}>
                        Actions
                    </TextComponent>
                </View>
                {[
                    {
                        icon: 'cloud-upload',
                        label: 'Push To Cloud',
                        sub: (() => {
                            const s = getPushInfo();
                            const r = Object.values(s).filter(
                                e => e.allReady,
                            ).length;
                            return `${r}/${
                                Object.keys(s).length
                            } employees ready`;
                        })(),
                        color: '#0284C7',
                        onPress: handlePush,
                        MI: true,
                    },
                ].map((a, i) => (
                    <TouchableRipple
                        key={i}
                        onPress={a.onPress}
                        style={styles.actionRow}>
                        <View style={styles.actionRowInner}>
                            <View
                                style={[
                                    styles.actionIconBox,
                                    {backgroundColor: `${a.color}18`},
                                ]}>
                                {a.MI ? (
                                    <MaterialIcons
                                        name={a.icon}
                                        size={20}
                                        color={a.color}
                                    />
                                ) : (
                                    <MaterialCommunityIcons
                                        name={a.icon}
                                        size={20}
                                        color={a.color}
                                    />
                                )}
                            </View>
                            <View style={styles.actionTexts}>
                                <TextComponent style={styles.actionTitle}>
                                    {a.label}
                                </TextComponent>
                                <TextComponent style={styles.actionSub}>
                                    {a.sub}
                                </TextComponent>
                            </View>
                            <MaterialIcons
                                name="chevron-right"
                                size={18}
                                color="#CBD5E1"
                            />
                        </View>
                    </TouchableRipple>
                ))}
            </BottomSheet>

            {/* Item actions bottom sheet */}
            <BottomSheet
                visible={action2}
                height={310}
                onClose={() => setAction2(false)}>
                <View style={styles.sheetPad}>
                    <View style={styles.sheetHandle} />
                    <TextComponent style={styles.sheetLabel}>
                        Record Actions
                    </TextComponent>
                </View>
                {[
                    {
                        icon: 'clock-check-outline',
                        label: 'Update Hours on Duty',
                        sub: 'Manually set hours worked',
                        color: '#0284C7',
                        onPress: updateTime,
                        MI: false,
                    },
                    {
                        icon: 'more-time',
                        label: 'Add Manual Logs',
                        sub: 'Insert time entries manually',
                        color: '#7C3AED',
                        onPress: addManualLog,
                        MI: true,
                    },
                    {
                        icon: 'access-time',
                        label: 'Add Early In (EI)',
                        sub: 'Log time before 7:30 AM',
                        color: '#059669',
                        onPress: addEarlyIn,
                        MI: true,
                    },
                    {
                        icon: 'access-time',
                        label: 'Add Overtime (OT)',
                        sub: 'Log extra hours worked',
                        color: '#D97706',
                        onPress: addOvertime,
                        MI: true,
                    },
                    {
                        icon: 'close',
                        label: 'Remove Manual Logs',
                        sub: 'Keep only biometric entries',
                        color: '#DC2626',
                        onPress: () => {
                            Alert.alert(
                                'Remove Manual Logs',
                                'Are you sure?',
                                [
                                    {text: 'Cancel', style: 'cancel'},
                                    {
                                        text: 'Remove',
                                        style: 'destructive',
                                        onPress: removeManualLogs,
                                    },
                                ],
                                {cancelable: false},
                            );
                            setAction(false);
                        },
                        MI: true,
                    },
                ].map((a, i) => (
                    <TouchableRipple
                        key={i}
                        onPress={a.onPress}
                        style={styles.actionRow}>
                        <View style={styles.actionRowInner}>
                            <View
                                style={[
                                    styles.actionIconBox,
                                    {backgroundColor: `${a.color}18`},
                                ]}>
                                {a.MI ? (
                                    <MaterialIcons
                                        name={a.icon}
                                        size={20}
                                        color={a.color}
                                    />
                                ) : (
                                    <MaterialCommunityIcons
                                        name={a.icon}
                                        size={20}
                                        color={a.color}
                                    />
                                )}
                            </View>
                            <View style={styles.actionTexts}>
                                <TextComponent style={styles.actionTitle}>
                                    {a.label}
                                </TextComponent>
                                <TextComponent style={styles.actionSub}>
                                    {a.sub}
                                </TextComponent>
                            </View>
                            <MaterialIcons
                                name="chevron-right"
                                size={18}
                                color="#CBD5E1"
                            />
                        </View>
                    </TouchableRipple>
                ))}
            </BottomSheet>

            {/* Manual logs bottom sheet */}
            <BottomSheet
                visible={manualLogs}
                height={windowHeight - 70}
                onClose={() => {
                    setManualogs(false);
                    setEmployee(false);
                }}>
                {!isEmployee && (
                    <>
                        <View style={styles.sheetPad}>
                            <View style={styles.sheetHandle} />
                            <TextComponent style={styles.sheetTitle}>
                                Bulk Manual Logs
                            </TextComponent>
                        </View>
                        <MainContainer>
                                <RowSeparator>
                                    <View style={BORDER_STYLE.borderStyle}>
                                        <TextComponent
                                            style={{color: PRIMARY_COLOR}}>
                                            Employees:{' '}
                                            <TextComponent
                                                style={{color: BORDER_COLOR}}
                                                variant="titleSmall">
                                                {employeeSelectedCart.length ===
                                                0
                                                    ? 'No Employee Selected'
                                                    : `${employeeSelectedCart.length} Selected`}
                                            </TextComponent>
                                        </TextComponent>
                                        <ButtonComponent
                                            mode="outlined"
                                            label="Select Employees"
                                            onPress={() => setEmployee(true)}
                                        />
                                    </View>
                                </RowSeparator>
                                <RowSeparator>
                                    <View style={BORDER_STYLE.borderStyle}>
                                        <TextComponent
                                            style={{color: PRIMARY_COLOR}}>
                                            Date:{' '}
                                            <TextComponent
                                                style={{color: BORDER_COLOR}}
                                                variant="titleSmall">
                                                {selectedDate
                                                    ? formatDate(selectedDate)
                                                    : 'No Date Selected'}
                                            </TextComponent>
                                        </TextComponent>
                                        <DateTimePickerModal
                                            isVisible={selectDate}
                                            mode="date"
                                            onConfirm={onselectDate}
                                            onCancel={() =>
                                                setSelectDate(false)
                                            }
                                            minimumDate={
                                                dtr?.date_from
                                                    ? new Date(dtr.date_from)
                                                    : undefined
                                            }
                                            maximumDate={
                                                dtr?.date_to
                                                    ? new Date(dtr.date_to)
                                                    : undefined
                                            }
                                        />
                                        <ButtonComponent
                                            mode="outlined"
                                            label="Select Date"
                                            onPress={() => setSelectDate(true)}
                                            disabled={
                                                employeeSelectedCart.length ===
                                                0
                                            }
                                        />
                                    </View>
                                </RowSeparator>
                                <RowSeparator>
                                    <View style={BORDER_STYLE.borderStyle}>
                                        <TextComponent
                                            style={{color: PRIMARY_COLOR}}>
                                            Logs
                                        </TextComponent>
                                        <DateTimePickerModal
                                            isVisible={selectTime}
                                            mode="time"
                                            onConfirm={onselectTime}
                                            onCancel={() =>
                                                setSelectTime(false)
                                            }
                                        />
                                        <ButtonComponent
                                            mode="outlined"
                                            label="Select Time"
                                            onPress={() => setSelectTime(true)}
                                            disabled={!selectedDate}
                                        />
                                        {selectedTime.map(item => (
                                                <View
                                                    key={item.toString()}
                                                    style={[
                                                        BORDER_STYLE.borderStyle,
                                                        {
                                                            flexDirection:
                                                                'row',
                                                            justifyContent:
                                                                'space-between',
                                                            borderWidth: 1,
                                                        },
                                                    ]}>
                                                    <TextComponent>
                                                        {formatTime(item)}
                                                    </TextComponent>
                                                    <IconButton
                                                        icon="delete"
                                                        iconColor={
                                                            PRIMARY_COLOR
                                                        }
                                                        size={20}
                                                        onPress={() =>
                                                            deleteTime(item)
                                                        }
                                                        mode="contained"
                                                    />
                                                </View>
                                        ))}
                                    </View>
                                </RowSeparator>
                                <RowSeparator>
                                    <ButtonComponent
                                        label="Save Logs"
                                        onPress={handleSubmit}
                                        disabled={selectedTime.length === 0}
                                    />
                                </RowSeparator>
                        </MainContainer>
                    </>
                )}
                {isEmployee && (
                    <>
                        <View
                            style={[
                                styles.sheetPad,
                                {flexDirection: 'row', alignItems: 'center'},
                            ]}>
                            <IconButton
                                icon={() => (
                                    <MaterialIcons
                                        name="arrow-back"
                                        size={22}
                                        color={BRAND_RED}
                                    />
                                )}
                                size={22}
                                onPress={() => setEmployee(false)}
                                style={{margin: 0}}
                            />
                            <Badge style={{marginRight: 6}}>
                                {employeeSelectedCart.length}
                            </Badge>
                            <TextComponent variant="titleMedium">
                                Select Employee
                            </TextComponent>
                        </View>
                        <View style={{paddingHorizontal: 12, paddingBottom: 8}}>
                            <TextInput
                                placeholder="Search by name or ID..."
                                value={searchQuery2}
                                onChangeText={setSearchQuery2}
                                mode="outlined"
                                style={{backgroundColor: '#fff'}}
                                left={
                                    <TextInput.Icon
                                        icon="magnify"
                                        color={PRIMARY_COLOR}
                                    />
                                }
                                right={
                                    searchQuery2 ? (
                                        <TextInput.Icon
                                            icon="close"
                                            color={PRIMARY_COLOR}
                                            onPress={() => setSearchQuery2('')}
                                        />
                                    ) : null
                                }
                            />
                        </View>
                        <MainContainer>
                                <RowSeparator>
                                    <FlatList
                                        data={filteredEmployees}
                                        renderItem={({item}) => (
                                            <TouchableRipple
                                                borderless
                                                onPress={() =>
                                                    selectEmployee(item)
                                                }
                                                style={[
                                                    BORDER_STYLE.borderStyle,
                                                    checkExist(item?.id),
                                                ]}>
                                                <>
                                                    <TextComponent
                                                        style={{
                                                            fontWeight: 'bold',
                                                        }}>
                                                        {item?.employee_no} -{' '}
                                                        {item?.firstname}{' '}
                                                        {item?.lastname}
                                                    </TextComponent>
                                                    <TextComponent>
                                                        Biometric Code:{' '}
                                                        {item?.code}
                                                    </TextComponent>
                                                    <TextComponent>
                                                        Position:{' '}
                                                        {item?.position}
                                                    </TextComponent>
                                                </>
                                            </TouchableRipple>
                                        )}
                                        keyExtractor={item =>
                                            item?.id.toString()
                                        }
                                        ItemSeparatorComponent={() => (
                                            <Separator />
                                        )}
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={{
                                            paddingBottom: 30,
                                        }}
                                        ListEmptyComponent={
                                            <View
                                                style={{
                                                    padding: 20,
                                                    alignItems: 'center',
                                                }}>
                                                <TextComponent
                                                    variant="bodyMedium"
                                                    style={{
                                                        color: BORDER_COLOR,
                                                    }}>
                                                    {searchQuery2
                                                        ? 'No employees found'
                                                        : 'No employees available'}
                                                </TextComponent>
                                            </View>
                                        }
                                    />
                                </RowSeparator>
                        </MainContainer>
                    </>
                )}
            </BottomSheet>

            {/* Sort FAB */}
            <View style={styles.fabWrap}>
                <Menu
                    visible={sortMenuVisible}
                    onDismiss={() => setSortMenuVisible(false)}
                    anchor={
                        !isSelectionMode &&
                        value === 'list' && (
                            <FAB
                                icon="sort"
                                style={styles.fab}
                                onPress={() => setSortMenuVisible(true)}
                            />
                        )
                    }>
                    <Menu.Item
                        leadingIcon="sort-alphabetical-ascending"
                        onPress={() => {
                            setSortBy('name');
                            setSortMenuVisible(false);
                        }}
                        title="Name"
                    />
                    <Menu.Item
                        leadingIcon="calendar"
                        onPress={() => {
                            setSortBy('date');
                            setSortMenuVisible(false);
                        }}
                        title="Date"
                    />
                    <Menu.Item
                        leadingIcon="clock"
                        onPress={() => {
                            setSortBy('hours');
                            setSortMenuVisible(false);
                        }}
                        title="Hours"
                    />
                    <Menu.Item
                        leadingIcon={
                            sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'
                        }
                        onPress={() => {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            setSortMenuVisible(false);
                        }}
                        title={`Order: ${sortOrder === 'asc' ? 'Asc' : 'Desc'}`}
                    />
                </Menu>
            </View>

            {/* Main content */}
            <View style={styles.root}>
                {/* Navy Appbar */}
                <Appbar.Header style={styles.appbar}>
                    {!isSelectionMode ? (
                        <Appbar.BackAction
                            color="#fff"
                            onPress={() => navigation.goBack()}
                        />
                    ) : null}
                    <Appbar.Content
                        title={
                            isSelectionMode
                                ? `${selectedItems.size} selected`
                                : 'Attendance Details'
                        }
                        subtitle={
                            isSelectionMode
                                ? null
                                : dtr?.date_from && dtr?.date_to
                                ? `${dayjs(dtr.date_from).format('MMM D')} – ${dayjs(dtr.date_to).format('MMM D, YYYY')}`
                                : 'No DTR selected'
                        }
                        titleStyle={styles.appbarTitle}
                        subtitleStyle={styles.appbarSubtitle}
                    />
                    {isSelectionMode ? (
                        <>
                            <Appbar.Action
                                icon="account-multiple-check-outline"
                                color="#4CAF50"
                                onPress={() => markSelectedAsReady(true)}
                            />
                            <Appbar.Action
                                icon="account-multiple-remove-outline"
                                color="#FF9800"
                                onPress={() => markSelectedAsReady(false)}
                            />
                            <Appbar.Action
                                icon="select-all"
                                color="#fff"
                                onPress={selectAllItems}
                            />
                            <Appbar.Action
                                icon="close"
                                color="#fff"
                                onPress={clearSelection}
                            />
                        </>
                    ) : (
                        <>
                            <Appbar.Action
                                icon={isSearch ? 'magnify-close' : 'magnify'}
                                color="#fff"
                                onPress={() => {
                                    setIsSearch(!isSearch);
                                    setSearchQuery('');
                                    setSummary(attendanceSummary);
                                }}
                            />
                            <Appbar.Action
                                icon="dots-vertical"
                                color="#fff"
                                onPress={() => setAction(true)}
                            />
                        </>
                    )}
                </Appbar.Header>

                {/* Sub-header */}
                <View style={styles.subHeader}>
                    {/* Search */}
                    {isSearch && (
                        <Searchbar
                            placeholder="Search name..."
                            onChangeText={hadleSearch}
                            value={searchQuery}
                            style={styles.searchBar}
                            inputStyle={styles.searchInput}
                        />
                    )}

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statPill}>
                            <MaterialIcons
                                name="receipt-long"
                                size={12}
                                color="#64748B"
                            />
                            <TextComponent style={styles.statPillText}>
                                {totalRec} records
                            </TextComponent>
                        </View>
                        <View style={styles.statPill}>
                            <MaterialIcons
                                name="people"
                                size={12}
                                color="#64748B"
                            />
                            <TextComponent style={styles.statPillText}>
                                {empCount} employees
                            </TextComponent>
                        </View>
                        <View
                            style={[styles.statPill, {borderColor: '#BBF7D0'}]}>
                            <MaterialIcons
                                name="check-circle"
                                size={12}
                                color="#16A34A"
                            />
                            <TextComponent
                                style={[
                                    styles.statPillText,
                                    {color: '#16A34A'},
                                ]}>
                                {readyCount} ready
                            </TextComponent>
                        </View>
                    </View>

                    {/* View switcher */}
                    <View style={styles.switchRow}>
                        {[
                            {key: 'list', icon: 'view-list', label: 'By List'},
                            {
                                key: 'employee',
                                icon: 'people',
                                label: 'By Employee',
                            },
                        ].map(tab => (
                            <TouchableRipple
                                key={tab.key}
                                onPress={() => setValue(tab.key)}
                                borderless
                                style={[
                                    styles.switchChip,
                                    value === tab.key &&
                                        styles.switchChipActive,
                                ]}>
                                <View style={styles.switchChipInner}>
                                    <MaterialIcons
                                        name={tab.icon}
                                        size={15}
                                        color={
                                            value === tab.key
                                                ? BRAND_RED
                                                : '#94A3B8'
                                        }
                                    />
                                    <TextComponent
                                        style={[
                                            styles.switchLabel,
                                            value === tab.key &&
                                                styles.switchLabelActive,
                                        ]}>
                                        {tab.label}
                                    </TextComponent>
                                </View>
                            </TouchableRipple>
                        ))}
                        <View style={styles.sortChip}>
                            <MaterialIcons
                                name="sort"
                                size={12}
                                color="#94A3B8"
                            />
                            <TextComponent style={styles.sortChipText}>
                                {sortBy} · {sortOrder}
                            </TextComponent>
                        </View>
                    </View>
                </View>

                {/* List views */}
                {value === 'list' && (
                    <FlatList
                        showsVerticalScrollIndicator={false}
                        data={summary}
                        renderItem={renderItem}
                        keyExtractor={item =>
                            item.id.toString() + item.date_time.toString()
                        }
                        onEndReachedThreshold={0.5}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => (
                            <View style={styles.divider} />
                        )}
                    />
                )}
                {value === 'employee' && (
                    <FlatList
                        showsVerticalScrollIndicator={false}
                        data={byEmployees}
                        renderItem={renderItemEmployee}
                        keyExtractor={item => item.employee_id.toString()}
                        onEndReachedThreshold={0.5}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => (
                            <View style={styles.divider} />
                        )}
                    />
                )}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG,
    },

    /* ─── Appbar ─── */
    appbar: {
        backgroundColor: NAVY_DARK,
        elevation: 0,
    },
    appbarTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    appbarSubtitle: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 12,
    },

    /* ─── Sub-header ─── */
    subHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 10,
    },
    searchBar: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        elevation: 0,
        height: 44,
        justifyContent: 'center',
    },
    searchInput: {
        alignSelf: 'center',
        paddingTop: 0,
        paddingBottom: 0,
        minHeight: 0,
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    switchRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    switchChip: {
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    switchChipActive: {
        borderColor: `${BRAND_RED}40`,
        backgroundColor: `${BRAND_RED}08`,
    },
    switchChipInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    switchLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
    },
    switchLabelActive: {
        color: BRAND_RED,
    },
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 'auto',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 20,
    },
    sortChipText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
    },

    /* ─── List ─── */
    listContent: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 90,
    },
    divider: {
        height: 6,
    },

    /* ─── List card ─── */
    listCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 3,
    },
    listCardSelected: {
        borderWidth: 1.5,
        borderColor: BRAND_RED,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    colorBar: {
        width: 4,
        minHeight: 80,
    },
    selectBox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginLeft: 12,
    },
    selectBoxActive: {
        backgroundColor: BRAND_RED,
        borderColor: BRAND_RED,
    },
    avatarCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 12,
        alignSelf: 'center',
    },
    avatarDim: {
        opacity: 0.55,
    },
    avatarCheck: {
        position: 'absolute',
        right: -3,
        bottom: -3,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#16A34A',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    cardContent: {
        flex: 1,
        paddingVertical: 10,
        paddingRight: 4,
        gap: 5,
    },
    cardRow1: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    empName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        flex: 1,
        marginRight: 8,
    },
    hoursBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#99F6E4',
    },
    hoursBadgeHalf: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    hoursVal: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0D9488',
    },
    hoursValHalf: {
        color: '#92400E',
    },
    cardRow2: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#CBD5E1',
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontSize: 11,
        color: '#94A3B8',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusReady: {
        backgroundColor: '#F0FDF4',
    },
    statusDraft: {
        backgroundColor: '#FFFBEB',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    otBadge: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FED7AA',
    },
    otBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#C2410C',
    },
    chipsRow: {
        flexDirection: 'row',
        gap: 5,
        paddingTop: 2,
        paddingBottom: 2,
    },
    logChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
    },
    bioChip: {
        backgroundColor: '#F0FDFA',
        borderColor: '#99F6E4',
    },
    manualChip: {
        backgroundColor: '#FFF5F5',
        borderColor: '#FCA5A5',
    },
    logTime: {
        fontSize: 11,
        fontWeight: '500',
    },
    notePreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    notePreviewText: {
        fontSize: 11,
        color: '#94A3B8',
        flex: 1,
    },
    noteActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginRight: 6,
    },

    /* ─── Employee card ─── */
    empCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 3,
    },
    empHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
        minHeight: 68,
    },
    empColorBar: {
        width: 4,
        alignSelf: 'stretch',
        minHeight: 68,
    },
    empInfo: {
        flex: 1,
    },
    empName2: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 3,
    },
    empMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    empRight: {
        alignItems: 'flex-end',
        gap: 4,
        marginLeft: 8,
    },
    daysBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    daysText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },

    /* ─── Detail rows (employee expanded) ─── */
    detailsWrap: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 4,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    detailRow: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        padding: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    detailRowSelected: {
        borderColor: `${BRAND_RED}50`,
        backgroundColor: `${BRAND_RED}05`,
    },
    detailTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailDateWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailDate: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    detailRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    inOutSummary: {
        fontSize: 10,
        color: '#94A3B8',
        fontStyle: 'italic',
    },

    /* ─── Action bottom sheets ─── */
    sheetPad: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 14,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: NAVY_DARK,
        textAlign: 'center',
        marginBottom: 4,
    },
    sheetSubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 12,
    },
    sheetLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    sheetBtns: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        overflow: 'hidden',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    saveBtn: {
        flex: 1,
        backgroundColor: BRAND_RED,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    noteInput: {
        backgroundColor: '#F8FAFC',
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    actionRow: {
        overflow: 'hidden',
    },
    actionRowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    actionIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTexts: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    actionSub: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 1,
    },

    /* ─── FAB ─── */
    fabWrap: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 10,
    },
    fab: {
        elevation: 4,
    },
});

export default AttendaceDetails;
