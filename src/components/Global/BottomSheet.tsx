import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View, ScrollView} from 'react-native';
import {List, IconButton, Text, TouchableRipple} from 'react-native-paper';
import RBSheet from 'react-native-raw-bottom-sheet';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Props {
    children: React.ReactNode;
    visible: boolean;
    height: number;
    onClose: (data: any) => void;
}

const BottomSheet: React.FC<Props> = ({visible, height, children, onClose}) => {
    const refRBSheet = useRef();
    useEffect(() => {
        if (visible) {
            refRBSheet.current.open();
        } else {
            refRBSheet.current.close();
        }
    }, [visible]);

    return (
        <RBSheet
            height={height}
            ref={refRBSheet}
            closeOnDragDown={true}
            closeOnPressMask={true}
            onClose={onClose}
            dragOnContent={true}
            openDuration={250}
            customStyles={{
                wrapper: {
                    // backgroundColor: 'transparent',
                },
                draggableIcon: {
                    backgroundColor: '#5886ec',
                },
                container: {
                    backgroundColor: '#fff',
                    // borderTopLeftRadius: 20,
                    // borderTopRightRadius: 20,
                },
            }}>
            {/* <View style={{alignItems: 'center', marginTop: -6}}>
                <TouchableRipple
                    borderless={true}
                    rippleColor="rgba(206,232,255,0.8)"
                    centered={true}
                    style={{
                        borderWidth: 1,
                        borderColor: '#eee',
                        backgroundColor:'#ebedf0',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderBottomLeftRadius: 7,
                        borderBottomRightRadius: 7,
                    }}
                    onPress={onClose}>
                    <Text style={{ fontSize: 15, color: '#9aa2b2' }} >close</Text>
                </TouchableRipple>
            </View> */}
            {children}
        </RBSheet>
    );
};

export default React.memo(BottomSheet);
