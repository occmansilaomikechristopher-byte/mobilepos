import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {TextInput as Input, DefaultTheme} from 'react-native-paper';

import {ERROR_COLOR} from '../../utils/constant';

interface TextInputProps {
    placeholder?: string;
    style?: object;
    multiline?: boolean;
    numberOfLines?: number;
    returnKeyType?: any;
    value?: any;
    error?: boolean;
    errorText?: any;
    description?: any;
    onChangeText?: (data: any) => void;
    onBlur?: (data: any) => void;
    secureTextEntry?: boolean;
    onFocus?: (data: any) => void;
    keyboardType?: string;
    mode?: any;
}

const TextInputComponent: React.FC<TextInputProps> = ({
    placeholder,
    style,
    errorText,
    description,
    mode,
    ...props
}) => {
    return (
        <View style={styles.container}>
            <Input
                {...props}
                label={placeholder}
                placeholder={placeholder}
                mode={mode || 'outlined'}
                style={[{marginVertical: 8, width: '100%'}, style]}
            />
            {description && !errorText ? (
                <Text style={styles.description}>{description}</Text>
            ) : null}
            {errorText ? (
                <Text style={{color: ERROR_COLOR}}>{errorText}</Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 0,
    },

    description: {
        fontSize: 13,
        paddingTop: 8,
    },
    error: {
        fontSize: 13,
        color: ERROR_COLOR,
        paddingTop: 8,
    },
});
export default TextInputComponent;
