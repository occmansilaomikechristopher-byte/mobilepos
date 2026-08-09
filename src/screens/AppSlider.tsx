import React, {useState} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {StyleSheet, View, Text, Image, StatusBar} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const styles = StyleSheet.create({
    buttonCircle: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(0, 0, 0, .2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slide: {
        // Add your styles for the slide
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        // Add your styles for the title
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    text: {
        // Add your styles for the text
        fontSize: 16,
        textAlign: 'center',
        marginHorizontal: 20,
    },
    image: {
        width: 200, // Set the width of the image
        height: 200, // Set the height of the image
        marginBottom: 20,
    },
});

const slides = [
    {
        key: 1,
        title: 'Welcome to Laundry Man',
        text: ' Discover premium laundry care with convenient locations, affordable prices, and eco-friendly products',
        image: require('../assets/images/laundry.png'),
        backgroundColor: '#47abfa',
    },
    {
        key: 2,
        title: 'Our Services',
        text: 'From wash & fold to dry cleaning and ironing, we offer a full range of laundry services including pick-up and delivery',
        image: require('../assets/images/laundry_2.png'),
        backgroundColor: '#67c23a',
    },
    {
        key: 3,
        title: 'Easy Online Booking',
        text: 'Schedule your laundry service in just a few clicks through our user-friendly online booking system',
        image: require('../assets/images/booking.png'),
        backgroundColor: '#22bcb5',
    },
];

const AppSlider: React.FC = () => {
    const navigation = useNavigation();
    const renderItem = ({
        item,
    }: {
        item: {title: string; text: string; image: any; backgroundColor: any};
    }) => {
        return (
            <>
                <View
                    style={[
                        styles.slide,
                        {backgroundColor: item.backgroundColor},
                    ]}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Image source={item.image} style={styles.image} />
                    <Text style={styles.text}>{item.text}</Text>
                </View>
            </>
        );
    };

    const renderNextButton = () => {
        return (
            <View style={styles.buttonCircle}>
                <Icon
                    name="arrow-forward"
                    color="rgba(255, 255, 255, .9)"
                    size={24}
                />
            </View>
        );
    };

    const renderDoneButton = () => {
        return (
            <View style={styles.buttonCircle}>
                <Icon
                    name="arrow-forward"
                    color="rgba(255, 255, 255, .9)"
                    size={24}
                />
            </View>
        );
    };

    const [currentSlide, setCurrentSlide] = useState('#47abfa');

    const onSlideChange = (index: number) => {
        let sliderColor = '#47abfa';
        if (index === 1) {
            sliderColor = '#67c23a';
        }

        if (index === 2) {
            sliderColor = '#22bcb5';
        }
        setCurrentSlide(sliderColor);
    };

    const onDone = async () => {
        //  await AsyncStorage.removeItem('new');
        navigation.navigate('Dashboard');
    };

    const onSkip = () => {
        navigation.navigate('Dashboard');
    };

    return (
        <>
            <StatusBar
                barStyle="light-content"
                backgroundColor={currentSlide}
            />
            <AppIntroSlider
                data={slides}
                renderItem={renderItem}
                renderNextButton={renderNextButton}
                onSlideChange={onSlideChange}
                onDone={onDone}
                showSkipButton
                onSkip={onSkip}
            />
        </>
    );
};

export default AppSlider;
