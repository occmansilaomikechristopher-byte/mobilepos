import React from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useTheme} from 'react-native-paper';

interface ContainerProps {
    children: React.ReactNode;
    style?: any; // or specific type for style if needed
}

export const DefaultContainer: React.FC<ContainerProps> = React.memo(
    ({children}) => {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: '#252525'}}>
                <KeyboardAwareScrollView keyboardShouldPersistTaps="always">
                    <View style={{padding: 20}}>{children}</View>
                </KeyboardAwareScrollView>
            </SafeAreaView>
        );
    },
);

export const CenterContainer: React.FC<ContainerProps> = React.memo(
    ({children, style}) => {
        return (
            <SafeAreaView
                style={[
                    style,
                    {
                        flex: 1,
                        backgroundColor: '#53c570',
                        flexDirection: 'column',
                    },
                ]}>
                <View style={{padding: 20, flex: 1}}>{children}</View>
            </SafeAreaView>
        );
    },
);

export const MainContainer: React.FC<ContainerProps> = props => {
    const theme = useTheme();
    const styles = makeStyles(theme);
    return <View style={styles.container}>{props.children}</View>;
};

export const FullContainer: React.FC<ContainerProps> = props => {
    const theme = useTheme();
    const styles = makeStyles(theme);
    return (
        <SafeAreaView
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
                width: '100%',
            }}>
            <KeyboardAwareScrollView keyboardShouldPersistTaps="always">
                {props.children}
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export const LoginContainer: React.FC<ContainerProps> = props => {
    const theme = useTheme();
    const styles = makeStyles(theme);
    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: theme.colors.background,
                width: '100%',
                padding: 20,
            }}>
            {props.children}
        </SafeAreaView>
    );
};

const makeStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: 20,
            paddingVertical: 0,
            marginBottom: 10,
        },
    });
