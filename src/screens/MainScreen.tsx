import React, {useState, useEffect} from 'react';
import {useTheme, ProgressBar} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import {
    Image,
    View,
    StyleSheet,
    StatusBar,
    Platform,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {initDatabase} from '../utils/databaseService';
import {HomeScreenNavigationProp} from '../AppNavigator';
import {ButtonComponent, TextComponent} from '../components';
import {VERSIONS, PRIMARY_COLOR, SECONDARY_COLOR} from '../utils/constant';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {useFocusEffect} from '@react-navigation/native';

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

// Role-based landing: 8 = Cashier → POS, 9 = Secretary → portal chooser, 10 = Owner → Owner Dashboard, else → Dashboard
const landingForRole = (userType: string | number) => {
    const r = Number(userType);
    if (r === 8) {
        return 'POSDashboard';
    }
    if (r === 9) {
        return 'PortalScreen';
    }
    if (r === 10) {
        return 'OwnerDashboard';
    }
    return 'Dashboard';
};

const MainScreen: React.FC<HomeScreenProps> = ({navigation}) => {
    const [progress, setProgress] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [permissionCheckComplete, setPermissionCheckComplete] =
        useState<boolean>(false);

    const isAndroid13OrHigher =
        Platform.OS === 'android' && Platform.Version >= 33;

    useFocusEffect(
        React.useCallback(() => {
            checkPermissions();
        }, []),
    );

    useEffect(() => {
        const initializeApp = async () => {
            try {
                await initDatabase();
            } catch (error) {
                console.error('Error during initialization:', error);
                // Handle error appropriately
            }
        };

        initializeApp();

        const interval: any = setInterval(() => {
            setProgress(prev => {
                const nextProgress = prev + 0.01;
                if (nextProgress >= 1) {
                    clearInterval(interval);
                }
                return nextProgress > 1 ? 1 : nextProgress;
            });
        }, 30);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (progress >= 1 && permissionCheckComplete) {
            onProgressComplete();
        }
    }, [progress, permissionCheckComplete]);

    const checkPermissions = async () => {
        try {
            // Check audio permission
            const audioResult = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);

            // Check storage permissions based on Android version
            let readStorageResult, writeStorageResult;
            let readImagesResult, readVideoResult, readAudioResult;

            if (isAndroid13OrHigher) {
                // Android 13+ permissions
                readImagesResult = await check(
                    PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
                );
                readVideoResult = await check(
                    PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
                );
                readAudioResult = await check(
                    PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
                );
                // Legacy storage permissions are not used in Android 13+
                readStorageResult = RESULTS.UNAVAILABLE;
                writeStorageResult = RESULTS.UNAVAILABLE;
            } else {
                // Android 12 and below
                readStorageResult = await check(
                    PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
                );
                writeStorageResult = await check(
                    PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
                );
                // New permissions are not available on older Android
                readImagesResult = RESULTS.UNAVAILABLE;
                readVideoResult = RESULTS.UNAVAILABLE;
                readAudioResult = RESULTS.UNAVAILABLE;
            }

            // Get user type
            const userType = String(
                (await AsyncStorage.getItem('userType')) || '',
            );

            // Check if all required permissions are granted based on Android version
            let allPermissionsGranted = audioResult === RESULTS.GRANTED;

            // Add storage permission checks based on Android version
            if (isAndroid13OrHigher) {
                allPermissionsGranted =
                    allPermissionsGranted &&
                    readImagesResult === RESULTS.GRANTED &&
                    readVideoResult === RESULTS.GRANTED &&
                    readAudioResult === RESULTS.GRANTED;
            } else {
                allPermissionsGranted =
                    allPermissionsGranted &&
                    readStorageResult === RESULTS.GRANTED &&
                    writeStorageResult === RESULTS.GRANTED;
            }

            setPermissionCheckComplete(true);

            if (!allPermissionsGranted) {
                // Show alert about missing permissions before navigating
                const missingPermissions = [];

                if (audioResult !== RESULTS.GRANTED) {
                    missingPermissions.push('Microphone');
                }

                if (isAndroid13OrHigher) {
                    if (readImagesResult !== RESULTS.GRANTED) {
                        missingPermissions.push('Read Images');
                    }
                    if (readVideoResult !== RESULTS.GRANTED) {
                        missingPermissions.push('Read Videos');
                    }
                    if (readAudioResult !== RESULTS.GRANTED) {
                        missingPermissions.push('Read Audio');
                    }
                } else {
                    if (readStorageResult !== RESULTS.GRANTED) {
                        missingPermissions.push('Read Storage');
                    }
                    if (writeStorageResult !== RESULTS.GRANTED) {
                        missingPermissions.push('Write Storage');
                    }
                }

                Alert.alert(
                    'Permissions Required',
                    `The following permissions are required:\n\n${missingPermissions
                        .map(p => `• ${p}`)
                        .join(
                            '\n',
                        )}\n\nPlease grant these permissions to continue.`,
                    [
                        {
                            text: 'OK',
                            onPress: () =>
                                navigation.navigate('PermissionPage'),
                        },
                    ],
                );
                return;
            }

            // All permissions granted, check user login status
            if (userType && userType !== 'null' && userType !== '') {
                navigation.navigate(landingForRole(userType));
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error checking permissions:', error);
            setPermissionCheckComplete(true);
            setLoading(false);
        }
    };

    const onProgressComplete = async () => {
        try {
            // This function is now only called when progress is complete
            // and permission check is already done
            const userType = String(await AsyncStorage.getItem('userType'));

            if (userType && userType !== 'null') {
                navigation.navigate(landingForRole(userType));
            } else {
                setLoading(false);
                setProgress(0); // Reset progress for next time
            }
        } catch (error) {
            console.error('Error in onProgressComplete:', error);
            setLoading(false);
        }
    };

    const handleLoginPress = () => {
        navigation.navigate('Login');
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar
                    barStyle="light-content"
                    backgroundColor={SECONDARY_COLOR}
                />
                <LinearGradient
                    colors={['#fff', PRIMARY_COLOR]}
                    start={{x: 0, y: 0}}
                    end={{x: 0, y: 0.9}}
                    style={styles.header}>
                    <View style={styles.logoWrapper}>
                        <Image
                            style={styles.logo}
                            source={require('../assets/images/logo.jpg')}
                        />
                    </View>
                    <TextComponent style={[styles.text, {marginTop: 10}]}>
                        Progress: {Math.round(progress * 100)}%
                    </TextComponent>
                    <ProgressBar
                        progress={progress}
                        color={'#fff'}
                        style={styles.progressBar}
                    />
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#f3f6ff" />
            <LinearGradient
                colors={[SECONDARY_COLOR, PRIMARY_COLOR]}
                start={{x: 0, y: 0}}
                end={{x: 0, y: 0.9}}
                style={styles.header}>
                <View style={styles.logoWrapper}>
                    <Image
                        style={styles.logo}
                        source={require('../assets/images/logo.jpg')}
                    />
                </View>
            </LinearGradient>
            <View style={styles.separator} />
            <View style={styles.footer}>
                <TextComponent variant="titleLarge">
                    Welcome to Glass App
                </TextComponent>
                <TextComponent style={{marginTop: 10}} variant="bodyMedium">
                    GV Aluminum and Glass Supply is a trusted provider of
                    high-quality aluminum and glass products for residential and
                    commercial projects. The company offers customized
                    solutions, reliable craftsmanship, and excellent customer
                    service to meet client needs. Committed to quality and
                    customer satisfaction, GV Aluminum and Glass Supply delivers
                    durable, affordable, and professionally installed products.
                </TextComponent>

                <View style={styles.stylesFooterAction}>
                    <ButtonComponent label="Login" onPress={handleLoginPress} />
                </View>
                <View style={{marginBottom: 20}}>
                    <TextComponent style={{textAlign: 'center'}}>
                        {VERSIONS}
                    </TextComponent>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    separator: {
        height: 30,
        borderWidth: 3,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        marginTop: -30,
        minHeight: 30,
        backgroundColor: '#ffffff',
        borderColor: 'transparent',
    },
    footer: {
        backgroundColor: '#fff',
        height: '45%',
        paddingHorizontal: 20,
    },
    logo: {
        width: 80,
        height: 80,
    },
    stylesFooterAction: {
        flex: 1,
        justifyContent: 'center',
    },
    progressBar: {
        width: 200,
        height: 4,
        zIndex: 999,
    },
    text: {
        fontSize: 12,
        marginBottom: 10,
        color: '#fff',
    },
    logoWrapper: {
        backgroundColor: '#fff',
        height: 150,
        width: 150,
        borderRadius: 150 / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MainScreen;
