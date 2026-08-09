//@ts-nocheck
import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {
    View,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    StatusBar,
    TextInput,
    Text,
    TouchableOpacity,
} from 'react-native';
import {fetchEmployeesFromDB} from '../utils/databaseService';
import useGlobalStore from '../store/globalState';
import {useNavigation} from '@react-navigation/native';
import {PRIMARY_COLOR} from '../utils/constant';

const PAGE_SIZE = 20;

const getInitials = (first, last) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?';

const formatName = (first, last, middle) => {
    const ln = (last || '').toUpperCase().trim();
    const fn = (first || '').toUpperCase().trim();
    const mi = middle ? ` ${middle.charAt(0).toUpperCase()}.` : '';
    if (ln && fn) {
        return `${ln}, ${fn}${mi}`;
    }
    return `${ln}${fn}${mi}`.trim() || '—';
};

const EmployeeListScreen2 = () => {
    const navigation = useNavigation();
    const {cartItems, addToCart, removeFromCart, setMessage} = useGlobalStore();

    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        fetchInitialEmployees();
    }, []);

    const fetchInitialEmployees = async () => {
        setLoading(true);
        try {
            const all = await fetchEmployeesFromDB();
            setEmployees(all);
        } catch (e) {
            // ignore
        }
        setLoading(false);
    };

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) {
            return employees;
        }
        return employees.filter(emp => {
            const fn = emp.firstname?.toLowerCase() || '';
            const ln = emp.lastname?.toLowerCase() || '';
            const mn = emp.middlename?.toLowerCase() || '';
            const haystack = [
                fn,
                ln,
                mn,
                `${fn} ${ln}`,
                `${ln} ${fn}`,
                `${ln}, ${fn}`,
            ].join(' | ');
            return (
                haystack.includes(q) || emp.employee_no?.toString().includes(q)
            );
        });
    }, [employees, searchQuery]);

    const handleSearch = value => {
        setSearchQuery(value);
        setPage(1);
    };

    const paginated = useMemo(
        () => filtered.slice(0, page * PAGE_SIZE),
        [filtered, page],
    );
    const hasMore = paginated.length < filtered.length;

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) {
            return;
        }
        setLoadingMore(true);
        setTimeout(() => {
            setPage(p => p + 1);
            setLoadingMore(false);
        }, 300);
    }, [loadingMore, hasMore]);

    const handleAddToCart = employee => {
        const added = cartItems.some(
            item => item.id === parseInt(employee?.id),
        );
        const name = `${employee.firstname} ${employee.lastname}`;
        if (added) {
            removeFromCart({...employee, id: parseInt(employee?.id)});
            setMessage({
                visible: true,
                message: `${name} removed.`,
                type: 'error',
            });
        } else {
            addToCart(employee);
            setMessage({visible: true, message: `${name} added.`, type: ''});
        }
    };

    const renderItem = ({item}) => {
        const weekly = item?.weekly_payroll != 0;
        const added = cartItems.some(c => c.id === parseInt(item?.id));

        return (
            <TouchableOpacity
                style={[styles.card, added && styles.cardAdded]}
                onPress={() => handleAddToCart(item)}>
                {/* initials circle */}
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {getInitials(item.firstname, item.lastname)}
                    </Text>
                </View>

                {/* info */}
                <View style={styles.info}>
                    <Text style={styles.name}>
                        {formatName(
                            item.firstname,
                            item.lastname,
                            item.middlename,
                        )}
                    </Text>
                    <Text style={styles.sub}>#{item.employee_no}</Text>
                    {!!item.position && (
                        <Text style={styles.sub}>{item.position}</Text>
                    )}
                    <Text
                        style={[
                            styles.badge,
                            weekly ? styles.badgeGreen : styles.badgeBlue,
                        ]}>
                        {weekly ? 'WEEKLY' : 'MONTHLY'}
                    </Text>
                </View>

                {/* add / remove button */}
                <Text style={[styles.action, added && styles.actionAdded]}>
                    {added ? '✓' : '+'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>{'< Back'}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Employees</Text>
            </View>

            {/* search */}
            <TextInput
                placeholder="Search by name or ID..."
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={handleSearch}
                style={styles.search}
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={PRIMARY_COLOR} size="large" />
                    <Text style={styles.loadingText}>Loading employees...</Text>
                </View>
            ) : (
                <FlatList
                    data={paginated}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{padding: 12}}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={() =>
                        hasMore ? (
                            <ActivityIndicator
                                color={PRIMARY_COLOR}
                                style={{margin: 16}}
                            />
                        ) : filtered.length > 0 ? (
                            <Text style={styles.footerText}>
                                All {filtered.length} results shown
                            </Text>
                        ) : null
                    }
                    ListEmptyComponent={
                        <Text style={styles.empty}>No employees found.</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f5f5f5'},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#dddddd',
    },
    back: {color: PRIMARY_COLOR, fontSize: 16, marginRight: 12},
    title: {fontSize: 18, fontWeight: 'bold', color: '#333333'},
    search: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 6,
        margin: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: '#000000',
    },
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    loadingText: {color: '#777777', marginTop: 8},
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#dddddd',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
    },
    cardAdded: {
        borderColor: PRIMARY_COLOR,
        backgroundColor: '#e6f5f3',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: PRIMARY_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {color: '#ffffff', fontWeight: 'bold', fontSize: 16},
    info: {flex: 1},
    name: {fontSize: 14, fontWeight: 'bold', color: '#333333'},
    sub: {fontSize: 12, color: '#777777'},
    badge: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    badgeGreen: {backgroundColor: '#d1fae5', color: '#065f46'},
    badgeBlue: {backgroundColor: '#dbeafe', color: '#1e40af'},
    action: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#cccccc',
        marginLeft: 8,
    },
    actionAdded: {color: PRIMARY_COLOR},
    empty: {textAlign: 'center', color: '#777777', marginTop: 40},
    footerText: {textAlign: 'center', color: '#999999', padding: 16},
});

export default EmployeeListScreen2;
