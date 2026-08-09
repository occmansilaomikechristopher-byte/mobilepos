import React, {useEffect} from 'react';
import {BackHandler, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const CloseBlocker: React.FC = React.memo(() => {
    const navigation = useNavigation();

    useEffect(() => {
        const backAction = () => {
            Alert.alert(
                'Hold on!',
                'Are you sure you want to go back? This app will close.',
                [
                    {
                        text: 'Cancel',
                        onPress: () => navigation.navigate('MainScreen'),
                        style: 'cancel',
                    },
                    {text: 'YES', onPress: () => BackHandler.exitApp()},
                ],
            );
            return true; // Returning true prevents the default back action
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, [navigation]);

    return null;
});

export default CloseBlocker;
