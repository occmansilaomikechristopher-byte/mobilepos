//@ts-nocheck
import React, {useState, useEffect} from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    Alert,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import {MainContainer, TextComponent, EmptyComponent} from '../components';
import {fetchDTRData, fetchDTRDetailsData} from '../utils/databaseService';
import useGlobalStore from '../store/globalState';
import {Swipeable} from 'react-native-gesture-handler';
import {HomeScreenNavigationProp} from '../AppNavigator';
import {PRIMARY_COLOR} from '../utils/constant';
import {formatDate} from '../utils/helper';
import {playSound} from '../utils/helper';
import successSound from '../assets/audio/success.mp3';
import errorSound from '../assets/audio/error.wav';
import dayjs from 'dayjs';

interface Props {
    navigation: HomeScreenNavigationProp;
}

const DTRTab = ({navigation}: Props) => {
    const {setAttendanceSummary, setDTR, success, setSuccess, deleteDTR} =
        useGlobalStore();
    const [list, setList] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (success && success.visible) {
            if (['delete-dtr', 'save-dtr', 'push-dtr'].includes(success.type)) {
                playSound(successSound);
                fetchData();
                setTimeout(() => setSuccess({visible: false, type: ''}), 1000);
            } else if (success.type === 'error-push-dtr') {
                playSound(errorSound);
            }
        }
    }, [success]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const data = await fetchDTRData();
            setList(data);
        } catch (e) {
            console.error('Error fetching DTR:', e);
        }
        setRefreshing(false);
    };

    const details = async item => {
        const dtrDetails = await fetchDTRDetailsData(item.id);
        setDTR(item);
        setAttendanceSummary(dtrDetails);
        navigation.navigate('AttendaceDetails');
    };

    const confirmDelete = item => {
        Alert.alert(
            'Delete DTR',
            'Are you sure you want to delete this record?',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteDTR(item.id),
                },
            ],
        );
    };

    const getDayCount = (from, to) => {
        const diff = dayjs(to).diff(dayjs(from), 'day') + 1;
        return diff > 0 ? diff : 0;
    };

    // count weekly / monthly
    let weeklyCount = 0;
    let monthlyCount = 0;
    list.forEach(i => {
        if (i.weekly_payroll != 0) {
            weeklyCount++;
        } else {
            monthlyCount++;
        }
    });

    const rightActions = item => (
        <View style={styles.actions}>
            <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => details(item)}>
                <TextComponent style={styles.actionText}>View</TextComponent>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(item)}>
                <TextComponent style={styles.actionText}>Delete</TextComponent>
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({item}) => {
        const isMonthly = item.weekly_payroll == 0;
        const dayCount = getDayCount(item.date_from, item.date_to);
        const isPushed = item.status === 'pushed';
        return (
            <Swipeable renderRightActions={() => rightActions(item)}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => details(item)}>
                    <TextComponent style={styles.dateRange}>
                        {formatDate(item.date_from, false, false)} -{' '}
                        {formatDate(item.date_to)}
                    </TextComponent>
                    <View style={styles.tagRow}>
                        <TextComponent style={styles.tag}>
                            {isMonthly ? 'MONTHLY' : 'WEEKLY'}
                        </TextComponent>
                        <TextComponent style={styles.days}>
                            {dayCount} days
                        </TextComponent>
                        {isPushed && (
                            <TextComponent style={styles.pushed}>
                                Pushed
                            </TextComponent>
                        )}
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    return (
        <MainContainer>
            <View style={styles.header}>
                <TextComponent style={styles.title}>My DTR</TextComponent>
                <TextComponent style={styles.count}>
                    {list.length} records
                </TextComponent>
            </View>

            {list.length > 0 && (
                <View style={styles.statsRow}>
                    <TextComponent style={styles.stat}>
                        Weekly: {weeklyCount}
                    </TextComponent>
                    <TextComponent style={styles.stat}>
                        Monthly: {monthlyCount}
                    </TextComponent>
                </View>
            )}

            <FlatList
                data={list}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                ListEmptyComponent={<EmptyComponent />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchData}
                    />
                }
            />
        </MainContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#dddddd',
    },
    title: {fontSize: 18, fontWeight: 'bold'},
    count: {fontSize: 12, color: PRIMARY_COLOR, fontWeight: 'bold'},
    statsRow: {flexDirection: 'row', marginBottom: 10},
    stat: {
        marginRight: 12,
        fontSize: 12,
        color: '#555555',
    },
    card: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#dddddd',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
    },
    dateRange: {fontSize: 15, fontWeight: 'bold', marginBottom: 6},
    tagRow: {flexDirection: 'row', alignItems: 'center'},
    tag: {
        fontSize: 11,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
        marginRight: 10,
    },
    days: {fontSize: 12, color: '#777777', marginRight: 10},
    pushed: {fontSize: 12, color: '#16A34A', fontWeight: 'bold'},
    actions: {flexDirection: 'row', alignItems: 'center'},
    viewBtn: {
        backgroundColor: PRIMARY_COLOR,
        justifyContent: 'center',
        paddingHorizontal: 16,
        marginLeft: 6,
        borderRadius: 6,
    },
    deleteBtn: {
        backgroundColor: '#cc0000',
        justifyContent: 'center',
        paddingHorizontal: 16,
        marginLeft: 6,
        borderRadius: 6,
    },
    actionText: {color: '#ffffff', fontWeight: 'bold'},
});

export default DTRTab;
