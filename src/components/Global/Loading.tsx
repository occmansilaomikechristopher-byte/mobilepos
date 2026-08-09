import React, {useEffect, useRef} from 'react';
import {Modal, View, StyleSheet, Animated, Easing} from 'react-native';
import {TextComponent} from '../';
import useGlobalStore from '../../store/globalState';

const BRAND_RED = '#219688';
const NAVY_DARK = '#0F172A';

const Loading: React.FC = () => {
    const {loading} = useGlobalStore();
    const visible = loading?.visible || false;

    const spin = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.85)).current;
    const fade = useRef(new Animated.Value(0)).current;
    const dot = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let spinLoop: Animated.CompositeAnimation | undefined;
        let dotLoop: Animated.CompositeAnimation | undefined;

        if (visible) {
            spin.setValue(0);
            spinLoop = Animated.loop(
                Animated.timing(spin, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            );
            spinLoop.start();

            dotLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            );
            dotLoop.start();

            Animated.parallel([
                Animated.timing(fade, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 7,
                    tension: 80,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fade.setValue(0);
            scale.setValue(0.85);
        }

        return () => {
            spinLoop && spinLoop.stop();
            dotLoop && dotLoop.stop();
        };
    }, [visible, spin, dot, fade, scale]);

    if (!visible) {
        return null;
    }

    const rotate = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    const dotScale = dot.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1.15],
    });

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent>
            <Animated.View style={[styles.backdrop, {opacity: fade}]}>
                <Animated.View
                    style={[
                        styles.card,
                        {opacity: fade, transform: [{scale}]},
                    ]}>
                    {/* Branded spinner */}
                    <View style={styles.spinnerWrap}>
                        <View style={styles.ringTrack} />
                        <Animated.View
                            style={[styles.ringActive, {transform: [{rotate}]}]}
                        />
                        <Animated.View
                            style={[
                                styles.logoDot,
                                {transform: [{scale: dotScale}]},
                            ]}>
                            <TextComponent style={styles.logoText}>
                                Gv
                            </TextComponent>
                        </Animated.View>
                    </View>

                    {/* Message */}
                    <TextComponent style={styles.message} numberOfLines={2}>
                        {loading?.message ? loading.message : 'Loading'}
                    </TextComponent>
                    <TextComponent style={styles.subtle}>
                        Please wait a moment…
                    </TextComponent>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const SPINNER = 66;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
    },
    card: {
        width: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        paddingVertical: 28,
        paddingHorizontal: 22,
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.18,
        shadowRadius: 20,
    },
    spinnerWrap: {
        width: SPINNER,
        height: SPINNER,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    ringTrack: {
        position: 'absolute',
        width: SPINNER,
        height: SPINNER,
        borderRadius: SPINNER / 2,
        borderWidth: 4,
        borderColor: '#F1F5F9',
    },
    ringActive: {
        position: 'absolute',
        width: SPINNER,
        height: SPINNER,
        borderRadius: SPINNER / 2,
        borderWidth: 4,
        borderColor: 'transparent',
        borderTopColor: BRAND_RED,
        borderRightColor: BRAND_RED,
    },
    logoDot: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: NAVY_DARK,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 15,
        fontWeight: '700',
        color: NAVY_DARK,
        textAlign: 'center',
    },
    subtle: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 3,
        textAlign: 'center',
    },
});

export default React.memo(Loading);
