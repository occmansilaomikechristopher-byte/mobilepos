import React, {useState, useEffect, useCallback} from 'react';
import {
    View,
    StyleSheet,
    Alert,
    Linking,
    ScrollView,
    RefreshControl,
    Platform,
} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {useNavigation} from '@react-navigation/native';
import {ButtonComponent, TextComponent} from '../components';

const PermissionPage = () => {
    const [audioPermission, setAudioPermission] = useState(null);

    // Storage permissions (different for Android 13+)
    const [storagePermissions, setStoragePermissions] = useState({
        readImages: null,
        readVideo: null,
        readAudio: null,
        readExternal: null,
        writeExternal: null,
    });

    const [refreshing, setRefreshing] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const navigation = useNavigation();

    const isAndroid13OrHigher =
        Platform.OS === 'android' && Platform.Version >= 33;

    useEffect(() => {
        checkPermissions();
    }, []);

    useEffect(() => {
        if (areAllPermissionsGranted()) {
            Alert.alert(
                'Success',
                'All required permissions have been granted!',
                [
                    {
                        text: 'Continue to App',
                        onPress: () =>
                            navigation.reset({
                                index: 0,
                                routes: [{name: 'MainScreen'}],
                            }),
                    },
                ]
            );
        }
    }, [audioPermission, storagePermissions, navigation]);

    const checkPermissions = async () => {
        try {
            // Check audio
            const audioResult = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
            setAudioPermission(audioResult);

            // Check storage permissions based on Android version
            if (isAndroid13OrHigher) {
                // Android 13+ specific permissions
                const readImagesResult = await check(
                    PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
                );
                const readVideoResult = await check(
                    PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
                );
                const readAudioResult = await check(
                    PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
                );

                setStoragePermissions({
                    readImages: readImagesResult,
                    readVideo: readVideoResult,
                    readAudio: readAudioResult,
                    readExternal: RESULTS.UNAVAILABLE,
                    writeExternal: RESULTS.UNAVAILABLE,
                });
            } else {
                // Android 12 and below
                const readStorageResult = await check(
                    PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
                );
                const writeStorageResult = await check(
                    PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
                );

                setStoragePermissions({
                    readImages: RESULTS.UNAVAILABLE,
                    readVideo: RESULTS.UNAVAILABLE,
                    readAudio: RESULTS.UNAVAILABLE,
                    readExternal: readStorageResult,
                    writeExternal: writeStorageResult,
                });
            }
        } catch (error) {
            console.error('Error checking permissions:', error);
            Alert.alert(
                'Error',
                'Failed to check permissions. Please try again.',
            );
        }
    };

    const areAllPermissionsGranted = () => {
        // Check audio permission
        if (audioPermission !== RESULTS.GRANTED) {
            return false;
        }

        // Check storage permissions based on Android version
        if (isAndroid13OrHigher) {
            return (
                storagePermissions.readImages === RESULTS.GRANTED &&
                storagePermissions.readVideo === RESULTS.GRANTED &&
                storagePermissions.readAudio === RESULTS.GRANTED
            );
        } else {
            return (
                storagePermissions.readExternal === RESULTS.GRANTED &&
                storagePermissions.writeExternal === RESULTS.GRANTED
            );
        }
    };

    const getMissingPermissions = () => {
        const missing = [];

        if (audioPermission !== RESULTS.GRANTED) {missing.push('Microphone');}

        if (isAndroid13OrHigher) {
            if (storagePermissions.readImages !== RESULTS.GRANTED)
                {missing.push('Read Images');}
            if (storagePermissions.readVideo !== RESULTS.GRANTED)
                {missing.push('Read Videos');}
            if (storagePermissions.readAudio !== RESULTS.GRANTED)
                {missing.push('Read Audio');}
        } else {
            if (storagePermissions.readExternal !== RESULTS.GRANTED)
                {missing.push('Read Storage');}
            if (storagePermissions.writeExternal !== RESULTS.GRANTED)
                {missing.push('Write Storage');}
        }

        return missing;
    };

    const showMissingPermissionsAlert = () => {
        const missingPermissions = getMissingPermissions();

        if (missingPermissions.length > 0) {
            Alert.alert(
                'Permissions Required',
                `The following permissions are still not granted:\n\n${missingPermissions
                    .map(p => `• ${p}`)
                    .join(
                        '\n',
                    )}\n\nThe app may not function properly without these permissions.`,
                [
                    {text: 'OK'},
                    {
                        text: 'Try Again',
                        onPress: requestAllPermissions, 
                    },
                    {
                        text: 'Open Settings',
                        onPress: openAppSettings,
                    }
                ],
            );
        } else {
            Alert.alert('Success', 'All permissions are granted!');
        }
    };

    const requestAllPermissions = async () => {
        if (isRequesting) {return;}

        setIsRequesting(true);

        try {
            // Show initial confirmation
            const confirmRequest = await new Promise(resolve => {
                const permissionList = isAndroid13OrHigher
                    ? '• Microphone\n• Read Images\n• Read Videos\n• Read Audio'
                    : '• Microphone\n• Read Storage\n• Write Storage';

                Alert.alert(
                    'Grant Permissions',
                    `This app needs the following permissions to function properly:\n\n${permissionList}\n\nWould you like to grant these permissions?`,
                    [
                        {
                            text: 'Cancel',
                            onPress: () => resolve(false),
                            style: 'cancel',
                        },
                        {text: 'Continue', onPress: () => resolve(true)},
                    ],
                );
            });

            if (!confirmRequest) {
                setIsRequesting(false);
                return;
            }

            // Request audio
            if (audioPermission !== RESULTS.GRANTED) {
                const audioResult = await request(
                    PERMISSIONS.ANDROID.RECORD_AUDIO,
                );
                setAudioPermission(audioResult);

                if (audioResult === RESULTS.BLOCKED) {
                    Alert.alert(
                        'Microphone Permission Blocked',
                        'Microphone permission is permanently denied. Please enable it from settings.',
                        [
                            {text: 'Cancel', style: 'cancel'},
                            {text: 'Open Settings', onPress: openAppSettings},
                        ],
                    );
                }
            }

            // Request storage permissions based on Android version
            if (isAndroid13OrHigher) {
                // Android 13+ permissions
                if (storagePermissions.readImages !== RESULTS.GRANTED) {
                    const imagesResult = await request(
                        PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
                    );
                    setStoragePermissions(prev => ({
                        ...prev,
                        readImages: imagesResult,
                    }));
                }

                if (storagePermissions.readVideo !== RESULTS.GRANTED) {
                    const videoResult = await request(
                        PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
                    );
                    setStoragePermissions(prev => ({
                        ...prev,
                        readVideo: videoResult,
                    }));
                }

                if (storagePermissions.readAudio !== RESULTS.GRANTED) {
                    const audioResult = await request(
                        PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
                    );
                    setStoragePermissions(prev => ({
                        ...prev,
                        readAudio: audioResult,
                    }));
                }
            } else {
                // Android 12 and below
                if (storagePermissions.readExternal !== RESULTS.GRANTED) {
                    const readResult = await request(
                        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
                    );
                    setStoragePermissions(prev => ({
                        ...prev,
                        readExternal: readResult,
                    }));
                }

                if (storagePermissions.writeExternal !== RESULTS.GRANTED) {
                    const writeResult = await request(
                        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
                    );
                    setStoragePermissions(prev => ({
                        ...prev,
                        writeExternal: writeResult,
                    }));
                }
            }

            // Final check
            if (!areAllPermissionsGranted()) {
                showMissingPermissionsAlert();
            }
        } catch (error) {
            console.error('Error requesting permissions:', error);
            Alert.alert(
                'Error',
                'Failed to request permissions. Please try again.',
            );
        } finally {
            setIsRequesting(false);
        }
    };

    const openAppSettings = () => {
        Linking.openSettings();
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        checkPermissions().then(() => setRefreshing(false)).catch(error => {
            console.error('❌ PermissionPage checkPermissions Error:', error);
            setRefreshing(false);
        });
    }, []);

    const getPermissionStatusText = status => {
        switch (status) {
            case RESULTS.GRANTED:
                return '✓ Granted';
            case RESULTS.DENIED:
                return '✗ Denied';
            case RESULTS.BLOCKED:
                return '⚠ Blocked';
            case RESULTS.UNAVAILABLE:
                return '○ Not Required';
            default:
                return '• Unknown';
        }
    };

    const getPermissionStatusColor = status => {
        switch (status) {
            case RESULTS.GRANTED:
                return '#4CAF50';
            case RESULTS.DENIED:
                return '#FF9800';
            case RESULTS.BLOCKED:
                return '#F44336';
            case RESULTS.UNAVAILABLE:
                return '#9E9E9E';
            default:
                return '#9E9E9E';
        }
    };

    const allPermissionsGranted = areAllPermissionsGranted();
    const missingPermissions = getMissingPermissions();

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            <TextComponent style={styles.title}>
                Permissions Required
            </TextComponent>

            <View style={styles.permissionContainer}>
                <TextComponent style={styles.sectionTitle}>
                    Audio Permission
                </TextComponent>

                <TextComponent style={styles.permissionItem}>
                    Microphone:{' '}
                    <TextComponent
                        style={{
                            color: getPermissionStatusColor(audioPermission),
                        }}>
                        {getPermissionStatusText(audioPermission)}
                    </TextComponent>
                </TextComponent>

                <TextComponent style={[styles.sectionTitle, {marginTop: 16}]}>
                    Storage Permissions{' '}
                    {isAndroid13OrHigher ? '(Android 13+)' : '(Android 12-)'}
                </TextComponent>

                {isAndroid13OrHigher ? (
                    <>
                        <TextComponent style={styles.permissionItem}>
                            Read Images:{' '}
                            <TextComponent
                                style={{
                                    color: getPermissionStatusColor(
                                        storagePermissions.readImages,
                                    ),
                                }}>
                                {getPermissionStatusText(
                                    storagePermissions.readImages,
                                )}
                            </TextComponent>
                        </TextComponent>

                        <TextComponent style={styles.permissionItem}>
                            Read Videos:{' '}
                            <TextComponent
                                style={{
                                    color: getPermissionStatusColor(
                                        storagePermissions.readVideo,
                                    ),
                                }}>
                                {getPermissionStatusText(
                                    storagePermissions.readVideo,
                                )}
                            </TextComponent>
                        </TextComponent>

                        <TextComponent style={styles.permissionItem}>
                            Read Audio:{' '}
                            <TextComponent
                                style={{
                                    color: getPermissionStatusColor(
                                        storagePermissions.readAudio,
                                    ),
                                }}>
                                {getPermissionStatusText(
                                    storagePermissions.readAudio,
                                )}
                            </TextComponent>
                        </TextComponent>
                    </>
                ) : (
                    <>
                        <TextComponent style={styles.permissionItem}>
                            Read Storage:{' '}
                            <TextComponent
                                style={{
                                    color: getPermissionStatusColor(
                                        storagePermissions.readExternal,
                                    ),
                                }}>
                                {getPermissionStatusText(
                                    storagePermissions.readExternal,
                                )}
                            </TextComponent>
                        </TextComponent>

                        <TextComponent style={styles.permissionItem}>
                            Write Storage:{' '}
                            <TextComponent
                                style={{
                                    color: getPermissionStatusColor(
                                        storagePermissions.writeExternal,
                                    ),
                                }}>
                                {getPermissionStatusText(
                                    storagePermissions.writeExternal,
                                )}
                            </TextComponent>
                        </TextComponent>
                    </>
                )}
            </View>

            {!allPermissionsGranted && missingPermissions.length > 0 && (
                <View style={styles.warningContainer}>
                    <TextComponent style={styles.warningTitle}>
                        ⚠ Some permissions are still not granted:
                    </TextComponent>
                    {missingPermissions.map((perm, index) => (
                        <TextComponent key={index} style={styles.warningText}>
                            • {perm}
                        </TextComponent>
                    ))}
                    <TextComponent style={styles.warningSubtext}>
                        The app may not function properly without these
                        permissions.
                    </TextComponent>
                </View>
            )}

            {allPermissionsGranted && (
                <TextComponent style={styles.successMessage}>
                    All permissions granted! ✓
                </TextComponent>
            )}

            <ButtonComponent
                label={
                    allPermissionsGranted
                        ? 'Permissions Granted'
                        : 'Grant All Permissions'
                }
                onPress={requestAllPermissions}
                disabled={isRequesting || allPermissionsGranted}
                style={
                    allPermissionsGranted
                        ? styles.grantedButton
                        : styles.requestButton
                }
            />

            {!allPermissionsGranted && (
                <>
                    <ButtonComponent
                        label="Check Missing Permissions"
                        onPress={showMissingPermissionsAlert}
                        style={styles.statusButton}
                    />

                    <ButtonComponent
                        label="Open Settings"
                        onPress={openAppSettings}
                        style={styles.settingsButton}
                    />
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 24,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    permissionContainer: {
        width: '100%',
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    permissionItem: {
        fontSize: 16,
        marginVertical: 6,
    },
    warningContainer: {
        width: '100%',
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF9800',
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F57C00',
        marginBottom: 8,
    },
    warningText: {
        fontSize: 14,
        color: '#F57C00',
        marginLeft: 8,
        marginVertical: 2,
    },
    warningSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic',
    },
    successMessage: {
        color: '#4CAF50',
        fontSize: 18,
        marginBottom: 16,
        fontWeight: 'bold',
    },
    requestButton: {
        marginVertical: 8,
        width: '100%',
    },
    grantedButton: {
        marginVertical: 8,
        width: '100%',
        backgroundColor: '#4CAF50',
    },
    statusButton: {
        marginVertical: 8,
        width: '100%',
        backgroundColor: '#2196F3',
    },
    settingsButton: {
        marginVertical: 8,
        width: '100%',
        backgroundColor: '#9C27B0',
    },
});

export default PermissionPage;
