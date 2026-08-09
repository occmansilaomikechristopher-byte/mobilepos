//@ts-nocheck
import React, {useEffect, useState, useMemo} from 'react';
import {View, FlatList, StyleSheet, Alert, StatusBar} from 'react-native';
import {Appbar, Searchbar, TouchableRipple} from 'react-native-paper';
import useGlobalStore from '../store/globalState';
import {useNavigation} from '@react-navigation/native';
import {TextComponent, BottomSheet} from '../components/';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {formatDate, formatTime} from '../utils/helper';
import {PRIMARY_COLOR, SECONDARY_COLOR} from '../utils/constant';

const NAVY_DARK = '#0F172A';
const BRAND_RED = '#219688';
const BG = '#F1F5F9';

const AVATAR_PALETTE = [
    '#2563EB',
    '#7C3AED',
    '#0891B2',
    '#059669',
    '#D97706',
    '#DC2626',
    '#4F46E5',
    '#0284C7',
];
const getAvatarColor = (seed: string) =>
    AVATAR_PALETTE[Math.abs(parseInt(seed) || 0) % AVATAR_PALETTE.length];

const getInitials = (name: string) => {
    const parts = name?.trim().split(' ').filter(Boolean) || [];
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() || '?';
};

type LogEntry = {dateTime: string; type: string};
type HoursLogged = {
    id: string;
    employee_id: string;
    name: string;
    date: string;
    hours: string;
    logs: LogEntry[];
    status: string;
};
type Detail = {date: string; hours: string; logs: LogEntry[]; status: string};
type GroupedItem = {id: string; name: string; details: Detail[]};

