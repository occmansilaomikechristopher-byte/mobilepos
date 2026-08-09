import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import {PRIMARY_COLOR, SECONDARY_COLOR} from '../../utils/constant';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {ActivityIndicator} from 'react-native-paper';

interface CountdownTimerProps {
    order?: any; // Define type of order here
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({order}) => {
    const [startTime, setStartTime] = useState<number | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadTimerData = async () => {
            try {
                const storedStartTime = await AsyncStorage.getItem('startTime');
                const storedDuration = await AsyncStorage.getItem('duration');

                if (storedStartTime && storedDuration) {
                    const startTimeParsed = parseInt(storedStartTime, 10);
                    const durationParsed = parseInt(storedDuration, 10);
                    setStartTime(startTimeParsed);
                    setDuration(durationParsed);
                    const currentTimestamp = dayjs().unix();
                    const calculatedRemainingTime = Math.max(
                        0,
                        startTimeParsed + durationParsed - currentTimestamp,
                    );
                    setRemainingTime(calculatedRemainingTime);
                } else if (order?.dateOngoing) {
                    const startDateTime = dayjs(order.dateOngoing).unix();
                    const calculatedDuration = order?.duration; // 12 minutes in seconds
                    setStartTime(startDateTime);
                    setDuration(calculatedDuration);
                    setRemainingTime(calculatedDuration);
                    await AsyncStorage.setItem(
                        'startTime',
                        startDateTime.toString(),
                    );
                    await AsyncStorage.setItem(
                        'duration',
                        calculatedDuration.toString(),
                    );
                }
            } catch (error) {
                console.error('Error loading timer data:', error);
            }
        };

        loadTimerData();
    }, [order?.dateOngoing]);

    useEffect(() => {
        if (startTime !== null && duration > 0) {
            const interval = setInterval(() => {
                const currentTimestamp = dayjs().unix();
                const calculatedRemainingTime = Math.max(
                    0,
                    startTime + duration - currentTimestamp,
                );
                setRemainingTime(calculatedRemainingTime);

                if (calculatedRemainingTime <= 0) {
                    clearInterval(interval);
                    AsyncStorage.removeItem('startTime');
                    AsyncStorage.removeItem('duration');
                }
            }, 1000);
            setTimeout(() => {
                setLoading(false);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [startTime, duration]);

    const formatTime = (time: number): string => {
        if (time <= 0) {
            return '00:00';
        }
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
        const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
        return `${formattedMinutes}:${formattedSeconds}`;
    };
    console.log({loading});
    return (
        <View style={styles.container}>
            <MaterialIcons
                style={{
                    position: 'absolute',
                    top: 3,
                    marginTop: 0,
                }}
                name="access-time"
                size={15}
                color={SECONDARY_COLOR}
            />
            {!loading && (
                <Text style={styles.timerText}>
                    {formatTime(remainingTime)}
                </Text>
            )}
            {loading && (
                <ActivityIndicator
                    animating={true}
                    size={16}
                    color={PRIMARY_COLOR}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: PRIMARY_COLOR,
        height: 60,
        width: 60,
        borderRadius: 60 / 2,
    },
    timerText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
    },
});

export default CountdownTimer;
