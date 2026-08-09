import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, TouchableRipple} from 'react-native-paper';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import {TextComponent, Separator} from '../../components/';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {RIPPLE_COLOR, PRIMARY_COLOR} from '../../utils/constant';
import {
    formatCurrency,
    formatDistance,
    formatDuration,
    formatDate,
} from '../../utils/helper';

interface Props {
    item: any;
    showAction: (data: any) => void;
}

const RouteCard: React.FC<Props> = ({item, showAction}) => {
    const {
        date,
        schedule_time,
        driver_mobile_no,
        driver_name,
        no_stop,
        route_id,
        status,
        type,
        distance_value,
        duration_value,
    } = item;

    let typeText = '';
    if (type === 'dropoff-pickup') {
        typeText = 'Drop off and Pick up';
    }

    return (
        <TouchableRipple
            onPress={() => showAction(item)}
            rippleColor={RIPPLE_COLOR}
            centered={true}
            style={styles.container}>
            <>
                <TextComponent>Date & Time: {formatDate(date)}</TextComponent>
                <TextComponent>Stop: {no_stop}</TextComponent>
                <TextComponent>
                    Status:{' '}
                    <TextComponent style={{textTransform: 'uppercase'}}>
                        {status}
                    </TextComponent>
                </TextComponent>
                <TextComponent>Type: {typeText}</TextComponent>
                <TextComponent>
                    Distance: {formatDistance(distance_value)}
                </TextComponent>
                <TextComponent>
                    Duration: {formatDuration(duration_value)}
                </TextComponent>
            </>
        </TouchableRipple>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderStyle: 'solid',
        borderWidth: 3,
        borderRadius: 10,
        borderColor: PRIMARY_COLOR,
        backgroundColor: '#fff',
    },
});

export default React.memo(RouteCard);
