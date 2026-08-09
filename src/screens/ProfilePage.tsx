import React, {useState, useEffect} from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import {TouchableRipple} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {TextComponent} from '../components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {VERSIONS} from '../utils/constant';
import {HomeScreenNavigationProp} from '../AppNavigator';
import RNRestart from 'react-native-restart';

const NAVY_DARK = '#0F172A';
const NAVY_MID = '#1E3A5F';
const BRAND_RED = '#219688';
const BG = '#F1F5F9';

const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() || '?';
};

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

interface Site {
    id: string;
    site_name: string;
    site_code: string;
    site_address: string;
    cluster: string;
    status: number;
    employer_id?: string;
}

const ProfilePage: React.FC<HomeScreenProps> = ({navigation}) => {
    const [name, setName] = useState('');
    const [employer, setEmployer] = useState('');
    const [cluster, setCluster] = useState('');
    const [sites, setSites] = useState<Site[]>([]);
    const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [isSecretary, setIsSecretary] = useState(false);

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            const namedata = (await AsyncStorage.getItem('name')) || '';
            const employer_name =
                (await AsyncStorage.getItem('employer_name')) || '';
            const cluster_name = (await AsyncStorage.getItem('cluster')) || '';
            const storedSites = await AsyncStorage.getItem('sites');
            const selectedSiteId = await AsyncStorage.getItem('site_id');
            const userType = await AsyncStorage.getItem('userType');
            setIsSecretary(Number(userType) === 9);

            setName(namedata);
            setEmployer(employer_name);
            setCluster(cluster_name);

            if (storedSites) {
                const parsedSites = JSON.parse(storedSites);
                // ✅ Only show active sites
                const activeSites = parsedSites.filter(
                    (site: Site) => site.status == 1,
                );

                // ✅ Sort sites: active site first, then others
            const sortedSites = activeSites.sort((a: Site, b: Site) => {
                if (a.id === selectedSiteId) {
                    return -1;
                }
                if (b.id === selectedSiteId) {
                    return 1;
                }
                return 0;
            });

            setSites(sortedSites);
        }

        setActiveSiteId(selectedSiteId);
        } catch (error: any) {
            console.error('❌ ProfilePage loadProfileData Error:', error);
        }
    };

    const handleSiteSelect = (site: Site) => {
        if (site.id === activeSiteId) {
            return; // Don't show confirmation if selecting the same site
        }

        setSelectedSite(site);
        Alert.alert(
            'Change Site',
            `Are you sure you want to switch to ${site.site_name}? The app will restart to apply changes.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => setSelectedSite(null),
                },
                {
                    text: 'Change Site',
                    onPress: () => confirmSiteChange(site),
                    style: 'destructive',
                },
            ],
            {cancelable: true},
        );
    };

    const confirmSiteChange = async (site: Site) => {
        try {
            // Update site information in AsyncStorage
            await AsyncStorage.setItem('site_id', site.id.toString());
            await AsyncStorage.setItem(
                'employer_id',
                (site.employer_id ?? '').toString(),
            );
            await AsyncStorage.setItem('site_code', site.site_code);
            await AsyncStorage.setItem('site_name', site.site_name);
            await AsyncStorage.setItem('site_address', site.site_address);
            await AsyncStorage.setItem('cluster', site.cluster);

            // Update UI state
            setActiveSiteId(site.id);

            Alert.alert(
                'Site Changed Successfully',
                `You are now active on: ${site.site_name}. The app will restart to apply all changes.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Use RNRestart to properly restart the app
                            RNRestart.restart();
                        },
                    },
                ],
                {cancelable: false},
            );
        } catch (error) {
            console.error('Error changing site:', error);
            Alert.alert('Error', 'Failed to change site. Please try again.');
            setSelectedSite(null);
        }
    };

    const logout = async () => {
        Alert.alert('Confirm Sign Out', 'Are you sure you want to sign out?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Sign Out',
                onPress: async () => {
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('verified');
                    await AsyncStorage.removeItem('employer_name');
                    await AsyncStorage.setItem('registered', 'yes');
                    await AsyncStorage.removeItem('name');
                    await AsyncStorage.removeItem('userType');
                    await AsyncStorage.removeItem('cluster');
                    await AsyncStorage.removeItem('userid');
                    await AsyncStorage.removeItem('sites');
                    await AsyncStorage.removeItem('site_id');
                    await AsyncStorage.removeItem('site_code');
                    await AsyncStorage.removeItem('site_name');
                    await AsyncStorage.removeItem('site_address');
                    navigation.reset({
                        index: 0,
                        routes: [{name: 'Login'}],
                    });
                },
            },
        ]);
    };

    const currentSite =
        sites.find(site => site.id === activeSiteId)?.site_name ||
        'Not selected';

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY_DARK} />

            {/* ── Header ── */}
            <LinearGradient
                colors={[NAVY_DARK, NAVY_MID]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.header}>
                <SafeAreaView>
                    {/* Top bar */}
                    <View style={styles.topBar}>
                        <TouchableRipple
                            borderless
                            rippleColor="rgba(255,255,255,0.15)"
                            style={styles.backBtn}
                            onPress={() => navigation.navigate('Dashboard')}>
                            <MaterialIcons
                                name="arrow-back"
                                size={22}
                                color="#fff"
                            />
                        </TouchableRipple>
                        <TextComponent style={styles.topBarTitle}>
                            Profile
                        </TextComponent>
                        <View style={styles.backBtn} />
                    </View>

                    {/* Avatar + identity */}
                    <View style={styles.identity}>
                        <View style={styles.avatarRing}>
                            <View style={styles.avatarCircle}>
                                <TextComponent style={styles.avatarText}>
                                    {getInitials(name)}
                                </TextComponent>
                            </View>
                        </View>
                        <TextComponent style={styles.name} numberOfLines={1}>
                            {name || '—'}
                        </TextComponent>

                        <View style={styles.metaRow}>
                            <View style={styles.rolePill}>
                                <MaterialIcons
                                    name="business"
                                    size={11}
                                    color="#FCA5A5"
                                />
                                <TextComponent style={styles.rolePillText}>
                                    {employer || 'Employer'}
                                </TextComponent>
                            </View>
                            {!!cluster && (
                                <View style={styles.metaChip}>
                                    <MaterialIcons
                                        name="hub"
                                        size={12}
                                        color="rgba(255,255,255,0.6)"
                                    />
                                    <TextComponent style={styles.metaChipText}>
                                        {cluster}
                                    </TextComponent>
                                </View>
                            )}
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                {/* Rounded cap overlapping header */}
                <View style={styles.cap} />

                {/* Switch to POS — Secretary only */}
                {isSecretary && (
                    <TouchableRipple
                        onPress={() =>
                            navigation.reset({
                                index: 0,
                                routes: [{name: 'POSDashboard'}],
                            })
                        }
                        rippleColor="rgba(33,150,136,0.15)"
                        style={styles.switchBtn}>
                        <View style={styles.btnInner}>
                            <MaterialIcons
                                name="point-of-sale"
                                size={18}
                                color="#fff"
                            />
                            <TextComponent style={styles.switchBtnText}>
                                Switch to POS
                            </TextComponent>
                        </View>
                    </TouchableRipple>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableRipple
                        onPress={() => navigation.navigate('Dashboard')}
                        rippleColor="rgba(0,0,0,0.06)"
                        style={styles.outlinedBtn}>
                        <View style={styles.btnInner}>
                            <MaterialIcons
                                name="home"
                                size={18}
                                color={NAVY_DARK}
                            />
                            <TextComponent style={styles.outlinedBtnText}>
                                Homepage
                            </TextComponent>
                        </View>
                    </TouchableRipple>
                    <TouchableRipple
                        onPress={logout}
                        rippleColor="rgba(255,255,255,0.2)"
                        style={styles.dangerBtn}>
                        <View style={styles.btnInner}>
                            <MaterialIcons
                                name="logout"
                                size={18}
                                color="#fff"
                            />
                            <TextComponent style={styles.dangerBtnText}>
                                Sign Out
                            </TextComponent>
                        </View>
                    </TouchableRipple>
                </View>

                <TextComponent style={styles.version}>{VERSIONS}</TextComponent>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: NAVY_DARK,
    },
    header: {
        paddingBottom: 30,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    identity: {
        alignItems: 'center',
        paddingTop: 6,
    },
    avatarRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: BRAND_RED,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '800',
    },
    name: {
        color: '#fff',
        fontSize: 21,
        fontWeight: '800',
        letterSpacing: 0.2,
        maxWidth: '85%',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
    },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: `${BRAND_RED}33`,
        borderColor: `${BRAND_RED}66`,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    rolePillText: {
        color: '#FCA5A5',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaChipText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    cap: {
        height: 24,
        marginTop: -24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: BG,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: -4,
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.8,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: NAVY_DARK,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 22,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: `${BRAND_RED}12`,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: `${BRAND_RED}25`,
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
        color: BRAND_RED,
    },
    siteCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 10,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    siteCardActive: {
        borderWidth: 1.5,
        borderColor: `${BRAND_RED}40`,
    },
    siteCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 14,
    },
    siteBar: {
        width: 4,
        alignSelf: 'stretch',
        minHeight: 96,
    },
    siteContent: {
        flex: 1,
        paddingVertical: 12,
        paddingLeft: 14,
        gap: 3,
    },
    siteTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    empTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    empTagText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#16A34A',
        letterSpacing: 0.5,
    },
    siteName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    siteMetaRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 5,
    },
    siteMetaText: {
        flex: 1,
        fontSize: 12,
        color: '#64748B',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    radioActive: {
        borderColor: BRAND_RED,
    },
    radioInner: {
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: BRAND_RED,
    },
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: 30,
        gap: 8,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    switchBtn: {
        marginHorizontal: 16,
        marginTop: 18,
        backgroundColor: BRAND_RED,
        borderRadius: 12,
        overflow: 'hidden',
    },
    switchBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        marginTop: 12,
    },
    outlinedBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    dangerBtn: {
        flex: 1,
        backgroundColor: BRAND_RED,
        borderRadius: 12,
        overflow: 'hidden',
    },
    btnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
    },
    outlinedBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: NAVY_DARK,
    },
    dangerBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    version: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 22,
    },
});

export default ProfilePage;
