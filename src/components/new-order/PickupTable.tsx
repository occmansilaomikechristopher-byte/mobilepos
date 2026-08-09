import * as React from 'react';
import {View, StyleSheet} from 'react-native';
import {DataTable} from 'react-native-paper';
import {formatCurrency, formatDate} from '../../utils/helper';
import {TextComponent} from '../../components';

export interface Props {
    datas?: any;
}

interface DataType {
    key?: number;
    id?: number;
    date_start?: any;
    driver?: any;
    date_done?: any;
    date_created?: any;
    status?: any;
    failed_reason?: any;
}

const PickupTable: React.FC<Props> = ({datas}) => {
    const [page, setPage] = React.useState<number>(0);
    const [numberOfItemsPerPageList] = React.useState([2, 3, 4]);
    const [itemsPerPage, setItemsPerPage] = React.useState(
        numberOfItemsPerPageList[0],
    );

    // const [items] = React.useState([
    //     {
    //         key: 1,
    //         name: 'Cupcake',
    //         calories: 356,
    //         fat: 16,
    //         status: 'Visited'
    //     },
    // ]);

    let data: DataType[] = [];
    if (Array.isArray(datas)) {
        for (let index = 0; index < datas.length; index++) {
            data.push({
                key: index,
                driver: datas[index].driver_name,
                date_created: `${formatDate(datas[index].date_created)}`,
                date_start: `${formatDate(datas[index].pickup_date)}`,
                date_done: `${formatDate(datas[index].date_done)}`,
                status: `${datas[index].schedule_status}`,
                failed_reason: `${datas[index].failed_reason}`,
            });
        }
    }

    const generateStatus = (status: any) => {
        let color = '#2196f3';
        if (status === 'done') {
            color = '#8bc34a';
        }

        if (status === 'failed') {
            color = '#F44336';
        }

        return (
            <>
                <TextComponent
                    variant="titleSmall"
                    style={{textTransform: 'uppercase', color: color}}>
                    {status === 'done' ? 'Visited' : status}
                </TextComponent>
            </>
        );
    };

    return (
        <View style={styles.container}>
            {data.map(item => (
                <View style={styles.content}>
                    <View style={styles.contentWrapper}>
                        <View style={styles.title}>
                            <TextComponent>Driver: </TextComponent>
                        </View>
                        <View>
                            <TextComponent
                                variant="titleSmall"
                                numberOfLines={1}>
                                {item.driver}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.contentWrapper}>
                        <View style={styles.title}>
                            <TextComponent>Date Ongoing: </TextComponent>
                        </View>
                        <View>
                            <TextComponent variant="titleSmall">
                                {item.date_created}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.contentWrapper}>
                        <View style={styles.title}>
                            <TextComponent>Date Visited: </TextComponent>
                        </View>
                        <View>
                            <TextComponent variant="titleSmall">
                                {item.date_done}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.contentWrapper}>
                        <View style={styles.title}>
                            <TextComponent>Status: </TextComponent>
                        </View>
                        <View>{generateStatus(item.status)}</View>
                    </View>
                    {item.status === 'failed' && (
                        <View style={styles.contentWrapper}>
                            <View style={styles.title}>
                                <TextComponent>Reasons: </TextComponent>
                            </View>
                            <View>
                                <TextComponent variant="titleSmall">
                                    {item.failed_reason}
                                </TextComponent>
                            </View>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    content: {
        padding: 10,
        width: '100%',
        borderColor: '#5886ec',
        borderWidth: 2,
        borderRadius: 7,
        marginTop: 5,
        borderStyle: 'dotted',
        backgroundColor: '#fff',
    },
    contentWrapper: {
        flexDirection: 'row',
    },
    title: {
        width: 100,
    },
});

export default PickupTable;
