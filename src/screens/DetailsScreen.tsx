import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from 'react-native-paper';
import {DetailsScreenRouteProp} from '../AppNavigator';
import {TextComponent} from '../components/Global/TextComponent';
const DetailsScreen: React.FC<{route: DetailsScreenRouteProp}> = ({route}) => {
    const theme = useTheme();
    const {itemId} = route.params;
    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
                width: '100%',
            }}>
            <TextComponent style={{fontSize: 24, marginBottom: 16}}>
                Details Screen
            </TextComponent>
            <TextComponent>Item ID: {itemId}</TextComponent>
        </View>
    );
};

export default DetailsScreen;
