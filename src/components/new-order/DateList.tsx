import React from 'react';
import {View, FlatList} from 'react-native';
import {Text, TouchableRipple} from 'react-native-paper';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import {TextComponent, Separator} from '../../components/';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Props {
    numberOfDays: number;
    action: (date: any) => void;
    selected: any;
}

const DateList: React.FC<Props> = ({numberOfDays, action, selected}) => {
    // Array to store the dates
    const dates: {
        date: string;
        dayAbbreviation: string;
        dayOnly: String;
        monthOnly: String;
    }[] = [];

    // Get today's date
    const today = dayjs().add(1, 'day');

    // Loop through the next numberOfDays days and add them to the array
    for (let i = 0; i < numberOfDays; i++) {
        const currentDate = today.add(i, 'day');
        const date = currentDate.format('YYYY-MM-DD');
        const dayAbbreviation = currentDate.format('ddd');
        const dayOnly = currentDate.format('D');
        const monthOnly = currentDate.format('MMM');
        dates.push({date, dayAbbreviation, dayOnly, monthOnly});
    }

    return (
        <View style={{height: 100}}>
            <FlatList
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                data={dates}
                renderItem={({item}) => (
                    <TouchableRipple
                        borderless={true}
                        rippleColor="rgba(206,232,255,0.8)"
                        centered={true}
                        style={{
                            width: 60,
                            height: 100,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: '#5886ec',
                            padding: 3,
                        }}
                        onPress={() => action(item?.date)}>
                        <LinearGradient
                            style={{
                                width: 50,
                                height: 90,
                                borderRadius: 20,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            colors={[
                                '#5886ec',
                                selected === item?.date
                                    ? '#ff1bb39c'
                                    : '#5886ec',
                            ]}
                            start={{x: 0, y: 0}}
                            end={{x: 0, y: 0.9}}>
                            {selected === item?.date && (
                                <MaterialIcons
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        marginTop: 0,
                                    }}
                                    name="calendar-month"
                                    size={15}
                                    color="white"
                                />
                            )}
                            <TextComponent
                                style={{color: '#fff'}}
                                variant="labelSmall">
                                {item.monthOnly}{' '}
                            </TextComponent>
                            <TextComponent
                                style={{color: '#fff'}}
                                variant="headlineSmall">
                                {item.dayOnly}{' '}
                            </TextComponent>
                            <TextComponent
                                style={{color: '#fff'}}
                                variant="labelSmall"
                                key={item.date}>
                                {item.dayAbbreviation}
                            </TextComponent>
                        </LinearGradient>
                    </TouchableRipple>
                )}
                keyExtractor={(item, index) => index.toString()}
                ItemSeparatorComponent={() => <Separator />}
            />
        </View>
    );
};

export default React.memo(DateList);
