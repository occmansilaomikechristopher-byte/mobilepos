// @ts-nocheck
import React, {useEffect, useState} from 'react';
import {View, StyleSheet, StatusBar, SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {TouchableRipple} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TextComponent} from '../components';
import {PRIMARY_COLOR, SECONDARY_COLOR} from '../utils/constant';
import {HomeScreenNavigationProp} from '../AppNavigator';

const NAVY_DARK = '#0F172A';
const NAVY_MID = '#1E3A5F';

interface Props {
    navigation: HomeScreenNavigationProp;
}

const PortalScreen: React.FC<Props> = ({navigation}) => {
    const [name, setName] = useState('');

    useEffect(() => {
        AsyncStorage.getItem('name').then(n => setName(n || '')).catch(error => {
            console.error('❌ PortalScreen name Error:', error);
        });
    }, []);

    const portals = [
        {
            key: 'timekeeper',
            title: 'Timekeeper',
            subtitle: 'Attendance, DTR & payroll',
            icon: 'event-note',
            color: PRIMARY_COLOR,
            onPress: () =>
                navigation.reset({index: 0, routes: [{name: 'ProfilePage'}]}),
        },
        {
            key: 'pos',
            title: 'Point of Sale',
            subtitle: 'Sales, products & branch inventory',
            icon: 'point-of-sale',
            color: '#219688',
            onPress: () =>
                navigation.reset({index: 0, routes: [{name: 'POSDashboard'}]}),
        },
    ];

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY_DARK} />
            <LinearGradient
                colors={[NAVY_DARK, NAVY_MID]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.header}>
                <SafeAreaView>
                    <TextComponent style={styles.hi}>Welcome,</TextComponent>
                    <TextComponent style={styles.name} numberOfLines={1}>
                        {name}
                    </TextComponent>
                    <TextComponent style={styles.hint}>
                        Choose a portal to continue
                    </TextComponent>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.body}>
                {portals.map(p => (
                    <TouchableRipple
                        key={p.key}
                        onPress={p.onPress}
                        rippleColor={`${p.color}15`}
                        style={styles.card}>
                        <View style={styles.cardInner}>
                            <View
                                style={[
                                    styles.iconWrap,
                                    {backgroundColor: `${p.color}15`},
                                ]}>
                                <MaterialIcons
                                    name={p.icon}
                                    size={30}
                                    color={p.color}
                                />
                            </View>
                            <View style={styles.cardText}>
                                <TextComponent style={styles.cardTitle}>
                                    {p.title}
                                </TextComponent>
                                <TextComponent style={styles.cardSubtitle}>
                                    {p.subtitle}
                                </TextComponent>
                            </View>
                            <MaterialIcons
                                name="chevron-right"
                                size={24}
                                color="#CBD5E1"
                            />
                        </View>
                    </TouchableRipple>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#F1F5F9'},
    header: {
        paddingHorizontal: 22,
        paddingTop: 18,
        paddingBottom: 40,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    hi: {color: 'rgba(255,255,255,0.6)', fontSize: 14},
    name: {color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2},
    hint: {color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 10},
    body: {padding: 18, marginTop: -22, gap: 14},
    card: {
        borderRadius: 16,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardText: {flex: 1},
    cardTitle: {fontSize: 16, fontWeight: '700', color: '#0F172A'},
    cardSubtitle: {fontSize: 12, color: '#64748B', marginTop: 3},
});

export default PortalScreen;
