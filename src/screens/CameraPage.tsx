import React, {useEffect, useState, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Image} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {ButtonComponent, TextInputComponent} from '../components';
import {Appbar} from 'react-native-paper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import RNFS from 'react-native-fs';
import useGlobalStore from '../store/globalState';
import {useNavigation} from '@react-navigation/native';

function CameraPage() {
    const navigation = useNavigation();
    const {insertMyDTRDetailsAction, success, setSuccess} = useGlobalStore();

    const [cameraPosition, setCameraPosition] = useState('back');
    const [showCamera, setShowCamera] = useState(true);
    const [imageSource, setImageSource] = useState('');
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');

    const devices = useCameraDevice(cameraPosition);
    const camera = useRef(null);

    useEffect(() => {
        if (success?.visible && success.type === 'add-visitor') {
            setName('');
            setCompany('');
            setImageSource('');
            setShowCamera(true);
            navigation.navigate('VistiorsLogs');
        }
    }, [success]);

    useEffect(() => {
        async function getPermission() {
            const newCameraPermission = await Camera.requestCameraPermission();
            console.log(newCameraPermission);
        }
        getPermission();
    }, []);

    const capturePhoto = async () => {
        if (camera.current) {
            try {
                const photo = await camera.current.takeSnapshot({
                    enableAutoStabilization: true,
                    skipMetadata: true,
                    qualityPrioritization: 'speed',
                    quality: 50,
                });
                setImageSource(photo.path);
                setShowCamera(false);
            } catch (error) {
                console.error('Failed to take picture:', error);
            }
        }
    };

    const saveImage = async () => {
        const base64Image = await RNFS.readFile(imageSource, 'base64');
        insertMyDTRDetailsAction({
            image: base64Image,
            name,
            company,
        });
    };

    if (devices == null) {
        return <Text>Camera not available</Text>;
    }

    if (imageSource) {
        return (
            <View style={styles.containerWrapper}>
                <Appbar.Header>
                    <Appbar.Action
                        icon="close"
                        onPress={() => navigation.goBack()}
                    />
                    <Appbar.Content title="Visitor Details" />
                </Appbar.Header>
                <KeyboardAwareScrollView
                    keyboardShouldPersistTaps={'always'}
                    showsVerticalScrollIndicator={false}>
                    <View
                        style={{
                            padding: 10,
                            width: '100%',
                            alignItems: 'center',
                            flex: 1,
                        }}>
                        <Image
                            style={styles.image}
                            source={{
                                uri: `file://'${imageSource}`,
                            }}
                        />
                        <ButtonComponent
                            mode="outlined"
                            label="Retake"
                            onPress={() => {
                                setShowCamera(true);
                                setImageSource('');
                            }}
                        />
                        <TextInputComponent
                            returnKeyType={'next'}
                            placeholder="Name"
                            value={name}
                            onChangeText={value => setName(value)}
                        />
                        <TextInputComponent
                            returnKeyType={'done'}
                            placeholder="Company"
                            value={company}
                            onChangeText={value => setCompany(value)}
                        />
                        <ButtonComponent
                            label="Save"
                            onPress={() => {
                                saveImage();
                            }}
                        />
                    </View>
                </KeyboardAwareScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                ref={camera}
                style={[StyleSheet.absoluteFill]}
                device={devices}
                isActive={showCamera}
                photo={true}
                preset={'low'}
            />
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.camButton}
                    onPress={() => capturePhoto()}
                />
            </View>
        </View>
    );
}

export default CameraPage;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerWrapper: {
        flex: 1,
    },
    button: {
        backgroundColor: 'gray',
    },
    backButton: {
        backgroundColor: 'rgba(0,0,0,0.0)',
        position: 'absolute',
        justifyContent: 'center',
        width: '100%',
        top: 0,
        padding: 20,
    },
    buttonContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        bottom: 0,
        padding: 20,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    camButton: {
        height: 80,
        width: 80,
        borderRadius: 40,
        backgroundColor: 'red',

        alignSelf: 'center',
        borderWidth: 4,
        borderColor: 'white',
    },
    image: {
        height: 200,
        aspectRatio: 9 / 16,
    },
    timerContainer: {
        position: 'absolute',
        bottom: 10,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 20,
        textAlign: 'center',
        color: '#fff',
    },
    countDown: {
        backgroundColor: '#fa41fd',
        borderWidth: 5,
        borderColor: '#00dbde',
        width: 50,
        height: 50,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        borderWidth: 5,
        borderColor: '#00dbde',
    },
});
