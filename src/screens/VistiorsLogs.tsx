import React, {useEffect, useState} from 'react';
import {StyleSheet, View, FlatList, Alert, Image} from 'react-native';
import {Appbar, IconButton} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {fetchVisitorLogsData} from '../utils/databaseService';
import {Swipeable} from 'react-native-gesture-handler';
import useGlobalStore from '../store/globalState';
import {
    BORDER_STYLE,
    BORDER_COLOR,
    PRIMARY_COLOR,
    SECONDARY_COLOR,
} from '../utils/constant';
import {
    MainContainer,
    RowSeparator,
    TextComponent,
    Separator,
    EmptyComponent,
} from '../components';
import {formatDate, playSound} from '../utils/helper';
import successSound from '../assets/audio/success.mp3';

interface Employee {
    id: string;
    firstname: string;
    lastname: string;
    employee_no: string;
}

const VistiorsLogs: React.FC<{navigation: any}> = () => {
    const navigation = useNavigation();
    const {success, setSuccess, saveLogs, deleteLogs} = useGlobalStore();
    const [list, setList] = useState([]);
    const fetchData = async () => {
        try {
            const employeelist = await fetchVisitorLogsData();
            setList(employeelist);
        } catch (error) {
            console.error('Error fetching empoyee:', error);
            // Handle error appropriately
        }
    };
    useEffect(() => {
        if (success?.visible && success.type === 'add-visitor') {
            playSound(successSound);
            fetchData();
            setTimeout(() => {
                setSuccess({visible: false, type: ''});
            }, 500);
        }
        if (success?.visible && success.type === 'push-logs') {
            playSound(successSound);
            fetchData();
            setTimeout(() => {
                setSuccess({visible: false, type: ''});
            }, 500);
        }
        if (success?.visible && success.type === 'delete-logs') {
            playSound(successSound);
            fetchData();
            setTimeout(() => {
                setSuccess({visible: false, type: ''});
            }, 500);
        }
    }, [success]);

    useEffect(() => {
        fetchData();
    }, []);

    const saveLogsAction = (item: any) => {
        saveLogs(item);
    };

    const renderRightActions = (item: any) => {
        return (
            <View
                style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                }}>
                <IconButton
                    icon="close"
                    iconColor={PRIMARY_COLOR}
                    size={30}
                    onPress={() => {
                        Alert.alert(
                            'Confirm Delete Logs',
                            'Are you sure you want to delete?',
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => {},
                                    style: 'cancel',
                                },
                                {
                                    text: 'Delete',
                                    onPress: () => {
                                        {
                                            deleteLogs({id: item?.id});
                                        }
                                    },
                                },
                            ],
                            {cancelable: false},
                        );
                    }}
                    mode="contained"
                />
                <IconButton
                    icon="file-upload"
                    iconColor={SECONDARY_COLOR}
                    size={30}
                    onPress={() => {
                        Alert.alert(
                            'Confirm Save to Live',
                            'Are you sure you want to save to live? After saving, the log will be deleted.',
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => {},
                                    style: 'cancel',
                                },
                                {
                                    text: 'Yes',
                                    onPress: () => {
                                        {
                                            saveLogsAction(item);
                                        }
                                    },
                                },
                            ],
                            {cancelable: false},
                        );
                    }}
                    mode="contained"
                />
            </View>
        );
    };

    return (
        <View style={{flex: 1}}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="Visitors Logs" />
                <Appbar.Action
                    icon="camera"
                    color={PRIMARY_COLOR}
                    onPress={() => {
                        navigation.navigate('CameraPage');
                    }}
                />
            </Appbar.Header>
            <MainContainer />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    image: {
        width: 40,
        height: 60,
        borderRadius: 10,
    },
});

export default VistiorsLogs;