const LogsDetails = () => {
    const navigation = useNavigation();
    const {logsSummary, saveDTR, success, setSuccess} = useGlobalStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [action, setAction] = useState(false);
    const [view, setView] = useState<'list' | 'employee'>('list');
    const [allRecords, setAllRecords] = useState<HoursLogged[]>([]);

    useEffect(() => {
        const filtered = Array.isArray(logsSummary?.dtrDetails)
            ? logsSummary.dtrDetails.filter(
                  obj => !Object.values(obj).includes('not_type'),
              )
            : [];
        setAllRecords(filtered);
    }, [logsSummary]);

    useEffect(() => {
        if (success?.visible && success.type === 'save-dtr') {
            setSuccess({visible: false, type: ''});
            navigation.navigate('Dashboard');
        }
    }, [success]);

    const summary = useMemo(() => {
        if (!searchQuery.trim()) {
            return allRecords;
        }
        const q = searchQuery.toLowerCase();
        return allRecords.filter(
            item =>
                item.name?.toLowerCase().includes(q) ||
                item.id?.toString().includes(q),
        );
    }, [allRecords, searchQuery]);

    const groupedData = useMemo(
        () =>
            summary.reduce((acc: any, obj: any) => {
                const {id, name, ...rest} = obj;
                if (!acc[id]) {
                    acc[id] = {id, name, details: [rest]};
                } else {
                    acc[id].details.push(rest);
                }
                return acc;
            }, {}),
        [summary],
    );

    const byEmployees: GroupedItem[] = Object.values(groupedData);

    const calculateTotalHours = (details: Detail[]) =>
        details.reduce((t, d) => t + parseFloat(d.hours), 0);

    const totalHours = useMemo(
        () => allRecords.reduce((t, r) => t + parseFloat(r.hours), 0),
        [allRecords],
    );

    const submitDTR = () => {
        const unmatched = allRecords.filter(item => !item.employee_id);
        if (unmatched.length > 0) {
            const codes = [...new Set(unmatched.map(item => item.id))].join(', ');
            Alert.alert(
                'Cannot save DTR',
                `Assign unmatched biometric codes first: ${codes}`,
            );
            return;
        }
        saveDTR({dtr: logsSummary?.dtr, dtrDetails: allRecords});
    };

    const dtr = logsSummary?.dtr;

    /* ─── Log time chip ──────────────────────────────────────────────────── */
    const LogChip = ({item}: {item: LogEntry}) => {
        const isBio = item.type === 'bio';
        return (
            <View
                style={[
                    styles.logChip,
                    {
                        borderColor: isBio ? '#0D9488' : '#EF4444',
                        backgroundColor: isBio ? '#F0FDFA' : '#FEF2F2',
                    },
                ]}>
                <MaterialIcons
                    name={isBio ? 'fingerprint' : 'keyboard'}
                    size={11}
                    color={isBio ? '#0D9488' : '#EF4444'}
                />
                <TextComponent
                    style={[
                        styles.logChipText,
                        {color: isBio ? '#0D9488' : '#EF4444'},
                    ]}>
                    {formatTime(item.dateTime)}
                </TextComponent>
            </View>
        );
    };

    /* ─── By List render ─────────────────────────────────────────────────── */
    const renderListItem = ({item}: {item: HoursLogged}) => {
        const initials = getInitials(
            item.name === 'No Employee Assigned' ? item.id : item.name,
        );
        const avatarColor = getAvatarColor(item.employee_id || item.id);
        const isUnassigned = item.name === 'No Employee Assigned';

        return (
            <View style={styles.listCard}>
                {/* Top row */}
                <View style={styles.listCardTop}>
                    <View
                        style={[
                            styles.avatar,
                            {
                                backgroundColor: isUnassigned
                                    ? '#94A3B8'
                                    : avatarColor,
                            },
                        ]}>
                        <TextComponent style={styles.avatarText}>
                            {initials}
                        </TextComponent>
                    </View>
                    <View style={styles.listInfo}>
                        <TextComponent
                            style={[
                                styles.listName,
                                isUnassigned && {color: '#94A3B8'},
                            ]}
                            numberOfLines={1}>
                            {item.name}
                        </TextComponent>
                        <TextComponent style={styles.listMeta}>
                            Code: {item.id} · {formatDate(item.date)}
                        </TextComponent>
                    </View>
                    <View style={styles.hoursBadge}>
                        <MaterialIcons
                            name="access-time"
                            size={11}
                            color="#16A34A"
                        />
                        <TextComponent style={styles.hoursText}>
                            {item.hours}h
                        </TextComponent>
                    </View>
                </View>

                {/* Log chips */}
                {Array.isArray(item.logs) && item.logs.length > 0 && (
                    <View style={styles.chipsRow}>
                        {item.logs.map((log, i) => (
                            <LogChip key={i} item={log} />
                        ))}
                    </View>
                )}
            </View>
        );
    };

    /* ─── By Employee render ─────────────────────────────────────────────── */
    const renderEmployeeItem = ({item}: {item: GroupedItem}) => {
        const avatarColor = getAvatarColor(item.id);
        const total = calculateTotalHours(item.details);
        const isUnassigned = item.name === 'No Employee Assigned';

        return (
            <View style={styles.empCard}>
                {/* Employee header */}
                <View style={styles.empCardHeader}>
                    <View
                        style={[
                            styles.avatar,
                            {
                                backgroundColor: isUnassigned
                                    ? '#94A3B8'
                                    : avatarColor,
                            },
                        ]}>
                        <TextComponent style={styles.avatarText}>
                            {getInitials(isUnassigned ? item.id : item.name)}
                        </TextComponent>
                    </View>
                    <View style={styles.listInfo}>
                        <TextComponent
                            style={[
                                styles.listName,
                                isUnassigned && {color: '#94A3B8'},
                            ]}
                            numberOfLines={1}>
                            {item.name}
                        </TextComponent>
                        <TextComponent style={styles.listMeta}>
                            Code: {item.id} · {item.details.length} day
                            {item.details.length !== 1 ? 's' : ''}
                        </TextComponent>
                    </View>
                    <View style={styles.totalHoursBadge}>
                        <TextComponent style={styles.totalHoursNum}>
                            {total.toFixed(2)}
                        </TextComponent>
                        <TextComponent style={styles.totalHoursLabel}>
                            hrs
                        </TextComponent>
                    </View>
                </View>

                {/* Day rows */}
                <View style={styles.dayRows}>
                    {item.details.map((detail, i) => (
                        <View key={i} style={styles.dayRow}>
                            <View style={styles.dayRowTop}>
                                <View style={styles.dayRowLeft}>
                                    <MaterialIcons
                                        name="calendar-today"
                                        size={13}
                                        color="#64748B"
                                    />
                                    <TextComponent style={styles.dayDate}>
                                        {formatDate(detail.date)}
                                    </TextComponent>
                                </View>
                                <View style={styles.dayHoursBadge}>
                                    <MaterialIcons
                                        name="access-time"
                                        size={11}
                                        color="#16A34A"
                                    />
                                    <TextComponent style={styles.hoursText}>
                                        {detail.hours}h
                                    </TextComponent>
                                </View>
                            </View>
                            {Array.isArray(detail.logs) &&
                                detail.logs.length > 0 && (
                                    <View style={styles.chipsRow}>
                                        {detail.logs.map((log, j) => (
                                            <LogChip key={j} item={log} />
                                        ))}
                                    </View>
                                )}
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    /* ─── Render ─────────────────────────────────────────────────────────── */
    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY_DARK} />

            {/* AppBar */}
            <Appbar.Header style={styles.appbar} statusBarHeight={0}>
                <Appbar.BackAction
                    onPress={() => navigation.goBack()}
                    color="#FFFFFF"
                />
                <Appbar.Content
                    title={
                        dtr
                            ? `${formatDate(
                                  dtr.date_from,
                                  false,
                                  false,
                              )} — ${formatDate(dtr.date_to)}`
                            : 'Logs'
                    }
                    titleStyle={styles.appbarTitle}
                    subtitle={`${allRecords.length} records · ${
                        Object.keys(groupedData).length
                    } employees`}
                    subtitleStyle={styles.appbarSub}
                />
                <Appbar.Action
                    icon="content-save-outline"
                    color="#FFFFFF"
                    onPress={() => setAction(true)}
                />
            </Appbar.Header>

            {/* Search + stats strip */}
            <View style={styles.subHeader}>
                <Searchbar
                    placeholder="Search by name or code..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor="#94A3B8"
                />
                <View style={styles.statsStrip}>
                    <View style={styles.statPill}>
                        <MaterialIcons
                            name="format-list-bulleted"
                            size={13}
                            color={BRAND_RED}
                        />
                        <TextComponent style={styles.statPillText}>
                            {allRecords.length} records
                        </TextComponent>
                    </View>
                    <View style={styles.statPill}>
                        <MaterialIcons
                            name="people"
                            size={13}
                            color="#2563EB"
                        />
                        <TextComponent style={styles.statPillText}>
                            {Object.keys(groupedData).length} employees
                        </TextComponent>
                    </View>
                    <View style={styles.statPill}>
                        <MaterialIcons
                            name="access-time"
                            size={13}
                            color="#16A34A"
                        />
                        <TextComponent style={styles.statPillText}>
                            {totalHours.toFixed(1)}h total
                        </TextComponent>
                    </View>
                    <View
                        style={[
                            styles.statPill,
                            {
                                backgroundColor:
                                    dtr?.weekly_payroll === 1
                                        ? '#F0FDF4'
                                        : '#EFF6FF',
                            },
                        ]}>
                        <TextComponent
                            style={[
                                styles.statPillText,
                                {
                                    color:
                                        dtr?.weekly_payroll === 1
                                            ? '#16A34A'
                                            : '#2563EB',
                                },
                            ]}>
                            {dtr?.weekly_payroll === 1 ? 'WEEKLY' : 'MONTHLY'}
                        </TextComponent>
                    </View>
                </View>
            </View>

            {/* View switcher */}
            <View style={styles.switcherRow}>
                {(
                    [
                        ['list', 'format-list-bulleted', 'By List'],
                        ['employee', 'people', 'By Employee'],
                    ] as const
                ).map(([v, icon, label]) => {
                    const active = view === v;
                    return (
                        <TouchableRipple
                            key={v}
                            onPress={() => setView(v)}
                            rippleColor={`${BRAND_RED}12`}
                            style={[
                                styles.switcherBtn,
                                active && styles.switcherBtnActive,
                            ]}>
                            <View style={styles.switcherBtnInner}>
                                <MaterialIcons
                                    name={icon}
                                    size={15}
                                    color={active ? BRAND_RED : '#94A3B8'}
                                />
                                <TextComponent
                                    style={[
                                        styles.switcherLabel,
                                        active && styles.switcherLabelActive,
                                    ]}>
                                    {label}
                                </TextComponent>
                            </View>
                        </TouchableRipple>
                    );
                })}
            </View>

            {/* List */}
            {view === 'list' && (
                <FlatList
                    data={summary}
                    renderItem={renderListItem}
                    keyExtractor={item => `${item.id}-${item.date}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={{height: 8}} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons
                                name="search-off"
                                size={48}
                                color="#CBD5E1"
                            />
                            <TextComponent style={styles.emptyText}>
                                No records found
                            </TextComponent>
                        </View>
                    }
                />
            )}

            {view === 'employee' && (
                <FlatList
                    data={byEmployees}
                    renderItem={renderEmployeeItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={{height: 10}} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons
                                name="search-off"
                                size={48}
                                color="#CBD5E1"
                            />
                            <TextComponent style={styles.emptyText}>
                                No employees found
                            </TextComponent>
                        </View>
                    }
                />
            )}

            {/* Bottom sheet — Save DTR */}
            <BottomSheet
                visible={action}
                height={160}
                onClose={() => setAction(false)}>
                <View style={styles.sheetContent}>
                    <View style={styles.sheetHandle} />
                    <TextComponent style={styles.sheetTitle}>
                        Save DTR
                    </TextComponent>
                    <TouchableRipple
                        onPress={() => {
                            Alert.alert(
                                'Confirm Save',
                                'Save this DTR to local database?',
                                [
                                    {text: 'Cancel', style: 'cancel'},
                                    {
                                        text: 'Save',
                                        onPress: () => {
                                            submitDTR();
                                            setAction(false);
                                        },
                                    },
                                ],
                            );
                        }}
                        rippleColor={`${BRAND_RED}15`}
                        style={styles.sheetBtn}>
                        <View style={styles.sheetBtnInner}>
                            <View style={styles.sheetBtnIcon}>
                                <MaterialIcons
                                    name="save-alt"
                                    size={20}
                                    color={BRAND_RED}
                                />
                            </View>
                            <View>
                                <TextComponent style={styles.sheetBtnTitle}>
                                    Save to Local Database
                                </TextComponent>
                                <TextComponent style={styles.sheetBtnSub}>
                                    {allRecords.length} records ·{' '}
                                    {Object.keys(groupedData).length} employees
                                </TextComponent>
                            </View>
                            <MaterialIcons
                                name="chevron-right"
                                size={20}
                                color="#CBD5E1"
                                style={{marginLeft: 'auto'}}
                            />
                        </View>
                    </TouchableRipple>
                </View>
            </BottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG,
    },
    appbar: {
        backgroundColor: NAVY_DARK,
        elevation: 0,
    },
    appbarTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    appbarSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
    },
    subHeader: {
        backgroundColor: NAVY_DARK,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    searchBar: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        elevation: 0,
        height: 46,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        marginBottom: 10,
    },
    searchInput: {
        fontSize: 14,
        color: '#FFFFFF',
        alignSelf: 'center',
        paddingBottom: 0,
        paddingTop: 0,
        minHeight: 0,
    },
    statsStrip: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
    },
    switcherRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
        gap: 8,
    },
    switcherBtn: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    switcherBtnActive: {
        borderColor: `${BRAND_RED}50`,
        backgroundColor: `${BRAND_RED}08`,
    },
    switcherBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    switcherLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
    },
    switcherLabelActive: {
        color: BRAND_RED,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },

    /* List card */
    listCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 3,
    },
    listCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    listInfo: {
        flex: 1,
    },
    listName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    listMeta: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    hoursBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    hoursText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#16A34A',
    },

    /* Log chips */
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    logChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
    },
    logChipText: {
        fontSize: 11,
        fontWeight: '600',
    },

    /* Employee card */
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
    empCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    totalHoursBadge: {
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    totalHoursNum: {
        fontSize: 15,
        fontWeight: '800',
        color: '#16A34A',
    },
    totalHoursLabel: {
        fontSize: 10,
        color: '#16A34A',
        fontWeight: '500',
    },

    /* Day rows */
    dayRows: {
        paddingHorizontal: 14,
        paddingBottom: 10,
    },
    dayRow: {
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
        paddingBottom: 10,
    },
    dayRowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    dayRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dayDate: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    dayHoursBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F0FDF4',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },

    /* Empty */
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 15,
    },

    /* Bottom sheet */
    sheetContent: {
        padding: 16,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 14,
    },
    sheetTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    sheetBtn: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    sheetBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 12,
    },
    sheetBtnIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: `${BRAND_RED}12`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetBtnTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    sheetBtnSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
});

export default LogsDetails;
