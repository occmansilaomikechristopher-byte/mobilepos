import React from 'react';
import {View, FlatList} from 'react-native';
import {Text, TouchableRipple} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import {TextComponent, Separator} from '../../components/';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {RIPPLE_COLOR} from '../../utils/constant';

interface TimeSlot {
    id: number;
    time: string;
}

const generateTimeSlots = (): TimeSlot[] => {
    const timeSlots: TimeSlot[] = [];
    const startDate = new Date();
    startDate.setHours(8, 0, 0, 0); // Set to 8 AM
    const endDate = new Date();
    endDate.setHours(28, 30, 0, 0); // Set to 4:30 AM of the next day

    let currentTime = startDate;
    let id = 0;

    while (currentTime <= endDate) {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();

        const isAfternoon = hours >= 12;
        const hour12 = hours % 12 || 12; // Convert to 12-hour clock

        const time = `${hour12.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')} ${isAfternoon ? 'PM' : 'AM'}`;
        timeSlots.push({id, time});

        id++;
        currentTime = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes
    }

    return timeSlots;
};

interface Props {
    action: (date: any) => void;
    selected: any;
}

const TimeSlotList: React.FC<Props> = ({action, selected}) => {
    const timeSlots = generateTimeSlots();

    return (
        <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={timeSlots}
            renderItem={({item}) => (
                <TouchableRipple
                    borderless={true}
                    rippleColor={RIPPLE_COLOR}
                    centered={true}
                    style={{
                        width: 80,
                        height: 60,
                        borderRadius: 20,
                        borderWidth: 2,
                        borderColor: '#5886ec',
                        padding: 3,
                    }}
                    onPress={() => action(item?.time)}>
                    <LinearGradient
                        style={{
                            width: 70,
                            height: 50,
                            borderRadius: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        colors={[
                            '#5886ec',
                            selected === item?.time ? '#ff1bb39c' : '#5886ec',
                        ]}
                        start={{x: 0, y: 0}}
                        end={{x: 0, y: 0.9}}>
                        {selected === item?.time && (
                            <MaterialIcons
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    marginTop: 0,
                                }}
                                name="access-time"
                                size={15}
                                color="white"
                            />
                        )}
                        <TextComponent
                            style={{color: '#fff'}}
                            variant="bodySmall">
                            {item.time}{' '}
                        </TextComponent>
                    </LinearGradient>
                </TouchableRipple>
            )}
            keyExtractor={(item, index) => index.toString()}
            ItemSeparatorComponent={() => <Separator />}
        />
    );
};

export default React.memo(TimeSlotList);
