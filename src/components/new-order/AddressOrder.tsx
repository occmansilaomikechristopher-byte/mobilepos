import React from 'react';
import {View, StyleSheet} from 'react-native';
import {TextComponent} from '../../components/';
import {Avatar, Button, Card, Text, Tooltip} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme, IconButton} from 'react-native-paper';
import useOrderStore from '../../store/orderState';
import {RIPPLE_COLOR, SECONDARY_COLOR} from '../../utils/constant';

interface ButtonProps {
    address: any;
}
const LeftContent = (props: any) => (
    <Avatar.Icon color="#fff" {...props} icon="map" />
);

const AddressOrder: React.FC<ButtonProps> = ({address}) => {
    const theme = useTheme();
    const {activeAddress, setAddressList} = useOrderStore();

    return (
        <View style={[styles.container, {borderColor: theme?.colors?.primary}]}>
            <View>
                <MaterialIcons color={SECONDARY_COLOR} name="map" size={30} />
            </View>
            <View style={styles.centerContent}>
                <Text numberOfLines={3}>
                    {activeAddress?.address || 'No Address Yet'}
                </Text>
            </View>
            <View style={styles.leftAction}>
                <IconButton
                    icon="chevron-right"
                    size={30}
                    onPress={() => setAddressList(true)}
                    rippleColor={RIPPLE_COLOR}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 5,
        borderStyle: 'dotted',
        borderWidth: 3,
        borderRadius: 7,
        borderColor: '#5886ec',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    leftAction: {
        width: 50,
    },
    centerContent: {
        flex: 1,
        marginLeft: 5,
    },
});

export default AddressOrder;
