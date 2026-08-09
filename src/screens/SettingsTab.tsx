import React, {useEffect, useState} from 'react';
import {ScrollView, View, StyleSheet, TouchableOpacity} from 'react-native';
import {TextComponent} from '../components/';
import useGlobalStore from '../store/globalState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import {PRIMARY_COLOR} from '../utils/constant';

const SettingsTab = () => {
    const {success, pullOnline} = useGlobalStore();
    const [lastSync, setLastSync] = useState('');
    const [employees, setEmployees] = useState(0);
    const [positions, setPositions] = useState(0);
    const [syncing, setSyncing] = useState(false);

    // load saved data
    const getData = async () => {
        const date = (await AsyncStorage.getItem('lastSync')) || '';
        setLastSync(date);

        const counts = await AsyncStorage.getItem('lastSyncCounts');
        if (counts) {
            const data = JSON.parse(counts);
            setEmployees(data.employees || 0);
            setPositions(data.positions || 0);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    // when sync finishes
    useEffect(() => {
        if (success && success.visible && success.type === 'success-pull') {
            getData();
            setSyncing(false);
        }
    }, [success]);

    const handleSync = () => {
        setSyncing(true);
        pullOnline();
    };

    let syncText = 'Never synced';
    if (lastSync) {
        syncText = dayjs(lastSync).format('MMM D, YYYY h:mm A');
    }

    return (
        <ScrollView style={styles.container}>
            <TextComponent style={styles.title}>Data & Sync</TextComponent>

            <View style={styles.box}>
                <TextComponent style={styles.boxTitle}>
                    Cloud Synchronization
                </TextComponent>
                <TextComponent style={styles.text}>
                    Last sync: {syncText}
                </TextComponent>

                <View style={styles.row}>
                    <View style={styles.countBox}>
                        <TextComponent style={styles.number}>
                            {employees}
                        </TextComponent>
                        <TextComponent style={styles.label}>
                            Employees
                        </TextComponent>
                    </View>
                    <View style={styles.countBox}>
                        <TextComponent style={styles.number}>
                            {positions}
                        </TextComponent>
                        <TextComponent style={styles.label}>
                            Positions
                        </TextComponent>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSync}
                    disabled={syncing}>
                    <TextComponent style={styles.buttonText}>
                        {syncing ? 'Syncing...' : 'Pull Latest Data'}
                    </TextComponent>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    box: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
        padding: 16,
    },
    boxTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    text: {
        fontSize: 13,
        color: '#555555',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    countBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#dddddd',
        borderRadius: 6,
        padding: 10,
        marginRight: 8,
        alignItems: 'center',
    },
    number: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 12,
        color: '#777777',
    },
    button: {
        backgroundColor: PRIMARY_COLOR,
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default SettingsTab;
