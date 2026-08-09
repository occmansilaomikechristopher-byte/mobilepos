import {useState, useEffect, useCallback} from 'react';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import Geolocation, {
    GeoPosition,
    GeoError,
} from 'react-native-geolocation-service';

const useLocation = () => {
    const [location, setLocation] = useState<GeoPosition | null>(null);
    const [error, setError] = useState<string | null>(null);

    const requestLocationPermission = useCallback(async () => {
        try {
            if (Platform.OS === 'android') {
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        {
                            title: 'Location Permission',
                            message:
                                'We need access to your location to show your current position on the map.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        },
                    );
                    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                        getLocation();
                    } else {
                        Alert.alert('Location permission denied');
                    }
                } catch (err: any) {
                    console.error('❌ useLocation PermissionsAndroid Error:', err);
                }
            } else {
                getLocation();
            }
        } catch (error: any) {
            console.error('❌ useLocation requestLocationPermission Error:', error);
        }
    }, []);

    const getLocation = useCallback(() => {
        Geolocation.getCurrentPosition(
            (position: GeoPosition) => {
                setLocation(position);
                setError(null);
            },
            (error: GeoError) => {
                setError(error.message);
                console.error(error);
            },
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
    }, []);

    useEffect(() => {
        requestLocationPermission();
    }, [requestLocationPermission]);

    return {location, error, getLocation};
};

export default useLocation;
