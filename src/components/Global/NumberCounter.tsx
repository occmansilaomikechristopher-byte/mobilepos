import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Counter from 'react-native-counters';
import {
    Provider as PaperProvider,
    Modal,
    Portal,
    Button,
} from 'react-native-paper';
import {
    BORDER_STYLE,
    BORDER_COLOR,
    PRIMARY_COLOR,
    SECONDARY_COLOR,
} from '../../utils/constant';
import {formatDate} from '../../utils/helper';
import TextInputComponent from './TextInputComponent';

interface Props {
    visible: any;
    close: () => void;
    saveOt: (value: number) => void;
}

const NumberCounter: React.FC<Props> = ({visible, close, saveOt}) => {
    // const [visibles, setVisible] = useState(false);
    // const [value, setValue] = useState(1);

    // const showModal = () => setVisible(true);
    // const hideModal = () => setVisible(false);

    // const handleChange = (number: number, type: string) => {
    //     setValue(number)
    // };

    const [values, setValues] = useState(0);
    const [errors, setErrors] = useState('');

    const handleChange = (text: any) => {
        setValues(text);
        if (!text) {
            setErrors('Enter valid hours');
            return;
        }
        let hours = parseFloat(visible?.details?.hours);
        if (text > hours) {
            setErrors('Hours should less than ' + hours);
            return;
        }
        setErrors('');
    };

    const submitDATA = () => {
        if (!values || parseFloat(values) < 0) {
            setErrors('Enter valid hours');
            return;
        }
        let hours = parseFloat(visible?.details?.hours) - 8;
        if (parseFloat(values) > hours) {
            setErrors('Hours should less than ' + hours.toFixed(2));
            return;
        }
        saveOt(values);
        setValues(0);
    };

    return (
        <Portal>
            <Modal
                visible={visible.visible ? true : false}
                onDismiss={close}
                contentContainerStyle={styles.modalContainer}>
                <Text style={styles.title}>
                    {visible?.details?.lastname}, {visible?.details?.firstname}{' '}
                    {visible?.details?.middlename}.
                </Text>
                <Text>{formatDate(visible?.details?.date_time)}</Text>
                <Text style={styles.label}>OT Hours</Text>
                {/* <Counter
                    start={1}
                    min={0}
                    max={16}
                    onChange={handleChange}
                    buttonStyle={{
                        borderColor: SECONDARY_COLOR,
                        borderWidth: 2,
                        borderRadius: 5,
                    }}
                    buttonTextStyle={{
                        color: SECONDARY_COLOR,
                        fontSize: 20,
                    }}
                    countTextStyle={{
                        color: BORDER_COLOR,
                        fontSize: 20,
                    }}
                /> */}
                <TextInputComponent
                    returnKeyType={'Done'}
                    placeholder={`Enter Hours(${(
                        visible?.details?.hours - 8
                    ).toFixed(2)} max)`}
                    keyboardType={'numeric'}
                    value={values}
                    error={errors ? true : false}
                    errorText={errors}
                    onChangeText={handleChange}
                />
                <Button
                    mode="contained"
                    onPress={() => submitDATA()}
                    style={styles.closeButton}>
                    Submit
                </Button>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    closeButton: {
        marginTop: 20,
    },
});

export default NumberCounter;
