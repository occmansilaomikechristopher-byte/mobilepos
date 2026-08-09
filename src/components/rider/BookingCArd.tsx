import React, {useEffect} from 'react';
import {
    View,
    StyleSheet,
    Platform,
    ScrollView,
    Alert,
    Linking,
} from 'react-native';
import {TouchableRipple, Badge, Chip} from 'react-native-paper';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import {TextComponent, OrderDetails, ButtonComponent} from '../../components/';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
    RIPPLE_COLOR,
    PRIMARY_COLOR,
    FAILED_COLOR,
    SUCCESS_COLOR,
} from '../../utils/constant';
import useLocation from '../../hooks/useLocation';
import {FAILED_OPTIONS} from '../../utils/constant';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import useOrderStore from '../../store/orderState';

interface Props {
    item: any;
    showAction: (data: any) => void;
    ongoinAction: (data: any) => void;
    failedDeliveryAction: (data: any) => void;
    index: number;
    close: () => void;
}

const BookingCArd: React.FC<Props> = ({
    item,
    index,
    showAction,
    ongoinAction,
    close,
    failedDeliveryAction,
}) => {
    const {
        date,
        schedule_time,
        driver_mobile_no,
        driver_name,
        no_stop,
        route_id,
        status,
        type,
        order_no,
        pickup_date,
        total,
        address,
        landmark,
        lat,
        lng,
        customer_name,
        order_id,
    } = item?.data;
    const {successFailed, setSuccessFailed} = useOrderStore();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const {location, error, getLocation} = useLocation();

    const [failed, setFailed] = React.useState(false);
    const [failedSelected, setFailedSelected] = React.useState(null);

    useEffect(() => {
        if (successFailed) {
            setFailed(false);
            setFailedSelected(null);
            setSuccessFailed(false);
        }
    }, [successFailed]);

    const setOngoing = () => {
        showAction({data: item?.data, location});
    };

    const openMap = () => {
        const platformURL =
            Platform.OS === 'ios'
                ? `http://maps.apple.com/?daddr=${lng},${lat}`
                : `http://maps.google.com/?daddr=${lng},${lat}`;
        Linking.openURL(platformURL);
    };

    const navigateToChatPage = () => {
        close();
        if (order_no && order_id) {
            navigation.navigate('ChatPage', {order_no, order_id});
        }
    };

    const setFailedDelivery = () => {
        failedDeliveryAction({data: item?.data, failedSelected});
    };

    let borderColor = PRIMARY_COLOR;
    let backgroundColor = '#fff';
    if (status === 'failed') {
        borderColor = FAILED_COLOR;
        backgroundColor = '#f443360d';
    }

    if (status === 'ongoing') {
        backgroundColor = '#2196f30f';
    }

    if (status === 'done') {
        borderColor = SUCCESS_COLOR;
        backgroundColor = '#8bc34a0d';
    }

    return (
        <View
            style={[
                styles.container,
                {borderColor: borderColor, backgroundColor: backgroundColor},
            ]}>
            <View>
                <Badge>{index + 1}</Badge>
            </View>
            {failed && (
                <>
                    <View style={{flexWrap: 'wrap'}}>
                        <TextComponent variant="labelLarge">
                            Failed Delivery Reasons
                        </TextComponent>
                        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                            {FAILED_OPTIONS.map((item: any, i) => {
                                return (
                                    <Chip
                                        key={i}
                                        icon={`${
                                            failedSelected === item.title
                                                ? 'check'
                                                : 'information'
                                        }`}
                                        onPress={() =>
                                            setFailedSelected(item.title)
                                        }
                                        style={{margin: 4}}>
                                        <TextComponent numberOfLines={1}>
                                            {item.title}
                                        </TextComponent>
                                    </Chip>
                                );
                            })}
                        </View>
                    </View>
                    <View style={{flexDirection: 'row', gap: 10}}>
                        <ButtonComponent
                            label="Cancel"
                            mode={'outlined'}
                            onPress={() => {
                                {
                                    setFailedSelected(null);
                                    setFailed(false);
                                }
                            }}
                        />
                        <ButtonComponent
                            label="Submit"
                            onPress={() => {
                                Alert.alert(
                                    'Confirm Failed Delivery',
                                    'Are you sure you want to mark this delivery as failed?',
                                    [
                                        {
                                            text: 'Cancel',
                                            onPress: () => {},
                                            style: 'cancel',
                                        },
                                        {
                                            text: 'Yes',
                                            onPress: () => {
                                                setFailedDelivery();
                                            },
                                        },
                                    ],
                                    {cancelable: false},
                                );
                            }}
                        />
                    </View>
                </>
            )}
            {!failed && (
                <>
                    <OrderDetails
                        order_no={order_no}
                        date={date}
                        time={schedule_time}
                        order_type={type}
                        driver_mobile_no={driver_mobile_no}
                        total={total}
                        address={address}
                        landmark={landmark}
                        customer_name={customer_name}
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}>
                        {status === 'pending' && (
                            <ButtonComponent
                                mode="text"
                                label="Set as Ongoing"
                                onPress={() => {
                                    {
                                        Alert.alert(
                                            'Confirm Ongoing',
                                            'Are you sure you want to update this booking? Please confirm if you wish to proceed.',
                                            [
                                                {
                                                    text: 'Cancel',
                                                    onPress: () =>
                                                        console.log(
                                                            'Cancel Pressed',
                                                        ),
                                                    style: 'cancel',
                                                },
                                                {
                                                    text: 'Yes',
                                                    onPress: () => {
                                                        setOngoing();
                                                    },
                                                },
                                            ],
                                            {cancelable: false},
                                        );
                                    }
                                }}
                                style={{width: 140}}
                            />
                        )}
                        {status === 'ongoing' && (
                            <>
                                <ButtonComponent
                                    mode="text"
                                    label="Set as Visited"
                                    onPress={() => {
                                        {
                                            Alert.alert(
                                                'Confirm Visited',
                                                'Are you sure you want to update this booking?',
                                                [
                                                    {
                                                        text: 'Cancel',
                                                        onPress: () =>
                                                            console.log(
                                                                'Cancel Pressed',
                                                            ),
                                                        style: 'cancel',
                                                    },
                                                    {
                                                        text: 'Yes',
                                                        onPress: () => {
                                                            ongoinAction({
                                                                data: item?.data,
                                                                type: 'done',
                                                            });
                                                        },
                                                    },
                                                ],
                                                {cancelable: false},
                                            );
                                        }
                                    }}
                                />
                            </>
                        )}
                        {status !== 'failed' && (
                            <ButtonComponent
                                mode="text"
                                label="Failed Delivery"
                                onPress={() => {
                                    setFailed(true);
                                }}
                                style={{width: 140}}
                            />
                        )}
                        <ButtonComponent
                            mode="text"
                            label="Open Map Navigation"
                            onPress={() => openMap()}
                            style={{width: 180}}
                        />
                        <ButtonComponent
                            mode="text"
                            label="Message"
                            onPress={() => navigateToChatPage()}
                            style={{width: 120}}
                        />
                        <ButtonComponent
                            mode="text"
                            label="Call"
                            onPress={() =>
                                Linking.openURL(`tel:${'09355663729'}`)
                            }
                            style={{width: 100}}
                        />
                    </ScrollView>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderStyle: 'solid',
        borderWidth: 3,
        borderRadius: 10,
        alignItems: 'center',
    },
});

export default React.memo(BookingCArd);
