import React from 'react';
import {View, Text, Button} from 'react-native';
import {useTheme} from 'react-native-paper';
import {HomeScreenNavigationProp} from '../AppNavigator';

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
    const theme = useTheme();

    const handleNavigateToDetails = () => {
        navigation.navigate('Details', {itemId: 123});
    };

    const textColor = getTextColor(theme.dark);

    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
                width: '100%',
            }}
        />
    );
};

export default HomeScreen;
