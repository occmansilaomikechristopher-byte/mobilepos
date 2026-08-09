import dayjs from 'dayjs';
import Sound from 'react-native-sound';

export const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
};

export const formatDate = (date: any, time = false, year = true) => {
    if (!year) {
        return dayjs(date).format('MMM D');
    }
    if (time) {
        return dayjs(date).format('MMM D, YYYY h:mm:ss A');
    }
    return dayjs(date).format('MMM D, YYYY');
};

export const formatTime = (date: any, time = false) => {
    return dayjs(date).format('h:mm:ss A');
};

export const formatDuration = (duration: number) => {
    const durationInHours = Math.floor(duration / 3600);
    const durationInMinutes = Math.floor((duration % 3600) / 60);
    const durationInSeconds = Math.floor(duration % 60);

    let durationString = '';
    if (durationInHours > 0) {
        durationString += `${durationInHours} hour${
            durationInHours > 1 ? 's' : ''
        } `;
    }
    durationString += `${durationInMinutes} minute${
        durationInMinutes > 1 ? 's' : ''
    }`;

    if (durationInHours === 0 && durationInMinutes === 0) {
        durationString += `${durationInSeconds} second${
            durationInSeconds > 1 ? 's' : ''
        }`;
    }

    return durationString;
};

export const formatDistance = (distance: number) => {
    const distanceInKM = distance / 1000;
    return distanceInKM.toFixed(2) + ' km';
};

export const generateLog = (log: any) => {
    let message;
    switch (log) {
        case 'date-booked':
            message = 'Booking Date Confirmed';
            break;
        case 'accepted':
            message = 'Booking Accepted';
            break;
        case 'assign-routes':
            message = 'Route Assigned to Rider';
            break;
        case 'ongoing-routes':
            message = 'Rider En Route';
            break;
        case 'visited-routes':
            message = 'Rider Arrived at Destination';
            break;
        case 'laundering':
            message = 'Laundering in Progress';
            break;
        case 'for-delivery':
            message = 'Schedule For Delivery';
            break;
        case 'completed':
            message = 'Booking Completed';
            break;
        default:
            message = 'Unknown Log Type' + log;
    }

    return message;
};

export const playSound = (motificationSound: any) => {
    var mySound = new Sound(motificationSound, error => {
        if (error) {
            console.log(error);
            return;
        } else {
            mySound.play((success: any) => {
                if (success) {
                    console.log('Sound playing');
                } else {
                    console.log('Issue playing file');
                }
            });
        }
    });
    mySound.setVolume(1.0);
    mySound.release();
};

export const normalizePhoneNumber = (phoneNumber: string) => {
    // Remove spaces
    phoneNumber = phoneNumber.replace(/\s+/g, '');

    // Replace '+63' with '0'
    phoneNumber = phoneNumber.replace(/^\+63/, '0');

    return phoneNumber;
};

export const formatName = (firstname: any, lastname: any, middlename: any) => {
    if (middlename) {
        return `${lastname}, ${firstname} ${middlename}.`;
    } else {
        return `${lastname}, ${firstname} `;
    }
};

export const safeJSONParse = (jsonString: any) => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Invalid JSON:', error);
        return [];
    }
};
