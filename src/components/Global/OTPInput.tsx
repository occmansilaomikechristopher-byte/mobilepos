// @ts-nocheck
import React, {useState, useRef} from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Text,
    Alert,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
} from 'react-native';
import {SECONDARY_COLOR} from '../../utils/constant';

interface Props {
    onChangeAction: (data: any) => void;
}

const OTPInput: React.FC = ({onChangeAction}) => {
    const [otp, setOtp] = useState<string[]>(['', '', '', '']);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const handleChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        const otpData: any = newOtp.join('');
        onChangeAction(otpData);
        setOtp(newOtp);
        if (text && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // if (newOtp.every(digit => digit !== '')) {
        //     submitOtp(newOtp.join(''));
        // }
    };

    const handleKeyPress = (
        e: NativeSyntheticEvent<TextInputKeyPressEventData>,
        index: number,
    ) => {
        if (
            e.nativeEvent.key === 'Backspace' &&
            index > 0 &&
            otp[index] === ''
        ) {
            inputRefs.current[index - 1]?.focus();
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
    };

    // const submitOtp = (otp: string) => {
    //     // Handle OTP submission logic here
    //     Alert.alert('OTP Submitted', `Your OTP is ${otp}`);
    // };

    return (
        <View style={styles.container}>
            <View style={styles.otpContainer}>
                {otp.map((value, index) => (
                    <TextInput
                        key={index}
                        style={styles.input}
                        value={value}
                        onChangeText={text => handleChange(text, index)}
                        onKeyPress={e => handleKeyPress(e, index)}
                        maxLength={1}
                        keyboardType="numeric"
                        returnKeyType="next"
                        autoFocus={index === 0}
                        ref={ref => (inputRefs.current[index] = ref)}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    input: {
        width: 50,
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: SECONDARY_COLOR,
        textAlign: 'center',
        fontSize: 20,
        margin: 5,
    },
});
export default OTPInput;
