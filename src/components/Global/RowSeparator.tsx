import React from 'react';
import {View} from 'react-native';

interface Props {
    children: React.ReactNode;
    style?: any; // or specific type for style if needed
}

const RowSeparator: React.FC<Props> = ({style, children}) => {
    return <View style={[style, {paddingVertical: 7}]}>{children}</View>;
};

export default React.memo(RowSeparator);
