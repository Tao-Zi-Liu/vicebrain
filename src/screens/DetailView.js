import React, { memo, useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
    TouchableOpacity, ScrollView, Linking
} from 'react-native';
import { FlingGestureHandler, Directions } from 'react-native-gesture-handler';
import { useGestureContext } from '../context/GestureContext';
import useGestureManager from '../hooks/useGestureManager';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';

const formatFullDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
};

const BackIcon = memo(() => <Text style={styles.iconText}>‹</Text>);
const AiIcon = memo(() => <Text style={styles.iconText}>✨</Text>)

const AiSection = memo(({ type, results, onOpenLink }) => {
    if (!results || results.length === 0) return null;

    let title;
    switch (type) {
        case 'expansion': title = 'AI Expansions'; break;
        case 'materials': title = 'Related Materials'; break;
        case 'cases': title = 'Similar Cases'; break;
        default: title = 'AI Results';
    }

    const sortedResults = [...results].sort((a, b) => (b.generatedAt?.toDate?.() || 0) - (a.generatedAt?.toDate?.() || 0));

    return (
        <View style={styles.aiCard}>
            <Text style={styles.aiCardHeader}>{title}</Text>
            {sortedResults.map((result, index) => (
                <View key={index} style={styles.aiResultItem}>
                    {type === 'expansion' && <Text style={styles.aiContent}>{result.data}</Text>}
                    {type === 'materials' && result.data.map((item, i) => (
                        <TouchableOpacity key={i} style={styles.linkCard} onPress={() => onOpenLink(item.url)}>
                            <Text style={styles.linkTitle}>{item.title}</Text>
                            <Text style={styles.linkSummary}>{item.summary}</Text>
                        </TouchableOpacity>
                    ))}
                    {type === 'cases' && result.data.map((item, i) => (
                        <TouchableOpacity key={i} style={styles.linkCard} onPress={() => item.url && onOpenLink(item.url)}>
                            <Text style={styles.linkTitle}>{item.caseName}</Text>
                            <Text style={styles.linkSummary}>{item.description}</Text>
                        </TouchableOpacity>
                    ))}
                    <Text style={styles.aiTimestamp}>Generated: {formatFullDate(result.generatedAt)}</Text>
                </View>
            ))}
        </View>
    );
});

