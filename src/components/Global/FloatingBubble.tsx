// FloatingBubble.js

import React, {useRef, useEffect, useState} from 'react';
import {
    View,
    Animated,
    PanResponder,
    StyleSheet,
    TouchableOpacity,
    Text,
    FlatList,
} from 'react-native';
import {Badge, IconButton} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {PRIMARY_COLOR, SECONDARY_COLOR} from '../../utils/constant';
import useGlobalStore from '../../store/globalState';
import useOrderStore from '../../store/orderState';
import {TapGestureHandler, Swipeable} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigationState} from '@react-navigation/native';

interface Notification {
    title: any;
    message: any;
    isRead: any;
    type: any;
    details: any;
    nid: number;
    id: number;
}

const FloatingBubble: React.FC = () => {
    const onClose = () => {};
    const pan = useRef(new Animated.ValueXY()).current;
    const [show, setShow] = useState(false);
    const [userType, setUserType] = useState<string | null>(null);
    const {
        notifications,
        clearNotifications,
        removeNotification,
        setNotifDetails,
        setMessage,
    } = useGlobalStore();
    const {markRead, setOrderDetails, orderDetails} = useOrderStore();

    const getUserType = async (): Promise<string | null> => {
        try {
            const userType = await AsyncStorage.getItem('userType');
            return userType;
        } catch (error) {
            console.error('Error getting userType from AsyncStorage:', error);
            return null;
        }
    };

    useEffect(() => {
        const fetchUserType = async () => {
            const type = await getUserType();
            setUserType(type);
        };

        fetchUserType();
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value,
                });
            },
            onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: () => {
                pan.flattenOffset();
            },
        }),
    ).current;

    // Animation value for the bell icon
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Bounce animation effect
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, [scaleAnim]);

    const viewNotification = (item: any) => {
        setOrderDetails(item?.details);
        removeNotification(item.id);
        setNotifDetails(item.id);
    };

    const renderRightActions = (item: any) => {
        return (
            <View
                style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                }}>
                {userType === 'customer' && (
                    <IconButton
                        icon="eye"
                        iconColor={PRIMARY_COLOR}
                        size={30}
                        onPress={() => viewNotification(item)}
                        mode="contained"
                    />
                )}
                <IconButton
                    icon="close"
                    iconColor={SECONDARY_COLOR}
                    size={30}
                    onPress={() => removeNotification(item.id)}
                    mode="contained"
                />
            </View>
        );
    };

    const renderItem = ({item}: {item: Notification}) => (
        <TouchableOpacity
            onPress={() =>
                setMessage({
                    visible: true,
                    message: 'Slide left to see options',
                    type: '',
                })
            }>
            <Swipeable
                renderRightActions={(progress, dragX) =>
                    renderRightActions(item)
                }>
                <View style={styles.notificationItem}>
                    <View style={styles.notificationIcon}>
                        <MaterialIcons
                            name="notifications"
                            size={30}
                            color={'#fff'}
                        />
                    </View>
                    <View style={styles.notificationDetail}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.message}>{item.message}</Text>
                    </View>
                </View>
            </Swipeable>
        </TouchableOpacity>
    );

    if (notifications.length === 0) {
        return <></>;
    }

    if (show) {
        // if(orderDetails){
        //     return <></>;
        // }
        return (
            <View style={styles.notificationDetails}>
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        );
    }

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.bubble,
                {
                    transform: pan.getTranslateTransform(),
                },
            ]}>
            <TouchableOpacity
                onPress={() => {
                    setShow(false);
                    clearNotifications();
                }}
                style={styles.closeButton}>
                <MaterialIcons name="close" size={13} color={'#fff'} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => setShow(true)}
                style={styles.innerBubble}>
                <Badge
                    style={{position: 'absolute', top: 11, left: 10, zIndex: 2}}
                    size={15}>
                    {notifications.length}
                </Badge>
                <Animated.View style={{transform: [{scale: scaleAnim}]}}>
                    <MaterialIcons
                        name="notifications"
                        size={30}
                        color={PRIMARY_COLOR}
                    />
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    bubble: {
        position: 'absolute',
        bottom: 0,
        right: 20,
        top: '50%',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
    },
    innerBubble: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: 'white',
        fontSize: 12,
    },
    notificationDetails: {
        position: 'absolute',
        top: 0,
        // bottom: 0,
        left: 10,
        right: 10,
        // backgroundColor:'rgba(0, 0, 0, 0.3)',
        zIndex: 1,
        // height: 400,
    },
    notificationItem: {
        backgroundColor: '#fffffff0',
        padding: 10,
        marginVertical: 8,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    message: {
        fontSize: 16,
        marginTop: 5,
    },
    details: {
        fontSize: 12,
        marginTop: 5,
        color: '#777',
    },
    listContainer: {
        paddingBottom: 10,
    },
    rightAction: {
        backgroundColor: SECONDARY_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        width: 75,
        borderRadius: 5,
        marginVertical: 8,
    },
    rightActionView: {
        backgroundColor: PRIMARY_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        width: 75,
        borderRadius: 5,
        marginVertical: 8,
        marginLeft: 10,
    },
    actionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    notificationIcon: {
        backgroundColor: PRIMARY_COLOR,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 7,
    },
    notificationDetail: {
        marginLeft: 7,
    },
});

export default FloatingBubble;
