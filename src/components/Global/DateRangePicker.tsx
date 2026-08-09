//@ts-nocheck
import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Modal, Portal, TouchableRipple} from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {TextComponent} from '../';
import dayjs from 'dayjs';

const NAVY_DARK = '#0F172A';
const BRAND_RED = '#219688';

interface DateRangePickerProps {
    visible: boolean;
    onDismiss: () => void;
    onApply: (startDate: Date, endDate: Date) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    visible,
    onDismiss,
    onApply,
}) => {
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const handleConfirmStart = (date: Date) => {
        setStartDate(date);
        if (endDate && date > endDate) {
            setEndDate(undefined);
        }
        setStartPickerVisible(false);
    };

    const handleConfirmEnd = (date: Date) => {
        setEndDate(date);
        setEndPickerVisible(false);
    };

    const handleApply = () => {
        if (!startDate || !endDate) {
            return;
        }
        onApply(startDate, endDate);
        onDismiss();
    };

    const canApply = !!startDate && !!endDate;
    const dayCount =
        startDate && endDate
            ? dayjs(endDate).diff(dayjs(startDate), 'day') + 1
            : null;

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modal}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <MaterialIcons
                            name="date-range"
                            size={20}
                            color={BRAND_RED}
                        />
                        <TextComponent style={styles.headerTitle}>
                            Date Range
                        </TextComponent>
                    </View>
                    <TouchableRipple
                        onPress={onDismiss}
                        borderless
                        rippleColor="rgba(0,0,0,0.08)"
                        style={styles.closeBtn}>
                        <MaterialIcons name="close" size={20} color="#94A3B8" />
                    </TouchableRipple>
                </View>

                {/* Duration pill */}
                {dayCount !== null && (
                    <View style={styles.durationPill}>
                        <MaterialIcons
                            name="timelapse"
                            size={13}
                            color={BRAND_RED}
                        />
                        <TextComponent style={styles.durationText}>
                            {dayCount} day{dayCount !== 1 ? 's' : ''}
                        </TextComponent>
                    </View>
                )}

                {/* Date selectors */}
                <View style={styles.dateRow}>
                    {/* From */}
                    <TouchableRipple
                        onPress={() => setStartPickerVisible(true)}
                        rippleColor={`${BRAND_RED}12`}
                        style={[
                            styles.dateCard,
                            startDate && styles.dateCardFilled,
                        ]}>
                        <View style={styles.dateCardInner}>
                            <View style={styles.dateLabelRow}>
                                <MaterialIcons
                                    name="flight-takeoff"
                                    size={14}
                                    color={startDate ? BRAND_RED : '#94A3B8'}
                                />
                                <TextComponent
                                    style={[
                                        styles.dateLabel,
                                        startDate && styles.dateLabelActive,
                                    ]}>
                                    From
                                </TextComponent>
                            </View>
                            <TextComponent
                                style={[
                                    styles.dateValue,
                                    !startDate && styles.datePlaceholder,
                                ]}>
                                {startDate
                                    ? dayjs(startDate).format('MMM DD, YYYY')
                                    : 'Select date'}
                            </TextComponent>
                            {startDate && (
                                <TextComponent style={styles.dateSub}>
                                    {dayjs(startDate).format('dddd')}
                                </TextComponent>
                            )}
                        </View>
                    </TouchableRipple>

                    {/* Arrow */}
                    <View style={styles.arrowWrap}>
                        <MaterialIcons
                            name="arrow-forward"
                            size={18}
                            color="#CBD5E1"
                        />
                    </View>

                    {/* To */}
                    <TouchableRipple
                        onPress={() => setEndPickerVisible(true)}
                        rippleColor={`${BRAND_RED}12`}
                        style={[
                            styles.dateCard,
                            endDate && styles.dateCardFilled,
                        ]}>
                        <View style={styles.dateCardInner}>
                            <View style={styles.dateLabelRow}>
                                <MaterialIcons
                                    name="flight-land"
                                    size={14}
                                    color={endDate ? BRAND_RED : '#94A3B8'}
                                />
                                <TextComponent
                                    style={[
                                        styles.dateLabel,
                                        endDate && styles.dateLabelActive,
                                    ]}>
                                    To
                                </TextComponent>
                            </View>
                            <TextComponent
                                style={[
                                    styles.dateValue,
                                    !endDate && styles.datePlaceholder,
                                ]}>
                                {endDate
                                    ? dayjs(endDate).format('MMM DD, YYYY')
                                    : 'Select date'}
                            </TextComponent>
                            {endDate && (
                                <TextComponent style={styles.dateSub}>
                                    {dayjs(endDate).format('dddd')}
                                </TextComponent>
                            )}
                        </View>
                    </TouchableRipple>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableRipple
                        onPress={onDismiss}
                        rippleColor="rgba(0,0,0,0.06)"
                        style={styles.cancelBtn}>
                        <TextComponent style={styles.cancelText}>
                            Cancel
                        </TextComponent>
                    </TouchableRipple>

                    <TouchableRipple
                        onPress={handleApply}
                        disabled={!canApply}
                        rippleColor="rgba(255,255,255,0.2)"
                        style={[
                            styles.applyBtn,
                            !canApply && styles.applyBtnDisabled,
                        ]}>
                        <View style={styles.applyBtnInner}>
                            <MaterialIcons
                                name="check"
                                size={16}
                                color="#FFFFFF"
                            />
                            <TextComponent style={styles.applyText}>
                                Apply
                            </TextComponent>
                        </View>
                    </TouchableRipple>
                </View>

                <DateTimePickerModal
                    isVisible={isStartPickerVisible}
                    mode="date"
                    maximumDate={endDate}
                    onConfirm={handleConfirmStart}
                    onCancel={() => setStartPickerVisible(false)}
                />
                <DateTimePickerModal
                    isVisible={isEndPickerVisible}
                    mode="date"
                    minimumDate={startDate}
                    onConfirm={handleConfirmEnd}
                    onCancel={() => setEndPickerVisible(false)}
                />
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modal: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.12,
        shadowRadius: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: NAVY_DARK,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 5,
        backgroundColor: `${BRAND_RED}12`,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginTop: 14,
    },
    durationText: {
        fontSize: 12,
        fontWeight: '700',
        color: BRAND_RED,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 8,
    },
    dateCard: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    dateCardFilled: {
        borderColor: `${BRAND_RED}50`,
        backgroundColor: `${BRAND_RED}06`,
    },
    dateCardInner: {
        padding: 14,
    },
    dateLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 6,
    },
    dateLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    dateLabelActive: {
        color: BRAND_RED,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: NAVY_DARK,
    },
    datePlaceholder: {
        color: '#CBD5E1',
        fontWeight: '400',
    },
    dateSub: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 3,
    },
    arrowWrap: {
        width: 28,
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        overflow: 'hidden',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    applyBtn: {
        flex: 1,
        backgroundColor: BRAND_RED,
        borderRadius: 12,
        overflow: 'hidden',
    },
    applyBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    applyBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        gap: 6,
    },
    applyText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default DateRangePicker;