const DetailView = ({ shinning, onBack, onSelectLinkedItem, linkedData }) => {
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const translateX = useSharedValue(0);

        const onOpenAiMenu = useCallback(() => {
        console.log('AI menu clicked');
        // TODO: Implement AI features later
    }, []);

    const onOpenLink = useCallback(async (url) => {
        if (!url) return;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                console.log("Cannot open URL:", url);
            }
        } catch (error) {
            console.error('Failed to open URL:', error);
        }
    }, []);

    const backGesture = Gesture.Pan()
        .activeOffsetX([10, 999]) 
        .failOffsetY([-10, 10])
        .onUpdate((event) => {
            'worklet';
            if (event.absoluteX - event.translationX < 30) {
                translateX.value = Math.max(0, event.translationX);
            }
        })
        .onEnd((event) => {
            'worklet';
            if (event.translationX > 100) {
                runOnJS(onBack)();
            } else {
                translateX.value = withSpring(0);
            }
        });
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
        }));
    const { gestureState } = useGestureContext();
    const { createBackGestureHandler } = useGestureManager();
    const backGestureHandler = createBackGestureHandler(onBack);
    
    const renderAiSections = useCallback(() => {
        if (!shinning.aiResults) return null;
        return Object.entries(shinning.aiResults).map(([type, results]) => (
            <AiSection key={type} type={type} results={results} onOpenLink={onOpenLink} />
        ));
    }, [shinning.aiResults, onOpenLink]);

    return (
            <GestureDetector gesture={backGesture}>
                <Animated.View style={[{ flex: 1 }, animatedStyle]}>
                    <FlingGestureHandler
                        direction={Directions.RIGHT}
                        enabled={!gestureState.isMenuOpen}
                        onHandlerStateChange={backGestureHandler.onHandlerStateChange}
                    >
                        <SafeAreaView style={styles.safeArea}>
                            <StatusBar barStyle="dark-content" />
                            <View style={styles.header}>
                                <TouchableOpacity onPress={onBack} style={styles.menuButton}><BackIcon /></TouchableOpacity>
                                <Text style={styles.headerTitle} numberOfLines={1}>{shinning.title}</Text>
                                <TouchableOpacity onPress={onOpenAiMenu} style={styles.menuButton}><AiIcon /></TouchableOpacity>
                            </View>
                            <ScrollView scrollEnabled={!isMenuVisible} contentContainerStyle={styles.detailContainer}>
                                <Text style={styles.detailContent}>{shinning.content}</Text>
                                <View style={styles.tagsContainer}>
                                    {shinning.tags?.map(tag => <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>)}
                                </View>
                                <View style={styles.timestampContainer}>
                                    <Text style={styles.timestampText}>Created: {formatFullDate(shinning.createdAt)}</Text>
                                    <Text style={styles.timestampText}>Updated: {formatFullDate(shinning.updatedAt)}</Text>
                                </View>

                                {isAILoading && <ActivityIndicator style={{ marginVertical: 20 }} />}
                                {aiError && <Text style={[styles.errorText, { marginTop: 20 }]}>{aiError}</Text>}

                                {renderAiSections()}

                                <View style={styles.knowledgeGraphContainer}>
                                    <Text style={styles.aiHeader}>Backlinks</Text>
                                    {linkedData.backlinks.length > 0 ? (
                                        linkedData.backlinks.map(link => (
                                            <TouchableOpacity key={link.id} onPress={() => onSelectLinkedItem(link)}>
                                                <Text style={styles.linkItem}>- {link.title}</Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>No backlinks yet.</Text>
                                    )}
                                </View>
                                <View style={styles.knowledgeGraphContainer}>
                                    <Text style={styles.aiHeader}>Outgoing Links</Text>
                                    {linkedData.outgoingLinks.length > 0 ? (
                                        linkedData.outgoingLinks.map(link => (
                                            <TouchableOpacity key={link.id} onPress={() => onSelectLinkedItem(link)}>
                                                <Text style={styles.linkItem}>- {link.title}</Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>No outgoing links yet.</Text>
                                    )}
                                </View>
                            </ScrollView>
                        </SafeAreaView>
                    </FlingGestureHandler>
                </Animated.View>
            </GestureDetector>
        );
        };

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E9ECEF', backgroundColor: 'white' },
    menuButton: { padding: 4, width: 40, alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '600', color: '#212529' },
    iconText: { fontSize: 24, color: '#212529' },
    detailContainer: { padding: 20, paddingBottom: 40 },
    detailContent: { fontSize: 16, lineHeight: 26, color: '#343A40' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    tag: { backgroundColor: '#E9ECEF', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8, marginBottom: 8 },
    tagText: { color: '#495057', fontSize: 12 },
    timestampContainer: { marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F3F5' },
    timestampText: { fontSize: 12, color: '#ADB5BD', marginTop: 8 },
    errorText: { color: '#D9480F', textAlign: 'center', marginBottom: 10 },
    aiCard: { backgroundColor: '#F1F3F5', borderRadius: 8, padding: 16, marginTop: 24 },
    aiHeader: { fontSize: 14, fontWeight: '600', color: '#6C757D', marginVertical: 10 },
    aiCardHeader: { fontSize: 16, fontWeight: 'bold', color: '#495057', marginBottom: 10 },
    aiResultItem: { borderTopWidth: 1, borderTopColor: '#DEE2E6', paddingTop: 12, marginBottom: 12 },
    aiContent: { fontSize: 15, color: '#343A40', lineHeight: 24, marginTop: 12 },
    aiTimestamp: { fontSize: 12, color: '#ADB5BD', marginTop: 12, textAlign: 'right' },
    linkCard: { borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 8, padding: 12, marginTop: 10, backgroundColor: 'white' },
    linkTitle: { fontWeight: '600', color: '#212529', marginBottom: 4 },
    linkSummary: { fontSize: 14, color: '#495057' },
    knowledgeGraphContainer: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F3F5' },
    linkItem: { color: '#003F5C', paddingVertical: 4, fontSize: 16 },
    emptyText: { fontSize: 16, color: '#6C757D', textAlign: 'center' },
});

export default memo(DetailView);