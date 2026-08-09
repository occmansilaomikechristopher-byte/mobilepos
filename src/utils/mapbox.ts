import axios from 'axios';
import {MAP_API_URL_GEOCODING, MAP_KEY} from '../utils/constant';

const MAPBOX_ACCESS_TOKEN = MAP_KEY;
const BASE_URL = MAP_API_URL_GEOCODING;

export const getRoute = async (
    startCoords: [number, number],
    endCoords: [number, number],
    profile: string = 'driving',
) => {
    try {
        // Use driving-traffic for motorcycle profile as a close approximation
        const routeProfile =
            profile === 'motorcycle' ? 'driving-traffic' : profile;

        const response = await axios.get(
            `${BASE_URL}/${routeProfile}/${startCoords.join(
                ',',
            )};${endCoords.join(',')}`,
            {
                params: {
                    geometries: 'geojson',
                    access_token: MAPBOX_ACCESS_TOKEN,
                },
            },
        );
        return response.data.routes[0]; // Return the first route
    } catch (error) {
        console.error('Error fetching route data:', error);
        throw error;
    }
};
