import React from 'react';
import {Button} from 'react-native-paper';

interface ButtonProps {
    label: string;
    onPress: () => void;
    style?: object; // Additional style props
    mode?: any;
    disabled?: boolean;
    loading?: boolean;
}

const ButtonComponent: React.FC<ButtonProps> = ({
    label,
    onPress,
    style,
    mode,
    ...props
}) => {
    return (
        <Button
            {...props}
            mode={mode || 'contained'}
            onPress={onPress}
            style={[{marginVertical: 8}, style]}>
            {' '}
            {label}{' '}
        </Button>
    );
};

export default ButtonComponent;
