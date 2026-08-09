// @ts-nocheck
import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    StyleSheet,
    Image,
    StatusBar,
    TextInput,
    TouchableOpacity,
    Text,
    ScrollView,
} from 'react-native';
import useGlobalStore from '../store/globalState';
import {HomeScreenNavigationProp} from '../AppNavigator';
import {playSound} from '../utils/helper';
import errorSound from '../assets/audio/error.wav';
import successSound from '../assets/audio/success.mp3';
import {loginValidationSchema} from '../utils/validationHelper';
import {Formik, FormikProps} from 'formik';
import {VERSIONS, PRIMARY_COLOR} from '../utils/constant';

interface FormValues {
    location: string;
}

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

const LoginScreen: React.FC<HomeScreenProps> = ({navigation}) => {
    const formRef = useRef<FormikProps<FormValues>>(null);
    const {checkLogin, success, setSuccess, role, error} = useGlobalStore();

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (error?.visible) {
            playSound(errorSound);
        }
    }, [error]);

    useEffect(() => {
        if (success?.visible && success.type === 'login-success') {
            playSound(successSound);
            setSuccess(false);
            if (formRef.current) {
                formRef.current.resetForm();
                // Role-based landing:
                //  8 = Cashier   -> POS portal directly
                //  9 = Secretary -> portal chooser (Timekeeper + POS)
                // 10 = Owner     -> Owner report dashboard
                //  others        -> ProfilePage (site selection)
                const r = Number(role);
                const target =
                    r === 8
                        ? 'POSDashboard'
                        : r === 9
                        ? 'PortalScreen'
                        : r === 10
                        ? 'OwnerDashboard'
                        : 'ProfilePage';
                navigation.reset({
                    index: 0,
                    routes: [{name: target}],
                });
            }
            setSuccess({visible: false, type: ''});
        }
    }, [success]);

    const submitForm = (form_values: any) => {
        checkLogin(form_values);
    };

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={PRIMARY_COLOR}
            />

            {/* back button */}
            <TouchableOpacity
                onPress={() => navigation.pop()}
                style={styles.backBtn}>
                <Text style={styles.backText}>{'< Back'}</Text>
            </TouchableOpacity>

            {/* logo */}
            <View style={styles.header}>
                <View style={styles.logoWrapper}>
                    <Image
                        style={styles.logo}
                        source={require('../assets/images/logo.jpg')}
                    />
                </View>
            </View>

            {/* login box */}
            <View style={styles.box}>
                <Text style={styles.title}>Login To Continue</Text>

                <ScrollView keyboardShouldPersistTaps={'always'}>
                    <Formik
                        innerRef={formRef}
                        enableReinitialize={true}
                        validationSchema={loginValidationSchema}
                        initialValues={{username: '', password: ''}}
                        onSubmit={submitForm}>
                        {({
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            values,
                            errors,
                        }) => (
                            <View>
                                {/* username */}
                                <Text style={styles.label}>Username</Text>
                                <TextInput
                                    placeholder="Username"
                                    placeholderTextColor="#999999"
                                    value={values.username}
                                    onChangeText={handleChange('username')}
                                    onBlur={handleBlur('username')}
                                    style={styles.input}
                                />
                                {errors.username ? (
                                    <Text style={styles.errorText}>
                                        {errors.username}
                                    </Text>
                                ) : null}

                                {/* password */}
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordRow}>
                                    <TextInput
                                        placeholder="Password"
                                        placeholderTextColor="#999999"
                                        value={values.password}
                                        onChangeText={handleChange('password')}
                                        onBlur={handleBlur('password')}
                                        secureTextEntry={!showPassword}
                                        style={styles.passwordInput}
                                    />
                                    <TouchableOpacity
                                        onPress={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        style={styles.showBtn}>
                                        <Text style={styles.showText}>
                                            {showPassword ? 'Hide' : 'Show'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {errors.password ? (
                                    <Text style={styles.errorText}>
                                        {errors.password}
                                    </Text>
                                ) : null}

                                {/* submit */}
                                <TouchableOpacity
                                    style={styles.submitBtn}
                                    onPress={() => handleSubmit()}>
                                    <Text style={styles.submitText}>
                                        Submit
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Formik>
                </ScrollView>

                <Text style={styles.version}>{VERSIONS}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: PRIMARY_COLOR,
    },
    backBtn: {
        paddingVertical: 8,
    },
    backText: {
        color: '#ffffff',
        fontSize: 16,
    },
    header: {
        alignItems: 'center',
    },
    logoWrapper: {
        backgroundColor: '#ffffff',
        height: 120,
        width: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 70,
        height: 70,
    },
    box: {
        borderRadius: 10,
        backgroundColor: '#ffffff',
        padding: 20,
        marginTop: 40,
    },
    title: {
        fontSize: 22,
        marginBottom: 15,
        color: '#333333',
    },
    label: {
        fontSize: 14,
        color: '#555555',
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#ffffff',
        color: '#000000',
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 6,
        backgroundColor: '#ffffff',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: '#000000',
    },
    showBtn: {
        paddingHorizontal: 12,
    },
    showText: {
        color: PRIMARY_COLOR,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#cc0000',
        fontSize: 12,
        marginTop: 4,
    },
    submitBtn: {
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 6,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    submitText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    version: {
        textAlign: 'center',
        marginTop: 15,
        color: '#999999',
    },
});

export default LoginScreen;
