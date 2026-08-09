import {LogBox} from 'react-native';
import AppNavigator from './AppNavigator';

// Suppress defaultProps warning from react-native-paper and dependencies
// Warning: "Support for defaultProps will be removed from memo components in a future major release"
LogBox.ignoreLogs([
    'Support for defaultProps will be removed from memo components',
    'Support for defaultProps will be removed from function components',
]);

const App: React.FC = () => {
    return <AppNavigator />;
};

export default App;
