import React, {useRef} from 'react';
import {View, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import {Formik} from 'formik';
import {TextInputComponent, ButtonComponent} from '..';
import {registerValidationSchema} from '../../utils/validationHelper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGlobalStore from '../../store/globalState';

const NewCustomer = () => {
    const formRef = useRef(null);
    const {registerCustomer} = useGlobalStore();

    const actionSubmit = async (params: any) => {
        try {
            const phone = await AsyncStorage.getItem('register-phone');
            params.mobile_no = phone;
            await registerCustomer(params);
        } catch (error: any) {
            console.error('❌ NewCustomer actionSubmit Error:', error);
        }
    };

    return (
        <KeyboardAwareScrollView
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}>
            <Formik
                innerRef={formRef}
                enableReinitialize={true}
                validationSchema={registerValidationSchema}
                initialValues={{
                    name: '',
                    mpin: '',
                    mpinConfirmation: '',
                }}
                onSubmit={values => {
                    actionSubmit(values); // Do something with form values
                }}>
                {({handleChange, handleBlur, handleSubmit, values, errors}) => (
                    <>
                        <TextInputComponent
                            returnKeyType={'next'}
                            placeholder="Full Name"
                            value={values.name}
                            error={errors.name ? true : false}
                            errorText={errors.name}
                            onChangeText={handleChange('name')}
                            onBlur={handleBlur('name')}
                        />
                        <TextInputComponent
                            returnKeyType={'next'}
                            placeholder="MPIN"
                            value={values.mpin}
                            error={errors.mpin ? true : false}
                            errorText={errors.mpin}
                            onChangeText={handleChange('mpin')}
                            onBlur={handleBlur('mpin')}
                            secureTextEntry={false}
                            keyboardType="numeric"
                        />
                        <TextInputComponent
                            returnKeyType={'next'}
                            placeholder="Verify MPIN"
                            value={values.mpinConfirmation}
                            error={errors.mpinConfirmation ? true : false}
                            errorText={errors.mpinConfirmation}
                            onChangeText={handleChange('mpinConfirmation')}
                            onBlur={handleBlur('mpinConfirmation')}
                            secureTextEntry={false}
                            keyboardType="numeric"
                        />
                        <ButtonComponent
                            label="Submit"
                            onPress={handleSubmit}
                        />
                    </>
                )}
            </Formik>
        </KeyboardAwareScrollView>
    );
};

export default NewCustomer;
