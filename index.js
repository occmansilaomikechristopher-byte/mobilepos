/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import {name as appName} from './app.json';
import App from './src/App';
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import {
    MD5LightTheme as DefaultTheme,
    Provider as PaperProvider,
} from 'react-native-paper';
import {QueryClient, QueryClientProvider} from 'react-query';
import {DarkTheme} from '@react-navigation/native';

// Suppress unhandled promise rejection warnings
LogBox.ignoreLogs([
    'Possible unhandled promise rejection',
    'Support for defaultProps will be removed',
]);

// Global unhandled rejection handler
if (!global.onunhandledrejection) {
    global.onunhandledrejection = ({reason, promise}) => {
        console.error('❌ Unhandled Promise Rejection:', reason);
    };
}

const queryClient = new QueryClient();

let darkColorScheme = {
    colors: {
        primary: 'rgb(84, 219, 201)',
        onPrimary: 'rgb(0, 55, 49)',
        primaryContainer: 'rgb(0, 80, 72)',
        onPrimaryContainer: 'rgb(116, 248, 229)',
        secondary: 'rgb(177, 204, 198)',
        onSecondary: 'rgb(28, 53, 49)',
        secondaryContainer: 'rgb(51, 75, 71)',
        onSecondaryContainer: 'rgb(204, 232, 226)',
        tertiary: 'rgb(173, 202, 229)',
        onTertiary: 'rgb(20, 51, 73)',
        tertiaryContainer: 'rgb(45, 73, 96)',
        onTertiaryContainer: 'rgb(204, 229, 255)',
        error: 'rgb(255, 180, 171)',
        onError: 'rgb(105, 0, 5)',
        errorContainer: 'rgb(147, 0, 10)',
        onErrorContainer: 'rgb(255, 180, 171)',
        background: 'rgb(25, 28, 27)',
        onBackground: 'rgb(224, 227, 225)',
        surface: 'rgb(25, 28, 27)',
        onSurface: 'rgb(224, 227, 225)',
        surfaceVariant: 'rgb(63, 73, 70)',
        onSurfaceVariant: 'rgb(190, 201, 197)',
        outline: 'rgb(137, 147, 144)',
        outlineVariant: 'rgb(63, 73, 70)',
        shadow: 'rgb(0, 0, 0)',
        scrim: 'rgb(0, 0, 0)',
        inverseSurface: 'rgb(224, 227, 225)',
        inverseOnSurface: 'rgb(45, 49, 48)',
        inversePrimary: 'rgb(0, 107, 96)',
        elevation: {
            level0: 'transparent',
            level1: 'rgb(28, 38, 36)',
            level2: 'rgb(30, 43, 41)',
            level3: 'rgb(32, 49, 46)',
            level4: 'rgb(32, 51, 48)',
            level5: 'rgb(33, 55, 51)',
        },
        surfaceDisabled: 'rgba(224, 227, 225, 0.12)',
        onSurfaceDisabled: 'rgba(224, 227, 225, 0.38)',
        backdrop: 'rgba(41, 50, 48, 0.4)',
    },
};

const theme = {
    ...DefaultTheme,
    roundness: 4,
    colors: darkColorScheme,
};

export default function Main() {
    return (
        // <PaperProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
        // </PaperProvider>
    );
}
AppRegistry.registerComponent(appName, () => gestureHandlerRootHOC(Main));
