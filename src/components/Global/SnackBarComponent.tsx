import * as React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Snackbar, Portal} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useGlobalStore from '../../store/globalState';

const SnackBarComponent: React.FC = () => {
    const {setMessage, message} = useGlobalStore();
    return (
        <Portal>
            <Snackbar
                visible={message?.visible || false}
                onDismiss={() =>
                    setMessage({visible: false, message: '', type: 'text'})
                }
                action={{
                    label: ' Close ',
                    onPress: () => {
                        setMessage({visible: false, message: '', type: 'text'});
                    },
                }}
                style={[
                    styles.snackbar,
                    {
                        backgroundColor:
                            message?.type === 'error' ? '#f44336' : '#333',
                    },
                ]}>
                <View style={styles.snackbarContent}>
                    <Icon
                        name="information"
                        size={20}
                        color="white"
                        style={styles.icon}
                    />
                    <Text style={styles.snackbarText}>
                        {message?.message || ''}
                    </Text>
                </View>
            </Snackbar>
        </Portal>
    );
};

const styles = StyleSheet.create({
    snackbar: {
        backgroundColor: '#333',
        zIndex: 99999999999999,
        bottom: 70,
    },
    snackbarContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
    },
    snackbarText: {
        color: 'white',
    },
});

export default SnackBarComponent;
