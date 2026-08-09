//@ts-nocheck
import React, {useState, useEffect, useMemo} from 'react';
import {StyleSheet, View, FlatList, Alert} from 'react-native';
import {MainContainer, TextComponent, EmptyComponent} from '../components';
import {PRIMARY_COLOR, SECONDARY_COLOR} from '../utils/constant';
import useGlobalStore from '../store/globalState';
import {IconButton, Searchbar} from 'react-native-paper';
import {Swipeable} from 'react-native-gesture-handler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {fetchMyEmployeeData} from '../utils/databaseService';

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

const getAvatarColor = (seed: number | string) =>
    AVATAR_PALETTE[Math.abs(Number(seed) || 0) % AVATAR_PALETTE.length];

const getInitials = (first: string, last: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?';

const MyEmployeeTab: React.FC = () => {
    const {
        myEmployees,
        setMyEmployees,
        deleteMyEmployee,
        success,
    } = useGlobalStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadEmployees = async () => {
            try {
                const employees = await fetchMyEmployeeData();
                if (mounted) {
                    setMyEmployees(employees);
                }
            } catch (error) {
                console.error('Error loading team employees:', error);
            }
        };

        loadEmployees();
        return () => {
            mounted = false;
        };
    }, [success?.visible, success?.type, setMyEmployees]);

    const filteredEmployees = useMemo(() => {
        return myEmployees.filter(emp => {
            const query = searchQuery.toLowerCase();
            return (
                emp.firstname?.toLowerCase().includes(query) ||
                emp.lastname?.toLowerCase().includes(query) ||
                emp.employee_no?.toString().includes(query) ||
                emp.code?.toString().includes(query)
            );
        });
    }, [myEmployees, searchQuery]);

    const renderRightActions = (item: any) => (
        <View style={styles.swipeActions}>
            <IconButton
                icon="trash-can-outline"
                iconColor={SECONDARY_COLOR}
                size={26}
                onPress={() => {
                    Alert.alert(
                        'Remove Employee',
                        `Remove ${item?.firstname} ${item?.lastname} from your list?`,
                        [
                            {text: 'Cancel', style: 'cancel'},
                            {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: () => deleteMyEmployee(item?.id),
                            },
                        ],
                        {cancelable: false},
                    );
                }}
            />
        </View>
    );

    const isWeekly = (item: any) => item?.weekly_payroll != 0;

    return (
        <MainContainer>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <MaterialIcons
                        name="people"
                        size={22}
                        color={PRIMARY_COLOR}
                    />
                    <TextComponent style={styles.headerTitle}>
                        My Team
                    </TextComponent>
                </View>
                <View style={styles.countBadge}>
                    <MaterialIcons
                        name="people"
                        size={13}
                        color={PRIMARY_COLOR}
                    />
                    <TextComponent style={styles.countText}>
                        {searchQuery
                            ? `${filteredEmployees.length} of ${myEmployees.length}`
                            : `${myEmployees.length} members`}
                    </TextComponent>
                </View>
            </View>

            {/* Search */}
            <Searchbar
                placeholder="Search by name, ID or code..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
                iconColor="#94A3B8"
            />

            {/* List */}
            <FlatList
                data={filteredEmployees}
                renderItem={({item}) => (
                    <Swipeable
                        renderRightActions={() => renderRightActions(item)}>
                        <View style={styles.empCard}>
                            {/* Left color bar */}
                            <View
                                style={[
                                    styles.colorBar,
                                    {
                                        backgroundColor: isWeekly(item)
                                            ? '#16A34A'
                                            : '#2563EB',
                                    },
                                ]}
                            />

                            {/* Initials avatar */}
                            <View
                                style={[
                                    styles.avatar,
                                    {
                                        backgroundColor: getAvatarColor(
                                            item?.employee_no,
                                        ),
                                    },
                                ]}>
                                <TextComponent style={styles.avatarText}>
                                    {getInitials(
                                        item?.firstname,
                                        item?.lastname,
                                    )}
                                </TextComponent>
                            </View>

                            {/* Employee info */}
                            <View style={styles.empInfo}>
                                <TextComponent style={styles.empName}>
                                    {item?.firstname} {item?.lastname}
                                </TextComponent>
                                <TextComponent style={styles.empMeta}>
                                    #{item?.employee_no}
                                    {item?.code ? ` · Code: ${item.code}` : ''}
                                </TextComponent>
                                {item?.position ? (
                                    <View style={styles.positionChip}>
                                        <TextComponent
                                            style={styles.positionChipText}>
                                            {item.position}
                                        </TextComponent>
                                    </View>
                                ) : null}
                            </View>

                            {/* Payroll badge */}
                            <View
                                style={[
                                    styles.payrollBadge,
                                    {
                                        backgroundColor: isWeekly(item)
                                            ? '#F0FDF4'
                                            : '#EFF6FF',
                                    },
                                ]}>
                                <TextComponent
                                    style={[
                                        styles.payrollText,
                                        {
                                            color: isWeekly(item)
                                                ? '#16A34A'
                                                : '#2563EB',
                                        },
                                    ]}>
                                    {isWeekly(item) ? 'WEEKLY' : 'MONTHLY'}
                                </TextComponent>
                            </View>
                        </View>
                    </Swipeable>
                )}
                keyExtractor={item => item.id?.toString()}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
                ListEmptyComponent={<EmptyComponent />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: 170}}
            />
        </MainContainer>
    );
};

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: `${PRIMARY_COLOR}12`,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: `${PRIMARY_COLOR}25`,
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
        color: PRIMARY_COLOR,
    },
    searchBar: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 0,
        marginBottom: 14,
        height: 46,
        justifyContent: 'center',
    },
    searchInput: {
        fontSize: 14,
        color: '#1E293B',
        alignSelf: 'center',
        paddingBottom: 0,
        paddingTop: 0,
        minHeight: 0,
    },
    empCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
        paddingVertical: 12,
        paddingRight: 14,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    colorBar: {
        width: 4,
        alignSelf: 'stretch',
        minHeight: 60,
        marginRight: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    empInfo: {
        flex: 1,
    },
    empName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    empMeta: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    positionChip: {
        alignSelf: 'flex-start',
        backgroundColor: '#F1F5F9',
        borderRadius: 5,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginTop: 5,
    },
    positionChipText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
    },
    payrollBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 7,
        marginLeft: 8,
    },
    payrollText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    swipeActions: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
        marginLeft: 6,
        paddingHorizontal: 4,
    },
    divider: {
        height: 8,
    },
});

export default MyEmployeeTab;
