import React, {useEffect, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTabNavigation} from 'react-native-paper-tabs';
import {HomeScreenNavigationProp} from '../AppNavigator';
import {TextComponent} from '../components/';
import {PRIMARY_COLOR} from '../utils/constant';

interface Props {
    navigation: HomeScreenNavigationProp;
}

const HomeTabContent: React.FC<Props> = ({navigation}) => {
    const goToTab = useTabNavigation();
    const [name, setName] = useState('');

    useEffect(() => {
        AsyncStorage.getItem('name')
            .then(value => setName(value || ''))
            .catch(error => console.error('Home name load failed:', error));
    }, []);

    const actions = [
        {
            icon: 'fingerprint',
            title: 'Set Bio Code',
            subtitle: 'Assign employee codes',
            route: 'EmployeeListScreen',
        },
        {icon: 'event-note', title: 'View DTR', subtitle: 'Review attendance', tab: 1},
        {icon: 'add-circle-outline', title: 'Create DTR', subtitle: 'Upload biometric logs', tab: 2},
        {icon: 'people-outline', title: 'Employees', subtitle: 'Manage your team', tab: 3},
        {icon: 'settings', title: 'Settings', subtitle: 'Update preferences', tab: 4},
    ];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeCard}>
                <View style={styles.iconCircle}>
                    <MaterialIcons name="fingerprint" size={28} color="#fff" />
                </View>
                <View style={styles.welcomeText}>
                    <TextComponent style={styles.eyebrow}>WELCOME BACK</TextComponent>
                    <TextComponent style={styles.title} numberOfLines={1}>
                        {name || 'Secretary'}
                    </TextComponent>
                    <TextComponent style={styles.subtitle}>
                        Manage attendance quickly from here.
                    </TextComponent>
                </View>
            </View>

            <TextComponent style={styles.sectionTitle}>Quick actions</TextComponent>
            <View style={styles.actionGrid}>
                {actions.map(action => (
                    <TouchableOpacity
                        key={action.title}
                        style={styles.actionCard}
                        activeOpacity={0.75}
                        onPress={() =>
                            action.route
                                ? navigation.navigate(action.route)
                                : goToTab(action.tab)
                        }>
                        <MaterialIcons name={action.icon} size={25} color={PRIMARY_COLOR} />
                        <TextComponent style={styles.actionTitle}>{action.title}</TextComponent>
                        <TextComponent style={styles.actionSubtitle}>{action.subtitle}</TextComponent>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    contentContainer: {padding: 18, paddingBottom: 28},
    welcomeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 18,
        padding: 18,
        marginBottom: 24,
    },
    iconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    welcomeText: {flex: 1},
    eyebrow: {fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: 1},
    title: {fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2},
    subtitle: {fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 5},
    sectionTitle: {fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 12},
    actionGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
    actionCard: {
        width: '48%',
        minHeight: 125,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    actionTitle: {fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 12},
    actionSubtitle: {fontSize: 11, color: '#64748B', marginTop: 4},
});

export default HomeTabContent;
