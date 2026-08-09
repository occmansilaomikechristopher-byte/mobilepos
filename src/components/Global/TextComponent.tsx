import React from 'react';
import {useTheme, Text as RNText} from 'react-native-paper';

import {ERROR_COLOR} from '../../utils/constant';

interface TextProps {
    children: React.ReactNode;
    style?: object;
    variant?: any;
    error?: boolean;
    numberOfLines?: number;
    onPress?: () => void;
    selectable?: boolean;
    allowFontScaling?: boolean;
    testID?: string;
}

const TextComponent: React.FC<TextProps> = ({
    children,
    style,
    error,
    variant,
    numberOfLines,
    onPress,
    selectable,
    allowFontScaling,
    testID,
}) => {
    const theme = useTheme();
    const textColor = theme.dark ? 'white' : 'black';

    return (
        <RNText
            variant={variant}
            numberOfLines={numberOfLines}
            onPress={onPress}
            selectable={selectable}
            allowFontScaling={allowFontScaling}
            testID={testID}
            style={[{color: error ? ERROR_COLOR : textColor}, style]}>
            {children}
        </RNText>
    );
};

export default TextComponent;
