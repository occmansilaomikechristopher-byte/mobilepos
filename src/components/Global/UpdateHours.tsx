// @ts-nocheck
import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Modal, Portal, Button} from 'react-native-paper';
import {PRIMARY_COLOR} from '../../utils/constant';
import {formatDate} from '../../utils/helper';
import TextInputComponent from './TextInputComponent';

interface Props {
    visible: any;
    close: () => void;
    saveOt: (value: number) => void;
}

const UpdateHours: React.FC<Props> = ({visible, close, saveOt}) => {
    const [values, setValues] = useState('');
    const [errors, setErrors] = useState('');

    const handleChange = (text: string) => {
        // Remove any non-numeric characters except dot
        const cleanText = text.replace(/[^0-9.]/g, '');
        setValues(cleanText);

        const hours = parseFloat(cleanText);

        // Validation
        if (!cleanText || isNaN(hours) || hours <= 0) {
            setErrors('Enter valid hours');
            return;
        }

        // if (hours > 8) {
        //     setErrors('Hours should not exceed 8');
        //     return;
        // }

        // ✅ Clear error if valid
        setErrors('');
    };

    const setHalfDay = () => {
        setValues('4.5625');
        setErrors('');
    };

    const setFullDay = () => {
        setValues('8');
        setErrors('');
    };

    const submitDATA = () => {
        const hours = parseFloat(values);

        if (!values || isNaN(hours) || hours <= 0) {
            setErrors('Enter valid hours');
            return;
        }

        // if (hours > 8) {
        //     setErrors('Hours should not exceed 8');
        //     return;
        // }

        saveOt(hours);
        setValues('');
        setErrors('');
    };

    const handleClose = () => {
        setValues('');
        setErrors('');
        close();
    };

    return (
        <Portal>
            <Modal
                visible={visible.visible ? true : false}
                onDismiss={handleClose}
                contentContainerStyle={styles.modalContainer}>
                <Text style={styles.title}>
                    {visible?.details?.lastname}, {visible?.details?.firstname}{' '}
                    {visible?.details?.middlename}.
                </Text>
                <Text style={styles.date}>
                    {formatDate(visible?.details?.date_time)}
                </Text>

                <Text style={styles.label}>
                    Enter Hours ({visible?.details?.hours})
                </Text>

                {/* Quick Action Buttons */}
                <View style={styles.quickActions}>
                    <Button
                        mode="outlined"
                        onPress={setHalfDay}
                        style={styles.halfDayButton}
                        labelStyle={styles.halfDayButtonText}>
                        Half Day (4.56)
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={setFullDay}
                        style={styles.fullDayButton}>
                        Full (8)
                    </Button>
                </View>

                <TextInputComponent
                    returnKeyType={'done'}
                    placeholder={'Enter Hours (8 hours max)'}
                    keyboardType={'numeric'}
                    value={values?.toString() || ''}
                    errorText={errors}
                    onChangeText={handleChange}
                    style={styles.input}
                />

                <View style={styles.buttonContainer}>
                    <Button
                        mode="outlined"
                        onPress={handleClose}
                        style={[styles.button, styles.cancelButton]}>
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        onPress={submitDATA}
                        style={styles.button}
                        disabled={
                            !!errors || !values || parseFloat(values) <= 0
                        }>
                        Submit
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 10,
    },
    label: {
        fontSize: 18,
        marginBottom: 10,
        marginTop: 10,
        textAlign: 'center',
        fontWeight: '500',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    date: {
        textAlign: 'center',
        marginBottom: 15,
        color: '#666',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 10,
    },
    halfDayButton: {
        flex: 1,
        borderColor: '#ffa726',
    },
    halfDayButtonText: {
        color: '#ffa726',
        fontSize: 12,
    },
    fullDayButton: {
        flex: 1,
        borderColor: PRIMARY_COLOR,
    },
    input: {
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        gap: 10,
    },
    button: {
        flex: 1,
    },
    cancelButton: {
        borderColor: PRIMARY_COLOR,
    },
});

export default UpdateHours;
