import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, Button} from 'react-native';
import Voice, {
    SpeechResultsEvent,
    SpeechErrorEvent,
} from '@react-native-voice/voice';

type DataItem = {
    id: number;
    name: string;
};

const dataList: DataItem[] = [
    {id: 1, name: 'Removed'},
    {id: 2, name: 'John'},
];

const VoiceSearch: React.FC = () => {
    const [recognized, setRecognized] = useState<string>('');
    const [results, setResults] = useState<string[]>([]);
    const [isListening, setIsListening] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filteredData, setFilteredData] = useState<DataItem[]>(dataList);

    useEffect(() => {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechRecognized = onSpeechRecognized;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;

        return () => {
            Voice.destroy().then(Voice.removeAllListeners).catch(error => {
                console.error('❌ VoiceSearch Voice.destroy Error:', error);
            });
        };
    }, []);

    const onSpeechStart = () => {
        setRecognized('Listening...');
    };

    const onSpeechRecognized = () => {
        setRecognized('Recognized');
    };

    const onSpeechResults = async (event: SpeechResultsEvent) => {
        const resultsArray = event.value;
        if (resultsArray) {
            setResults(resultsArray);

            if (
                !isListening &&
                resultsArray.some(result =>
                    result.toLowerCase().includes('search'),
                )
            ) {
                setRecognized('Listening for search query...');
                setIsListening(true);
                await startListeningForQuery();
            } else if (isListening) {
                const query = resultsArray.join(' ').toLowerCase();
                setSearchQuery(query);
                setRecognized('Search query recognized');
                filterData(query);
                setIsListening(false);
                await startListeningForKeyword();
            }
        }
    };

    const onSpeechError = (event: SpeechErrorEvent) => {
        console.error(event.error);
        setRecognized('Error occurred');
    };

    const startListeningForKeyword = async () => {
        try {
            await Voice.start('en-US');
            setRecognized('Listening for keyword...');
            setResults([]);
        } catch (e) {
            console.error(e);
        }
    };

    const startListeningForQuery = async () => {
        try {
            await Voice.start('en-US');
            setRecognized('Listening for search query...');
            setResults([]);
        } catch (e) {
            console.error(e);
        }
    };

    const filterData = (query: string) => {
        const filtered = dataList.filter(item =>
            item.name.toLowerCase().includes(query),
        );
        setFilteredData(filtered);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.stat}>{`Status: ${recognized}`}</Text>
            <Text style={styles.stat}>{`Results: ${results.join(', ')}`}</Text>
            <Text style={styles.stat}>{`Search Query: ${searchQuery}`}</Text>
            <Button
                title="Start Listening"
                onPress={startListeningForKeyword}
            />
            <FlatList
                data={filteredData}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                    <Text style={styles.item}>{item.name}</Text>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
        padding: 20,
    },
    stat: {
        textAlign: 'center',
        color: '#B0171F',
        marginBottom: 10,
        fontSize: 20,
    },
    item: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },
});

export default VoiceSearch;
