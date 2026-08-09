import {Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

export const requestCameraPermission = async () => {
    let permission;

    if (Platform.OS === 'android') {
        permission = PERMISSIONS.ANDROID.CAMERA;
    } else if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.CAMERA;
    }

    try {
        const result = await check(permission);

        switch (result) {
            case RESULTS.UNAVAILABLE:
                console.log(
                    'This feature is not available (on this device / in this context)',
                );
                break;
            case RESULTS.DENIED:
                console.log(
                    'The permission has not been requested / is denied but requestable',
                );
                const requestResult = await request(permission);
                return requestResult === RESULTS.GRANTED;
            case RESULTS.LIMITED:
                console.log(
                    'The permission is limited: some actions are possible',
                );
                return true;
            case RESULTS.GRANTED:
                console.log('The permission is granted');
                return true;
            case RESULTS.BLOCKED:
                console.log(
                    'The permission is denied and not requestable anymore',
                );
                return false;
            default:
                return false;
        }
    } catch (error) {
        console.error('Failed to check or request permission', error);
        return false;
    }
};
