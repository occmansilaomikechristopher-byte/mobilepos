import React, {useEffect, useRef} from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    PanResponder,
    Animated,
    Dimensions,
} from 'react-native';
import EmployeeListScreen2 from './EmployeeListScreen2';
import CartEmployeeScreen from './CartEmployeeScreen';
import useGlobalStore from '../store/globalState';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';

const {height} = Dimensions.get('window');

const NAVY_DARK = '#0F172A';
const BRAND_RED = '#219688';

// CartHeader Component
const CartHeader: React.FC = () => {
    const navigation = useNavigation();
    const {cartItems, success, setSuccess, clearCart} = useGlobalStore();

    useEffect(() => {
        if (success?.visible && success.type === 'save-myemployee') {
            clearCart();
            navigation.goBack();
            setTimeout(() => {
                setSuccess({visible: false, type: ''});
            }, 500);
        }
    }, [success]);

    const count = cartItems.length;
    const isEmpty = count === 0;

    return (
        <View style={styles.headerContainer}>
            {/* Grab handle */}
            <View style={styles.grabBar} />

            <View style={styles.cartHeaderRow}>
                <View style={styles.headerLeft}>
                    <View
                        style={[
                            styles.iconBox,
                            {backgroundColor: `${BRAND_RED}12`},
                        ]}>
                        <MaterialIcons
                            name="person-add-alt-1"
                            color={BRAND_RED}
                            size={20}
                        />
                    </View>
                    <View>
                        <Text style={styles.headerText}>Employees Added</Text>
                        <Text style={styles.headerSub}>
                            {isEmpty
                                ? 'Drag up to add employees'
                                : 'Drag to review your selection'}
                        </Text>
                    </View>
                </View>

                <View
                    style={[
                        styles.countPill,
                        isEmpty && styles.countPillEmpty,
                    ]}>
                    <MaterialIcons
                        name="groups"
                        size={13}
                        color={isEmpty ? '#94A3B8' : '#fff'}
                    />
                    <Text
                        style={[
                            styles.countPillText,
                            isEmpty && styles.countPillTextEmpty,
                        ]}>
                        {count}
                    </Text>
                </View>
            </View>
        </View>
    );
};

// Main Component
const ScreenDragger: React.FC<{navigation: any}> = ({navigation}) => {
    const panY = useRef(new Animated.Value(0)).current;
    const drawerHeight = useRef(new Animated.Value(height * 0.1)).current;

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
            const newHeight = height - gestureState.moveY;
            if (newHeight > height * 0.1 && newHeight < height * 0.9) {
                drawerHeight.setValue(newHeight);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            const currentHeight = height - gestureState.moveY;
            let toValue;

            if (currentHeight > height * 0.5) {
                toValue = height * 0.9; // Open to 90% of screen
            } else if (currentHeight > height * 0.2) {
                toValue = height * 0.3; // Middle position
            } else {
                toValue = height * 0.1; // Minimized
            }

            Animated.spring(drawerHeight, {
                toValue,
                useNativeDriver: false,
            }).start();
        },
    });

    return (
        <View style={styles.screenContainer}>
            {/* Main Content */}
            <EmployeeListScreen2 navigation={navigation} />

            {/* Draggable Drawer */}
            <Animated.View
                style={[styles.drawerContainer, {height: drawerHeight}]}>
                <View {...panResponder.panHandlers}>
                    <StatusBar hidden={true} />
                    <CartHeader />
                </View>

                <View style={styles.drawerContent}>
                    <CartEmployeeScreen navigation={navigation} />
                </View>
            </Animated.View>
        </View>
    );
};

// Styles
const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#FFFFFF',
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    grabBar: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#CBD5E1',
        alignSelf: 'center',
        marginBottom: 12,
    },
    cartHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 15,
        fontWeight: '700',
        color: NAVY_DARK,
    },
    headerSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    countPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: BRAND_RED,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        minWidth: 46,
        justifyContent: 'center',
    },
    countPillEmpty: {
        backgroundColor: '#F1F5F9',
    },
    countPillText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#fff',
    },
    countPillTextEmpty: {
        color: '#94A3B8',
    },
    screenContainer: {
        flex: 1,
    },
    drawerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 16,
        overflow: 'hidden',
    },
    drawerContent: {
        flex: 1,
    },
});

export default ScreenDragger;
