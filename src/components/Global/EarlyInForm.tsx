import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Counter from 'react-native-counters';
import {
    Provider as PaperProvider,
    Modal,
    Portal,
    Button,
} from 'react-native-paper';
import {formatDate} from '../../utils/helper';
import TextInputComponent from './TextInputComponent';

interface Props {
    visible: any;
    close: () => void;
    saveOt: (value: number) => void;
}

const EarlyInForm: React.FC<Props> = ({visible, close, saveOt}) => {
    const [values, setValues] = useState<string>('');
    const [errors, setErrors] = useState<string>('');

    // Get max hours with fallback
    const maxHours = parseFloat(visible?.earlyInHours) || 0;

    const validateHours = (input: string): boolean => {
        // Check if input is empty
        if (!input.trim()) {
            setErrors('Enter valid hours');
            return false;
        }

        // Check if input is a valid number
        const hours = parseFloat(input);
        if (isNaN(hours)) {
            setErrors('Please enter a valid number');
            return false;
        }

        // Check if hours is positive
        if (hours < 0) {
            setErrors('Hours cannot be negative');
            return false;
        }

        // Check if hours exceeds maximum
        if (hours > maxHours) {
            setErrors(
                `Hours should be less than or equal to ${maxHours.toFixed(2)}`,
            );
            return false;
        }

        // Check for reasonable upper limit (optional safety check)
        if (hours > 24) {
            setErrors('Hours cannot exceed 24');
            return false;
        }

        setErrors('');
        return true;
    };

    const handleChange = (text: string) => {
        setValues(text);

        // Only validate if there's input
        if (text.trim()) {
            validateHours(text);
        } else {
            setErrors(''); // Clear errors when empty
        }
    };

    const submitDATA = () => {
        if (!validateHours(values)) {
            return; // Don't submit if validation fails
        }

        const hours = parseFloat(values);
        saveOt(hours);
        setValues('');
        close(); // Consider closing modal after submit
    };

    const handleModalDismiss = () => {
        setValues('');
        setErrors('');
        close();
    };

    return (
        <Portal>
            <Modal
                visible={!!visible?.visible}
                onDismiss={handleModalDismiss}
                contentContainerStyle={styles.modalContainer}>
                <Text style={styles.title}>
                    {visible?.details?.lastname}, {visible?.details?.firstname}{' '}
                    {visible?.details?.middlename}.
                </Text>
                <Text>{formatDate(visible?.details?.date_time)}</Text>

                <Text style={styles.label}>EI Hours</Text>
                <TextInputComponent
                    returnKeyType={'done'}
                    placeholder={`Enter Hours (max: ${maxHours.toFixed(2)})`}
                    keyboardType={'numeric'}
                    value={values}
                    error={!!errors}
                    errorText={errors}
                    onChangeText={handleChange}
                    onSubmitEditing={submitDATA} // Allow submit with keyboard
                />

                <Button
                    mode="contained"
                    onPress={submitDATA}
                    style={styles.submitButton}
                    disabled={!!errors || !values.trim()} // Disable if errors or empty
                >
                    Submit
                </Button>
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
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    submitButton: {
        marginTop: 20,
        width: '100%',
    },
});

export default EarlyInForm;
