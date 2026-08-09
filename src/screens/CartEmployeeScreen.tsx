//@ts-nocheck
import React from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    StatusBar,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {Appbar, TouchableRipple, IconButton} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {TextComponent} from '../components/';
import useGlobalStore from '../store/globalState';

const NAVY_DARK = '#0F172A';
const BRAND_RED = '#219688';
const BG = '#F1F5F9';

const AVATAR_PALETTE = [
    '#2563EB',
    '#7C3AED',
    '#0891B2',
    '#059669',
    '#D97706',
    '#DC2626',
    '#4F46E5',
    '#0284C7',
];

const getAvatarColor = (seed: number | string) =>
    AVATAR_PALETTE[Math.abs(Number(seed) || 0) % AVATAR_PALETTE.length];

const getInitials = (first: string, last: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?';

interface Employee {
    id: string;
    firstname: string;
    lastname: string;
    employee_no: string;
    code: string;
}

const CartEmployeeScreen: React.FC<{navigation: any}> = ({navigation}) => {
    const {cartItems, updateEmployeeCode, removeFromCart, saveMyEmployee} =
        useGlobalStore();

    const handleCodeChange = (employee: Employee, newCode: string) => {
        updateEmployeeCode(employee.id, newCode);
    };

    const saveEmployee = () => {
        const missingCode = cartItems.find(item => !String(item.code || '').trim());
        if (missingCode) {
            Alert.alert(
                'Biometric code required',
                `Enter the biometric code for ${missingCode.firstname || ''} ${missingCode.lastname || ''}.`.trim(),
            );
            return;
        }

        const codes = cartItems.map(item => String(item.code).trim());
        const duplicateCode = codes.find(
            (code, index) => codes.indexOf(code) !== index,
        );
        if (duplicateCode) {
            Alert.alert(
                'Duplicate biometric code',
                `Code ${duplicateCode} is assigned to more than one employee.`,
            );
            return;
        }

        saveMyEmployee(cartItems);
    };

    const renderItem = ({item}: {item: Employee}) => (
        <View style={styles.card}>
            {/* Avatar */}
            <View
                style={[
                    styles.avatar,
                    {backgroundColor: getAvatarColor(item.employee_no)},
                ]}>
                <TextComponent style={styles.avatarText}>
                    {getInitials(item.firstname, item.lastname)}
                </TextComponent>
            </View>

            {/* Info */}
            <View style={styles.info}>
                <TextComponent style={styles.name}>
                    {item.firstname} {item.lastname}
                </TextComponent>
                <TextComponent style={styles.empNo}>
                    #{item.employee_no}
                </TextComponent>
            </View>

            {/* Code input */}
            <View style={styles.codeWrapper}>
                <TextComponent style={styles.codeLabel}>Code</TextComponent>
                <TextInput
                    style={styles.codeInput}
                    keyboardType="numeric"
                    returnKeyType="done"
                    placeholder="—"
                    placeholderTextColor="#CBD5E1"
                    value={item.code}
                    onChangeText={newCode => handleCodeChange(item, newCode)}
                />
            </View>

            {/* Remove */}
            <IconButton
                icon="trash-can-outline"
                iconColor="#EF4444"
                size={20}
                style={styles.removeBtn}
                onPress={() => removeFromCart(item)}
            />
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY_DARK} />

            {/* Appbar */}
            {/* <Appbar.Header style={styles.appbar} statusBarHeight={0}>
                <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
                <Appbar.Content
                    title="Cart"
                    titleStyle={styles.appbarTitle}
                    subtitle={`${cartItems.length} employee${cartItems.length !== 1 ? 's' : ''} selected`}
                    subtitleStyle={styles.appbarSub}
                />
            </Appbar.Header> */}

            {/* List */}
            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons
                        name="shopping-cart"
                        size={56}
                        color="#CBD5E1"
                    />
                    <TextComponent style={styles.emptyTitle}>
                        Cart is empty
                    </TextComponent>
                    <TextComponent style={styles.emptySubtitle}>
                        Add employees from the employee list
                    </TextComponent>
                </View>
            ) : (
                <FlatList
                    data={cartItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => (
                        <View style={styles.divider} />
                    )}
                />
            )}

            {/* Save button */}
            {cartItems.length > 0 && (
                <View style={styles.footer}>
                    <TouchableRipple
                        onPress={saveEmployee}
                        rippleColor="rgba(255,255,255,0.2)"
                        style={styles.saveBtn}>
                        <View style={styles.saveBtnInner}>
                            <MaterialIcons
                                name="person-add"
                                size={20}
                                color="#FFFFFF"
                            />
                            <TextComponent style={styles.saveBtnText}>
                                Add {cartItems.length} Employee
                                {cartItems.length !== 1 ? 's' : ''}
                            </TextComponent>
                        </View>
                    </TouchableRipple>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG,
    },
    appbar: {
        backgroundColor: NAVY_DARK,
        elevation: 2,
    },
    appbarTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    appbarSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 6,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    empNo: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    codeWrapper: {
        alignItems: 'center',
        marginRight: 4,
    },
    codeLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    codeInput: {
        width: 64,
        height: 36,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
        paddingHorizontal: 4,
    },
    removeBtn: {
        margin: 0,
    },
    divider: {
        height: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingBottom: 40,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#94A3B8',
        marginTop: 4,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#CBD5E1',
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    saveBtn: {
        backgroundColor: BRAND_RED,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});

export default CartEmployeeScreen;
