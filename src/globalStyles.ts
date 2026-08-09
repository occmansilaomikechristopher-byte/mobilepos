import {StyleSheet, Dimensions} from 'react-native';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export const globalStyles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        height: windowHeight,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
    },
});
