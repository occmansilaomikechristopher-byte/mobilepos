import React from 'react';
import {View, Text, Dimensions} from 'react-native';
import Timeline from 'react-native-timeline-flatlist';
import {Card} from 'react-native-paper';
import {formatDate, generateLog} from '../../utils/helper';
import {PRIMARY_COLOR, SECONDARY_COLOR} from '../../utils/constant';

var height = Dimensions.get('window').height;

// Define the interface for the timeline data
interface TimelineEvent {
    time: string;
    title: string;
    description: string;
}

export interface Props {
    datas?: any[];
}

const TimelineComponent: React.FC<Props> = ({datas}) => {
    let data: TimelineEvent[] = [];
    if (Array.isArray(datas)) {
        for (let index = 0; index < datas.length; index++) {
            data.push({
                time: formatDate(datas[index].created_at),
                title: '',
                description: generateLog(datas[index].type),
            });
        }
    }

    const renderDetail = (
        rowData: any,
        sectionID: string | number,
        rowID: string | number,
    ) => {
        console.log({rowData});
        const {description} = rowData;
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 7,
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                }}>
                <Text style={{}}>{description}</Text>
            </View>
        );
    };

    return (
        <View style={{padding: 20, height: height}}>
            <Timeline
                data={data}
                circleSize={12}
                lineWidth={1}
                circleColor={SECONDARY_COLOR}
                lineColor="#ff1bb345"
                timeStyle={{
                    textAlign: 'center',
                    backgroundColor: PRIMARY_COLOR,
                    color: 'white',
                    padding: 5,
                    borderRadius: 13,
                }}
                options={{
                    style: {
                        paddingTop: 10,
                        marginBottom: 100,
                        paddingLeft: 10,
                        paddingRight: 10,
                    },
                    removeClippedSubviews: false,
                }}
                renderDetail={renderDetail}
            />
        </View>
    );
};

export default React.memo(TimelineComponent);
