import React, {useState, useRef, useEffect, useCallback} from 'react';
import {View, StyleSheet} from 'react-native';
import dayjs from 'dayjs';
import {TextComponent} from '../../components/';
import {formatCurrency} from '../../utils/helper';
import {List} from 'react-native-paper';

interface StateValues {
    order_no?: any;
    date?: any;
    time?: any;
    contact?: any;
    rider?: any;
    driver_mobile_no?: any;
    total?: number;
    order_type?: any;
    address?: any;
    landmark?: any;
    customer_name?: any;
    addons_amount?: any;
    addons?: any;
    isFull?: boolean;
    others?: any;
    type?: any;
}

const OrderDetails: React.FC<StateValues> = ({
    order_no,
    date,
    time,
    contact,
    rider,
    driver_mobile_no,
    total,
    order_type,
    address,
    landmark,
    customer_name,
    addons_amount,
    addons,
    isFull = false,
    others,
    type,
}) => {
    const timeGenerate = (time: any) => {
        return time === 'morning'
            ? 'Morning(8am - 12pm)'
            : 'Afternoon(1pm - 5pm)';
    };

    let parsedAddons = [];

    try {
        parsedAddons = JSON.parse(addons);
    } catch (error) {}

    return (
        <>
            {order_no && (
                <View style={styles.orderDetailsText}>
                    <View style={styles.content1}>
                        <TextComponent>Order ID</TextComponent>
                    </View>
                    <View style={styles.content2}>
                        <TextComponent variant="titleMedium" numberOfLines={1}>
                            {order_no}
                        </TextComponent>
                    </View>
                </View>
            )}
            {type && (
                <View style={styles.orderDetailsText}>
                    <View style={styles.content1}>
                        <TextComponent>Type</TextComponent>
                    </View>
                    <View style={styles.content2}>
                        <TextComponent
                            variant="titleMedium"
                            numberOfLines={1}
                            style={{textTransform: 'uppercase'}}>
                            {type}
                        </TextComponent>
                    </View>
                </View>
            )}

            {customer_name && (
                <View style={styles.orderDetailsText}>
                    <View style={styles.content1}>
                        <TextComponent>Customer</TextComponent>
                    </View>
                    <View style={styles.content2}>
                        <TextComponent
                            numberOfLines={1}
                            variant="titleMedium"
                            style={{textTransform: 'uppercase'}}>
                            {customer_name}
                        </TextComponent>
                    </View>
                </View>
            )}
            {order_type && (
                <View style={styles.orderDetailsText}>
                    <View style={styles.content1}>
                        <TextComponent>Type</TextComponent>
                    </View>
                    <View style={styles.content2}>
                        <TextComponent
                            numberOfLines={1}
                            variant="titleMedium"
                            style={{textTransform: 'uppercase'}}>
                            {order_type}
                        </TextComponent>
                    </View>
                </View>
            )}

            {date && (
                <View style={styles.orderDetailsText}>
                    <View style={styles.content1}>
                        <TextComponent>Pick-up Date</TextComponent>
                    </View>
                    <View style={styles.content2}>
                        <TextComponent variant="titleSmall">
                            {dayjs(date).format('MMM D, YYYY')}
                        </TextComponent>
                    </View>
                </View>
            )}
            {time && (
                <View style={styles.orderDetailsText}>
                    <View style={styles.content1}>
                        <TextComponent>Pick-up Time</TextComponent>
                    </View>
                    <View style={styles.content2}>
                        <TextComponent variant="titleSmall" numberOfLines={1}>
                            {timeGenerate(time)}
                        </TextComponent>
                    </View>
                </View>
            )}
            {rider && (
                <View style={styles.orderDetailsText}>
                    <View style={styles.content1}>
                        <TextComponent>Rider</TextComponent>
                    </View>
                    <View style={styles.content2}>
                        <TextComponent variant="titleSmall" numberOfLines={1}>
                            {rider}
                        </TextComponent>
                    </View>
                </View>
            )}
            {driver_mobile_no && (
                <View style={styles.orderDetailsText}>
                    <View style={styles.content1}>
                        <TextComponent>Contact</TextComponent>
                    </View>
                    <View style={styles.content2}>
                        <TextComponent variant="titleSmall" numberOfLines={1}>
                            {driver_mobile_no}
                        </TextComponent>
                    </View>
                </View>
            )}
            {isFull && (
                <>
                    <View style={styles.contentFull}>
                        <TextComponent variant="titleSmall">
                            Address
                        </TextComponent>
                        <TextComponent>
                            Full Address: {others?.address?.address}
                        </TextComponent>
                        <TextComponent>
                            Landmark: {others?.address?.landmark}
                        </TextComponent>
                        <TextComponent>
                            Person: {others?.address?.person}
                        </TextComponent>
                        <TextComponent>
                            Contact No.: {others?.address?.contact}
                        </TextComponent>
                    </View>
                    <View style={styles.orderDetailsText}>
                        <View style={styles.content1}>
                            <TextComponent>Clothes Weight</TextComponent>
                        </View>
                        <View style={styles.content2}>
                            <TextComponent
                                variant="titleSmall"
                                numberOfLines={1}>
                                {others?.weight}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.orderDetailsText}>
                        <View style={styles.content1}>
                            <TextComponent>Clothes Price</TextComponent>
                        </View>
                        <View style={styles.content2}>
                            <TextComponent
                                variant="titleSmall"
                                numberOfLines={1}>
                                {formatCurrency(others?.price || 0)}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.orderDetailsText}>
                        <View style={styles.content1}>
                            <TextComponent>Clothes Amount</TextComponent>
                        </View>
                        <View style={styles.content2}>
                            <TextComponent
                                variant="titleSmall"
                                numberOfLines={1}>
                                {formatCurrency(others?.price * others?.weight)}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.orderDetailsText}>
                        <View style={styles.content1}>
                            <TextComponent>Linens Weight</TextComponent>
                        </View>
                        <View style={styles.content2}>
                            <TextComponent
                                variant="titleSmall"
                                numberOfLines={1}>
                                {others?.linens_weight}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.orderDetailsText}>
                        <View style={styles.content1}>
                            <TextComponent>Linens Price</TextComponent>
                        </View>
                        <View style={styles.content2}>
                            <TextComponent
                                variant="titleSmall"
                                numberOfLines={1}>
                                {formatCurrency(others?.linens_price || 0)}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.orderDetailsText}>
                        <View style={styles.content1}>
                            <TextComponent>Linens Amount</TextComponent>
                        </View>
                        <View style={styles.content2}>
                            <TextComponent
                                variant="titleSmall"
                                numberOfLines={1}>
                                {formatCurrency(
                                    others?.linens_price *
                                        others?.linens_weight,
                                )}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.orderDetailsText}>
                        <View style={styles.content1}>
                            <TextComponent>Transport Price</TextComponent>
                        </View>
                        <View style={styles.content2}>
                            <TextComponent
                                variant="titleSmall"
                                numberOfLines={1}>
                                {formatCurrency(others?.transport_price || 0)}
                            </TextComponent>
                        </View>
                    </View>
                    <View style={styles.orderDetailsText}>
                        <View style={styles.content1}>
                            <TextComponent>Addons</TextComponent>
                        </View>
                        <View style={styles.content2}>
                            <TextComponent
                                variant="titleSmall"
                                numberOfLines={1}>
                                {formatCurrency(addons_amount || 0)}
                            </TextComponent>
                        </View>
                    </View>
                    {addons_amount !== 0 && (
                        <View style={styles.contentFull}>
                            <TextComponent variant="titleSmall">
                                Addons Details:{' '}
                            </TextComponent>
                            {parsedAddons.map((item: any, index: number) => (
                                <TextComponent key={index}>
                                    {item?.add_ons}:{' '}
                                    {formatCurrency(item?.value || 0)}
                                </TextComponent>
                            ))}
                        </View>
                    )}
                </>
            )}
            <View style={styles.orderDetailsText}>
                <View style={styles.content1}>
                    <TextComponent>Total</TextComponent>
                </View>
                <View style={styles.content2}>
                    <TextComponent variant="titleSmall" numberOfLines={1}>
                        {formatCurrency(total || 0)}
                    </TextComponent>
                </View>
            </View>
            {/* {address && landmark && (
                <List.AccordionGroup>
                    <View style={{width: '100%'}}>
                        <List.Accordion title="More" id="1">
                            <List.Item
                                titleNumberOfLines={3}
                                title={`Address: ${address}`}
                            />
                            <List.Item
                                titleNumberOfLines={3}
                                title={`Landmark: ${landmark}`}
                            />
                        </List.Accordion>
                    </View>
                </List.AccordionGroup>
            )} */}
        </>
    );
};

const styles = StyleSheet.create({
    orderDetails: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderDetailsText: {
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        width: '100%',
        borderColor: '#5886ec',
        borderWidth: 2,
        borderRadius: 7,
        marginTop: 5,
        borderStyle: 'dotted',
    },
    contentFull: {
        padding: 5,
        backgroundColor: '#fff',
        width: '100%',
        borderColor: '#5886ec',
        borderWidth: 2,
        borderRadius: 7,
        marginTop: 5,
        borderStyle: 'dotted',
    },
    content1: {
        width: 110,
        padding: 5,
        backgroundColor: '#fff',
    },
    content2: {
        flex: 1,
        backgroundColor: '#5886ec1f',
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
});

export default OrderDetails;
