import React, {useEffect} from 'react';
import {View, FlatList, StyleSheet, Dimensions} from 'react-native';
import {
    Text,
    Modal,
    Portal,
    TouchableRipple,
    useTheme,
    Appbar,
    IconButton,
} from 'react-native-paper';
import useOrderStore from '../../store/orderState';
import useAddress from '../../hooks/useAddress';
import {globalStyles} from '../../globalStyles';
import {useQueryClient} from 'react-query';
import useGlobalStore from '../../store/globalState';
import {
    RIPPLE_COLOR,
    SECONDARY_COLOR,
    PRIMARY_COLOR,
} from '../../utils/constant';
import {Separator, EmptyComponent, ButtonComponent} from '../../components/';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const AddressList: React.FC = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const {data, isFetching} = useAddress();
    const {setMessage} = useGlobalStore();
    const {
        addressList,
        setAddressList,
        setNewAddress,
        currentAddress,
        successAddress,
        setSuccessAddress,
        setActiveAddress,
    } = useOrderStore();
    useEffect(() => {
        if (successAddress) {
            setNewAddress(false);
            setTimeout(() => {
                setAddressList(true);
            }, 500);
            setMessage({
                visible: true,
                message: 'New Address Successfully Saved!',
                type: '',
            });
            queryClient.invalidateQueries('address');
            setSuccessAddress(false);
        }
    }, [successAddress]);

    const renderItem = ({item}: {item: any}) => (
        <TouchableRipple
            onPress={() => {
                setActiveAddress(item);
                setAddressList(false);
            }}
            style={[styles.container, {borderColor: theme?.colors?.primary}]}
            rippleColor={RIPPLE_COLOR}>
            <>
                {item?.default === 'yes' && (
                    <View style={styles.default}>
                        <Text style={styles.defaultText}>Default</Text>
                    </View>
                )}
                <View>
                    <MaterialIcons
                        color={SECONDARY_COLOR}
                        name="map"
                        size={30}
                    />
                </View>
                <View style={styles.centerContent}>
                    <Text variant="labelLarge" numberOfLines={1}>
                        {item?.landmark || ''}
                    </Text>
                    <Text numberOfLines={1}>{item?.address || ''}</Text>

                    <Text variant="labelLarge" numberOfLines={1}>
                        {item?.person}({item?.contact || ''})
                    </Text>
                </View>
            </>
        </TouchableRipple>
    );

    return (
        <>
            <Portal>
                <Modal
                    visible={addressList}
                    dismissable={false}
                    contentContainerStyle={globalStyles.modalContainer}>
                    <View style={globalStyles.modalHeader}>
                        <Appbar.Action
                            icon="close"
                            onPress={() => setAddressList(false)}
                            rippleColor={RIPPLE_COLOR}
                        />
                        <Appbar.Content title="Address Selection" />
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: '#fff',
                        }}>
                        <FlatList
                            data={data?.address || []}
                            renderItem={renderItem}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            ItemSeparatorComponent={() => <Separator />}
                            ListEmptyComponent={
                                <View>
                                    <EmptyComponent />
                                </View>
                            }
                            contentContainerStyle={{marginHorizontal: 15}}
                        />
                        <ButtonComponent
                            label="Add New Address"
                            mode="outlined"
                            onPress={() => {
                                setAddressList(false);
                                setTimeout(() => {
                                    setNewAddress(true);
                                }, 500);
                            }}
                        />
                    </View>
                </Modal>
            </Portal>
        </>
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
        paddingTop: 18,
        paddingBottom: 18,
    },
    leftAction: {
        width: 50,
    },
    centerContent: {
        flex: 1,
        marginLeft: 5,
    },
    default: {
        position: 'absolute',
        right: 2,
        top: 2,
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 2,
        paddingHorizontal: 7,
        borderRadius: 4,
    },
    defaultText: {
        fontSize: 12,
        color: '#fff',
    },
});

export default AddressList;
