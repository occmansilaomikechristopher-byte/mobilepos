import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {PRIMARY_COLOR} from '../../utils/constant';

const EmptyComponent: React.FC = () => {
    const windowWidth = Dimensions.get('window').width;

    return (
        <View style={[styles.container, {width: windowWidth - 40}]}>
            <View style={styles.icon}>
                <MaterialIcons
                    name="insert-drive-file"
                    size={40}
                    color={'#fff'}
                />
            </View>
            <Text style={styles.text}>Not Data Found!</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 7,
    },
    text: {
        fontSize: 20,
        marginTop: 10,
    },
    icon: {
        backgroundColor: PRIMARY_COLOR,
        padding: 10,
        borderRadius: 40,
    },
});

export default React.memo(EmptyComponent);
