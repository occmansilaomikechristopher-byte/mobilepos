import React, {useState, useRef, useEffect} from 'react';
import {
    useTheme,
    TextInput,
    IconButton,
    TouchableRipple,
    Text,
    HelperText,
} from 'react-native-paper';
import TextInputMask from 'react-native-text-input-mask';
import LinearGradient from 'react-native-linear-gradient';
import {
    View,
    StyleSheet,
    Image,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';
import useGlobalStore from '../store/globalState';
import {HomeScreenNavigationProp} from '../AppNavigator';
import {
    ButtonComponent,
    TextComponent,
    RowSeparator,
    NewCustomer,
} from '../components/';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {getUniqueId} from 'react-native-device-info';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import {playSound} from '../utils/helper';
import errorSound from '../assets/audio/error.wav';
import successSound from '../assets/audio/success.mp3';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {OTPInput} from '../components';
import {PRIMARY_COLOR} from '../utils/constant';

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

interface Props {
    resendOTPAction: () => void;
}

const ResendOTPButton: React.FC<Props> = ({resendOTPAction}) => {
    const [counter, setCounter] = useState<number>(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            const intervalId = setInterval(async () => {
                const lastOTPSentTime = await AsyncStorage.getItem(
                    'lastOTPSentTime',
                ).catch(error => {
                    console.error('❌ RegisterScreen getItem Error:', error);
                    return null;
                });
                if (lastOTPSentTime) {
                    const currentTime = Date.now();
                    const timeElapsed = currentTime - parseInt(lastOTPSentTime);
                    const remainingTime = 2 * 60 * 1000 - timeElapsed;
                    setCounter(Math.ceil(remainingTime / 1000));
                }
            }, 1000);
            return () => clearInterval(intervalId);
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    const sendOTP = async () => {
        try {
            const lastOTPSentTime = await AsyncStorage.getItem(
                'lastOTPSentTime',
            );
            const currentTime = Date.now();

            if (
                !lastOTPSentTime ||
                currentTime - parseInt(lastOTPSentTime) >= 2 * 60 * 1000
            ) {
                // Send OTP
                // Your code to send OTP goes here...

                // Store current time as last OTP sent time
                await AsyncStorage.setItem(
                    'lastOTPSentTime',
                    currentTime.toString(),
                );
                setCounter(120); // Reset counter to 120 seconds (2 minutes)
                resendOTPAction();
            } else {
                // Notify user that they can resend OTP after 2 minutes
                Alert.alert(
                    'Resend OTP',
                    'You can resend OTP after 2 minutes.',
                );
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
        }
    };

    return (
        <View style={{alignItems: 'center'}}>
            <ButtonComponent
                mode="text"
                label="Resend OTP"
                onPress={sendOTP}
                disabled={counter > 0}
            />
            {counter > 0 && (
                <Text
                    style={{
                        fontSize: 11,
                    }}>{`Resend OTP in ${counter} seconds`}</Text>
            )}
        </View>
    );
};

const RigesterScreen: React.FC<HomeScreenProps> = ({navigation}) => {
    const theme = useTheme();
    const {
        checkLogin,
        success,
        setSuccess,
        role,
        setMessage,
        addPhoneNumber,
        error,
        setError,
        successPN,
        setSuccessPN,
        verifyPhoneNumber,
        resendOTP,
    } = useGlobalStore();
    const [isVerify, setVerify] = useState(false);
    const [isName, setName] = useState(false);
    const [pn, setPN] = useState('');

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            checkSession();
        });
        return unsubscribe;
    }, [navigation]);

    const checkSession = async () => {
        const registerPhone: any = await AsyncStorage.getItem('register-phone');
        const verified: any = await AsyncStorage.getItem('verified');
        if (verified !== null) {
            setName(true);
        }
        if (registerPhone !== null) {
            setVerify(true);
            setPN(registerPhone);
            setPhoneNumber(registerPhone);
        }
    };

    useEffect(() => {
        if (error?.visible) {
            playSound(errorSound);
            shakeAnimation();
            if (phoneNumberInputRef.current) {
                phoneNumberInputRef.current.focus();
            }
        }
    }, [error]);

    useEffect(() => {
        if (successPN.visible) {
            playSound(successSound);
            // setMessage({
            //     visible: true,
            //     message: 'Phone number successfully stored!',
            //     type: '',
            // });
            setVerify(true);
            if (successPN.type === 'verify') {
                successOTPAction();
            }
            if (successPN.type === 'pn-register') {
                successPNAction();
            }

            if (successPN.type === 'register') {
                successRegisterAction();
            }

            setSuccessPN({visible: false, type: ''});
        }
    }, [successPN]);

    const successOTPAction = async () => {
        await AsyncStorage.setItem('verified', 'yes');
        setName(true);
        // navigation.navigate('PinPage')
    };

    const successRegisterAction = async () => {
        await AsyncStorage.removeItem('verified');
        await AsyncStorage.setItem('registered', 'yes');
        navigation.navigate('PinPage');
    };

    const successPNAction = async () => {
        await AsyncStorage.setItem('register-phone', String(phoneNumber));
    };

    const [phoneNumber, setPhoneNumber] = useState('+63');
    const [otp, setOtp] = useState('');
    const phoneNumberInputRef = useRef<TextInput>(null);

    const handlePhoneNumberChange = (maskedPhoneNumber: string) => {
        if (maskedPhoneNumber.trim() === '') {
            setPhoneNumber('+63');
        } else {
            setPhoneNumber(maskedPhoneNumber);
        }
    };

    useEffect(() => {
        // Focus on the phone number input field when the component mounts
        if (phoneNumberInputRef.current) {
            phoneNumberInputRef.current.focus();
        }
    }, []); // Empty dependency array to ensure this effect runs only once, when the component mounts

    async function getDeviceID() {
        try {
            const uniqueId = await getUniqueId();
            return uniqueId; // Return the uniqueId here
        } catch (error) {
            console.error('Error getting device ID:', error);
            return null; // Or return null on error (optional)
        }
    }

    const submitPhoneNumber = async () => {
        setError({visible: false, message: '', type: ''});
        const deviceId = await getDeviceID();
        addPhoneNumber({phoneNumber, deviceId});
    };

    const submitVerification = async () => {
        // navigation.navigate('Dashboard')
    };

    const shake = useSharedValue(0);

    const shakeAnimation = () => {
        shake.value = withSequence(
            withTiming(-10, {duration: 50}),
            withTiming(10, {duration: 50}),
            withTiming(-10, {duration: 50}),
            withTiming(10, {duration: 50}),
            withTiming(-10, {duration: 50}),
            withTiming(10, {duration: 50}),
            withTiming(-10, {duration: 50}),
            withTiming(10, {duration: 50}),
            withTiming(0, {duration: 50}),
        );
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{translateX: shake.value}],
        };
    });

    const verifyPN = async () => {
        setError({visible: false, message: '', type: ''});
        verifyPhoneNumber({phoneNumber, code: otp});
    };

    const resetSteps = async () => {
        await AsyncStorage.clear();
        navigation.navigate('MainScreen');
    };

    const resendOTPAction = async () => {
        setError({visible: false, message: '', type: ''});
        const deviceId = await getDeviceID();
        resendOTP({phoneNumber, deviceId});
    };

    return (
        <LinearGradient
            colors={['#ff1bb39c', '#5886ec']}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 0.9}}
            style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1}}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <IconButton
                        icon={({size, color}) => {
                            return (
                                <MaterialIcons
                                    color={'#fff'}
                                    size={30}
                                    name="arrow-back"
                                />
                            );
                        }}
                        iconColor={'#fff'}
                        size={20}
                        onPress={() => navigation.pop()}
                    />
                    <View style={styles.logoContainer}>
                        <Image
                            style={styles.logo}
                            source={require('../assets/images/logo.jpg')}
                        />
                    </View>

                    <Animated.View style={[animatedStyle]}>
                        {!isName && !isVerify && (
                            <View style={styles.itemContainer}>
                                <TextComponent
                                    style={{fontSize: 22, marginBottom: 16}}>
                                    Add Phone Number
                                </TextComponent>
                                <TextComponent
                                    style={{fontSize: 15, marginBottom: 16}}>
                                    Input a phone number you’d like to add to
                                    your account
                                </TextComponent>
                                <RowSeparator>
                                    <TextInput
                                        ref={phoneNumberInputRef}
                                        label="Mobile number"
                                        keyboardType="numeric"
                                        render={props => (
                                            <TextInputMask
                                                {...props}
                                                mask="+[00] [000] [000] [0000]"
                                                value={phoneNumber}
                                                onChangeText={
                                                    handlePhoneNumberChange
                                                }
                                            />
                                        )}
                                    />
                                    <HelperText
                                        style={{textAlign: 'center'}}
                                        type="error"
                                        visible={error?.visible}>
                                        {error?.message}
                                    </HelperText>
                                </RowSeparator>
                                <RowSeparator>
                                    <ButtonComponent
                                        label="Continue"
                                        onPress={submitPhoneNumber}
                                    />
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginTop: 10,
                                        }}>
                                        <Text>Already have an account?</Text>
                                        <TouchableRipple
                                            borderless={true}
                                            rippleColor="rgba(206,232,255,0.8)"
                                            centered={true}
                                            style={{
                                                padding: 2,
                                            }}
                                            onPress={() => {
                                                navigation.navigate('Login');
                                            }}>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    color: '#5886ec',
                                                    fontWeight: 'bold',
                                                }}>
                                                Sign In
                                            </Text>
                                        </TouchableRipple>
                                    </View>
                                </RowSeparator>
                            </View>
                        )}
                        {!isName && isVerify && (
                            <View style={styles.itemContainer}>
                                <TextComponent
                                    style={{fontSize: 22, marginBottom: 16}}>
                                    Verify Your Mobile Number
                                </TextComponent>
                                <TextComponent
                                    style={{fontSize: 15, marginBottom: 16}}>
                                    One Time Password (OTP) has been sent to
                                    your mobile number
                                </TextComponent>
                                <TextComponent>
                                    Mobile Number:{' '}
                                    <TextComponent
                                        style={{color: PRIMARY_COLOR}}
                                        variant="titleMedium">
                                        {pn}
                                    </TextComponent>{' '}
                                </TextComponent>
                                <RowSeparator>
                                    <OTPInput
                                        onChangeAction={(value: any) =>
                                            setOtp(value)
                                        }
                                    />
                                    <HelperText
                                        style={{textAlign: 'center'}}
                                        type="error"
                                        visible={error?.visible}>
                                        {error?.message}
                                    </HelperText>
                                </RowSeparator>
                                <RowSeparator>
                                    <ResendOTPButton
                                        resendOTPAction={() =>
                                            resendOTPAction()
                                        }
                                    />
                                </RowSeparator>
                                <RowSeparator>
                                    <ButtonComponent
                                        disabled={otp.length < 4 ? true : false}
                                        label="Verify"
                                        onPress={verifyPN}
                                    />
                                    <ButtonComponent
                                        mode="outlined"
                                        label="Reset Steps"
                                        onPress={resetSteps}
                                    />
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginTop: 10,
                                        }}>
                                        <Text>Already have an account?</Text>
                                        <TouchableRipple
                                            borderless={true}
                                            rippleColor="rgba(206,232,255,0.8)"
                                            centered={true}
                                            style={{
                                                padding: 2,
                                            }}
                                            onPress={() => {
                                                navigation.navigate('Login');
                                            }}>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    color: '#5886ec',
                                                    fontWeight: 'bold',
                                                }}>
                                                Sign In
                                            </Text>
                                        </TouchableRipple>
                                    </View>
                                </RowSeparator>
                            </View>
                        )}
                        {isName && (
                            <View style={styles.itemContainer}>
                                <TextComponent
                                    style={{fontSize: 22, marginBottom: 16}}>
                                    Almost Done
                                </TextComponent>
                                <TextComponent
                                    style={{fontSize: 15, marginBottom: 16}}>
                                    Fill in all required fields to continue.
                                </TextComponent>
                                <TextComponent>
                                    Mobile Number:{' '}
                                    <TextComponent
                                        style={{color: PRIMARY_COLOR}}
                                        variant="titleMedium">
                                        {pn}
                                    </TextComponent>{' '}
                                </TextComponent>
                                <NewCustomer />
                                <RowSeparator>
                                    <ButtonComponent
                                        mode="outlined"
                                        label="Reset Steps"
                                        onPress={resetSteps}
                                    />
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginTop: 10,
                                        }}>
                                        <Text>Already have an account?</Text>
                                        <TouchableRipple
                                            borderless={true}
                                            rippleColor="rgba(206,232,255,0.8)"
                                            centered={true}
                                            style={{
                                                padding: 2,
                                            }}
                                            onPress={() => {
                                                navigation.navigate('Login');
                                            }}>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    color: '#5886ec',
                                                    fontWeight: 'bold',
                                                }}>
                                                Sign In
                                            </Text>
                                        </TouchableRipple>
                                    </View>
                                </RowSeparator>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    itemContainer: {
        borderRadius: 10,
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 40,
    },
    logo: {
        width: 100,
        height: 100,
    },
    logoContainer: {
        alignItems: 'center',
    },
});
export default RigesterScreen;
