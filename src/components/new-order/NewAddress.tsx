import React, {useRef, useEffect, useState} from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import {
    Modal,
    Portal,
    TouchableRipple,
    List,
    Appbar,
    Switch,
} from 'react-native-paper';
import {
    ButtonComponent,
    RowSeparator,
    TextComponent,
    TextInputComponent,
} from '../../components/';
import useOrderStore from '../../store/orderState';
import {globalStyles} from '../../globalStyles';
import {newAddressValidationSchema} from '../../utils/validationHelper';
import {Formik, FormikProps, useFormikContext} from 'formik';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TIME_MODAL} from '../../utils/constant';

interface FormValues {
    location: string;
}

interface StateValues {
    location: string;
    address: string;
    landmark: string;
    contact: string;
    person: string;
}

const TIME = Platform.OS === 'ios' ? TIME_MODAL : 0;

const NewAddress: React.FC = () => {
    const {
        newAddress,
        setNewAddress,
        setSearchAdd,
        currentAddress,
        saveAddress,
        successAddress,
        setSuccessAddress,
    } = useOrderStore();
    const formRef = useRef<FormikProps<FormValues>>(null);
    const [location, setLocation] = useState('test');
    const [state, setState] = useState<StateValues>({
        location: '',
        address: '',
        landmark: '',
        contact: '',
        person: '',
    });

    useEffect(() => {
        const checkConditions = async () => {
            setState(prevState => ({
                ...prevState,
                location: `Latitude: ${currentAddress?.lat} Longitude: ${currentAddress?.lng}`,
            }));
        };
        if (currentAddress) {
            checkConditions();
        }
    }, [currentAddress]);

    useEffect(() => {
        if (successAddress) {
            setState({
                location: '',
                address: '',
                landmark: '',
                contact: '',
                person: '',
            });
            setIsSwitchOn(false);
        }
    }, [successAddress]);

    const renderItem = ({item}: {item: any}) => (
        <TouchableRipple
            onPress={() => console.log(item.id)}
            rippleColor="rgba(0, 0, 0, .32)">
            <List.Item
                title={item.id}
                description={item.place_name}
                left={props => <List.Icon {...props} icon="map" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
            />
        </TouchableRipple>
    );

    const submitForm = async (form_values: any) => {
        form_values.lat = currentAddress?.lat;
        form_values.lng = currentAddress?.lng;
        form_values.default = isSwitchOn;
        saveAddress(form_values);
    };

    const locationChange = async () => {
        if (formRef.current) {
            const allValues: any = formRef.current.values;
            const newData = {
                address: allValues?.address || '',
                contact: allValues?.contact || '',
                landmark: allValues?.landmark || '',
                location: allValues?.location || '',
                person: allValues?.person || '',
            };
            setState(newData);
        }
        setNewAddress(false);
        await new Promise(resolve => setTimeout(resolve, TIME));
        setSearchAdd(true);
    };

    const [isSwitchOn, setIsSwitchOn] = React.useState(false);

    const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

    return (
        <>
            <Portal>
                <Modal
                    visible={newAddress}
                    dismissable={false}
                    contentContainerStyle={globalStyles.modalContainer}>
                    <View style={globalStyles.modalHeader}>
                        <Appbar.Action
                            icon="close"
                            onPress={() => setNewAddress(false)}
                        />
                        <Appbar.Content title="New Address" />
                    </View>
                    <View style={globalStyles.modalContent}>
                        <KeyboardAwareScrollView
                            keyboardShouldPersistTaps={'always'}
                            showsVerticalScrollIndicator={false}>
                            <Formik
                                innerRef={formRef}
                                enableReinitialize={true}
                                validationSchema={newAddressValidationSchema}
                                initialValues={{
                                    address: state.address,
                                    landmark: state.landmark,
                                    contact: state.contact,
                                    person: state.person,
                                    location: state.location,
                                }}
                                onSubmit={submitForm}>
                                {({
                                    handleChange,
                                    handleBlur,
                                    handleSubmit,
                                    values,
                                    errors,
                                    isValid,
                                }) => (
                                    <>
                                        <TextInputComponent
                                            multiline={true}
                                            numberOfLines={4}
                                            returnKeyType={'next'}
                                            placeholder="Full Address"
                                            value={values.address}
                                            error={
                                                errors.address ? true : false
                                            }
                                            errorText={errors.address}
                                            onChangeText={handleChange(
                                                'address',
                                            )}
                                            onBlur={handleBlur('address')}
                                        />
                                        <TextInputComponent
                                            multiline={true}
                                            numberOfLines={4}
                                            returnKeyType={'next'}
                                            placeholder="Landmark"
                                            value={values.landmark}
                                            error={
                                                errors.landmark ? true : false
                                            }
                                            errorText={errors.landmark}
                                            onChangeText={handleChange(
                                                'landmark',
                                            )}
                                            onBlur={handleBlur('landmark')}
                                        />
                                        <TextInputComponent
                                            returnKeyType={'next'}
                                            placeholder="Contact Number"
                                            value={values.contact}
                                            error={
                                                errors.contact ? true : false
                                            }
                                            errorText={errors.contact}
                                            onChangeText={handleChange(
                                                'contact',
                                            )}
                                            onBlur={handleBlur('contact')}
                                        />
                                        <TextInputComponent
                                            returnKeyType={'next'}
                                            placeholder="Contact person"
                                            value={values.person}
                                            error={errors.person ? true : false}
                                            errorText={errors.person}
                                            onChangeText={handleChange(
                                                'person',
                                            )}
                                            onBlur={handleBlur('person')}
                                        />
                                        <TouchableOpacity
                                            onPress={() => {
                                                locationChange();
                                            }}>
                                            <TextInputComponent
                                                multiline={true}
                                                numberOfLines={4}
                                                editable={false}
                                                selectTextOnFocus={false}
                                                placeholder="Location"
                                                value={values.location}
                                                error={
                                                    errors.location
                                                        ? true
                                                        : false
                                                }
                                                errorText={errors.location}
                                                onChangeText={handleChange(
                                                    'location',
                                                )}
                                                onBlur={handleBlur('location')}
                                            />
                                        </TouchableOpacity>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginBottom: 20,
                                                justifyContent: 'space-between',
                                            }}>
                                            <TextComponent>
                                                Default Address
                                            </TextComponent>
                                            <Switch
                                                value={isSwitchOn}
                                                onValueChange={onToggleSwitch}
                                            />
                                        </View>
                                        <ButtonComponent
                                            label="Submit"
                                            onPress={handleSubmit}
                                        />
                                    </>
                                )}
                            </Formik>
                        </KeyboardAwareScrollView>
                    </View>
                </Modal>
            </Portal>
        </>
    );
};

const styles = StyleSheet.create({});

export default NewAddress;
