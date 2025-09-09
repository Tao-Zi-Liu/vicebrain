// ShinningEditorScreen.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Keyboard,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ShinningEditorScreen = ({ visible, onClose, shinningToEdit }) => {
 // Core content state
 const [title, setTitle] = useState('');
 const [content, setContent] = useState('');
 const [suggestedTitle, setSuggestedTitle] = useState('');
 const [keyboardHeight, setKeyboardHeight] = useState(0);
 
 // UI state
 const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
 const [isRelatedPanelVisible, setIsRelatedPanelVisible] = useState(false);
 const [isZenMode, setIsZenMode] = useState(false);
 const [linkSuggestion, setLinkSuggestion] = useState(null);
 
 // Refs and animations
 const contentInputRef = useRef(null);
 const zenModeOpacity = useRef(new Animated.Value(1)).current;
 const relatedPanelTranslateX = useRef(new Animated.Value(width)).current;
 
 // Mock data
 const templates = [
   { id: 1, name: 'Meeting Notes', content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Key Points\n- \n\n## Action Items\n- [ ] \n\n## Next Steps\n' },
   { id: 2, name: 'Book Summary', content: '# Book Summary\n\n**Title:** \n**Author:** \n**Rating:** /5\n\n## Key Takeaways\n- \n\n## Favorite Quotes\n> \n\n## My Thoughts\n' },
   { id: 3, name: 'Daily Reflection', content: '# Daily Reflection\n\n**Date:** \n\n## What went well today?\n- \n\n## What could be improved?\n- \n\n## Tomorrow\'s priorities\n- \n\n## Gratitude\n- ' },
   { id: 4, name: 'Project Planning', content: '# Project Planning\n\n**Project:** \n**Deadline:** \n\n## Objectives\n- \n\n## Resources Needed\n- \n\n## Timeline\n- Week 1: \n- Week 2: \n\n## Risks & Mitigation\n- ' }
 ];
 
 const relatedShinnings = [
   { id: 1, title: 'Cognitive Load Theory', snippet: 'Understanding how our minds process information...' },
   { id: 2, title: 'Deep Work Principles', snippet: 'Cal Newport\'s approach to focused productivity...' },
   { id: 3, title: 'Design Thinking Process', snippet: 'Human-centered approach to innovation...' },
   { id: 4, title: 'Systems Thinking', snippet: 'Holistic approach to analysis...' }
 ];
 
 const linkableKeywords = ['cognitive load', 'deep work', 'design thinking', 'systems thinking'];

 // Initialize editing mode
 useEffect(() => {
   if (visible) {
     if (shinningToEdit) {
       setTitle(shinningToEdit.title || '');
       setContent(shinningToEdit.content || '');
     } else {
       setTitle('');
       setContent('');
     }
     
     // Auto-focus content input with slight delay to ensure modal is fully rendered
     setTimeout(() => {
       if (contentInputRef.current) {
         contentInputRef.current.focus();
       }
     }, 300);
   }
 }, [visible, shinningToEdit]);

 // Live title suggestion logic
 useEffect(() => {
   if (content.length > 30 && title.trim() === '') {
     // Simulate AI title suggestion
     const firstLine = content.split('\n')[0];
     const words = firstLine.split(' ').slice(0, 5).join(' ');
     setSuggestedTitle(words + (firstLine.length > words.length ? '...' : ''));
   } else {
     setSuggestedTitle('');
   }
 }, [content, title]);

 // Live link suggestion logic
 useEffect(() => {
   const checkForLinkableContent = () => {
     const lowerContent = content.toLowerCase();
     for (const keyword of linkableKeywords) {
       if (lowerContent.includes(keyword) && !lowerContent.includes(`[[${keyword}]]`)) {
         setLinkSuggestion({
           keyword,
           suggestion: `Link to existing Shinning [[${keyword.charAt(0).toUpperCase() + keyword.slice(1)}]]?`
         });
         return;
       }
     }
     setLinkSuggestion(null);
   };
   
   checkForLinkableContent();
 }, [content]);
 
 useEffect(() => {
  const keyboardWillShowListener = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
    (e) => setKeyboardHeight(e.endCoordinates.height)
  );
  
  const keyboardWillHideListener = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
    () => setKeyboardHeight(0)
  );

  return () => {
    keyboardWillShowListener?.remove();
    keyboardWillHideListener?.remove();
  };
}, []);

 // Template selection handler
 const handleTemplateSelect = useCallback((template) => {
   setContent(template.content);
   setIsTemplateModalVisible(false);
   // Re-focus content input after template selection
   setTimeout(() => {
     if (contentInputRef.current) {
       contentInputRef.current.focus();
     }
   }, 100);
 }, []);

 // Multi-modal input handlers
 const handleVoiceInput = useCallback(() => {
   console.log('Voice input activated');
   // TODO: Implement voice-to-text functionality
 }, []);

 const handleImageInput = useCallback(() => {
   console.log('Image/Photo input activated');
   // TODO: Implement image picker functionality
 }, []);

 const handleSketchInput = useCallback(() => {
   console.log('Sketchpad activated');
   // TODO: Implement sketch/drawing functionality
 }, []);

 // Related panel toggle
  const toggleRelatedPanel = useCallback(() => {
      // Dismiss keyboard when opening related panel
      if (!isRelatedPanelVisible) {
        Keyboard.dismiss();
      }
      
      const toValue = isRelatedPanelVisible ? width : 0;
      setIsRelatedPanelVisible(!isRelatedPanelVisible);
      
      Animated.timing(relatedPanelTranslateX, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [isRelatedPanelVisible, width]);

 // Zen mode toggle
 const toggleZenMode = useCallback(() => {
   const toValue = isZenMode ? 1 : 0;
   setIsZenMode(!isZenMode);
   
   Animated.timing(zenModeOpacity, {
     toValue,
     duration: 500,
     useNativeDriver: true,
   }).start();
 }, [isZenMode]);

 // Link suggestion handler
 const handleLinkSuggestion = useCallback((accept) => {
   if (accept && linkSuggestion) {
     const newContent = content.replace(
       new RegExp(linkSuggestion.keyword, 'gi'),
       `[[${linkSuggestion.keyword.charAt(0).toUpperCase() + linkSuggestion.keyword.slice(1)}]]`
     );
     setContent(newContent);
   }
   setLinkSuggestion(null);
 }, [content, linkSuggestion]);

 // Save handler
 const handleSave = useCallback(() => {
   console.log('Saving Shinning:', { title: title || suggestedTitle, content });
   // TODO: Implement actual save functionality
   onClose();
 }, [title, suggestedTitle, content, onClose]);

 const renderTemplateModal = () => (
      <Modal
        visible={isTemplateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTemplateModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setIsTemplateModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.templateModal}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.templateHeader}>
              <Text style={styles.templateTitle}>Choose Template</Text>
              <TouchableOpacity onPress={() => setIsTemplateModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.templateItem}
                  onPress={() => handleTemplateSelect(item)}
                >
                  <Text style={styles.templateName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );

 const renderLinkSuggestion = () => {
   if (!linkSuggestion) return null;
   
   return (
     <View style={styles.linkSuggestionContainer}>
       <Text style={styles.linkSuggestionText}>{linkSuggestion.suggestion}</Text>
       <View style={styles.linkSuggestionButtons}>
         <TouchableOpacity
           style={styles.linkAcceptButton}
           onPress={() => handleLinkSuggestion(true)}
         >
           <Text style={styles.linkButtonText}>Link</Text>
         </TouchableOpacity>
         <TouchableOpacity
           style={styles.linkDismissButton}
           onPress={() => handleLinkSuggestion(false)}
         >
           <Text style={styles.linkButtonText}>Dismiss</Text>
         </TouchableOpacity>
       </View>
     </View>
   );
 };

const renderRelatedPanel = () => (
  <Animated.View
    style={[
      styles.relatedPanel,
      { transform: [{ translateX: relatedPanelTranslateX }] }
    ]}
  >
    {/* Add overlay to close when tapping outside */}
    {isRelatedPanelVisible && (
      <TouchableOpacity
        style={styles.panelOverlay}
        onPress={toggleRelatedPanel}
        activeOpacity={1}
      />
    )}
    
    <View style={styles.relatedContent}>
        <SafeAreaView style={{ backgroundColor: 'white' }}>
          <View style={styles.relatedHeader}>
            <Text style={styles.relatedTitle}>Related Shinnings</Text>
            <TouchableOpacity onPress={toggleRelatedPanel}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
      </SafeAreaView>
      
      <FlatList
        data={relatedShinnings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.relatedItem}>
            <Text style={styles.relatedItemTitle}>{item.title}</Text>
            <Text style={styles.relatedItemSnippet}>{item.snippet}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  </Animated.View>
);

 const renderHeader = () => (
   <Animated.View style={[styles.header, { opacity: zenModeOpacity }]}>
     <TouchableOpacity style={styles.headerButton} onPress={onClose}>
       <Text style={styles.headerButtonText}>Cancel</Text>
     </TouchableOpacity>
     
     <Text style={styles.headerTitle}>
       {shinningToEdit ? 'Edit Shinning' : 'New Shinning'}
     </Text>
     
     <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
       <Text style={[styles.headerButtonText, styles.saveButtonText]}>Save</Text>
     </TouchableOpacity>
   </Animated.View>
 );

 if (!visible) return null;

return (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {renderHeader()}
      
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.editorContainer}>
          {/* Title Input */}
          <View style={styles.titleContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder={suggestedTitle || "Enter title..."}
              placeholderTextColor={suggestedTitle ? "#007AFF" : "#ADB5BD"}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              onSubmitEditing={() => contentInputRef.current?.focus()}
            />
          </View>
          
          {/* Main Content Input - Dynamic height based on keyboard */}
          <TextInput
            ref={contentInputRef}
            style={[
              styles.contentInput,
              {
                marginBottom: keyboardHeight > 0 ? 80 : 20,
              }
            ]}
            placeholder="Start writing your thoughts..."
            placeholderTextColor="#ADB5BD"
            value={content}
            onChangeText={setContent}
            multiline={true}
            textAlignVertical="top"
            autoFocus={true}
            blurOnSubmit={false}
          />
          
          {/* Link Suggestion Popup */}
          {renderLinkSuggestion()}
        </View>
        </TouchableWithoutFeedback>
        
        {/* Adaptive Toolbar */}
        <Animated.View 
          style={[
            styles.toolbar, 
            { 
              opacity: zenModeOpacity,
              bottom: keyboardHeight > 0 ? keyboardHeight - 34 : 0,
              position: 'absolute',
              left: 0,
              right: 0,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.toolbarButton} 
            onPress={() => {
              Keyboard.dismiss();
              setIsTemplateModalVisible(true);
            }}
          >
            <Text style={styles.toolbarButtonText}>📝</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleVoiceInput}>
            <Text style={styles.toolbarButtonText}>🎤</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleImageInput}>
            <Text style={styles.toolbarButtonText}>📷</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleSketchInput}>
            <Text style={styles.toolbarButtonText}>✏️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={toggleRelatedPanel}>
            <Text style={styles.toolbarButtonText}>💡</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={toggleZenMode}>
            <Text style={styles.toolbarButtonText}>🧘</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toolbarButton, { backgroundColor: '#007AFF' }]} 
            onPress={Keyboard.dismiss}
          >
            <Text style={[styles.toolbarButtonText, { color: 'white', fontSize: 16 }]}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* Template Modal */}
      {renderTemplateModal()}
      
      {/* Related Panel */}
      {renderRelatedPanel()}
      
      {/* Zen Mode Overlay */}
      {isZenMode && (
        <TouchableOpacity
          style={styles.zenModeOverlay}
          onPress={toggleZenMode}
          activeOpacity={1}
        />
      )}
    </SafeAreaView>
  </Modal>
 );
};

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#F8F9FA',
 },
 header: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
   paddingHorizontal: 16,
   paddingVertical: 12,
   borderBottomWidth: 1,
   borderBottomColor: '#E9ECEF',
   backgroundColor: 'white',
 },
 headerButton: {
   paddingHorizontal: 8,
   paddingVertical: 4,
 },
 headerButtonText: {
   fontSize: 16,
   color: '#007AFF',
 },
 saveButtonText: {
   fontWeight: '600',
 },
 headerTitle: {
   fontSize: 18,
   fontWeight: '600',
   color: '#212529',
 },
 editorContainer: {
   flex: 1,
   padding: 16,
 },
 titleContainer: {
   marginBottom: 16,
 },
 titleInput: {
   fontSize: 24,
   fontWeight: '600',
   color: '#212529',
   padding: 12,
   backgroundColor: 'white',
   borderRadius: 8,
   borderWidth: 1,
   borderColor: '#E9ECEF',
 },
 contentInput: {
   flex: 1,
   fontSize: 16,
   lineHeight: 24,
   color: '#212529',
   padding: 16,
   backgroundColor: 'white',
   borderRadius: 8,
   borderWidth: 1,
   borderColor: '#E9ECEF',
 },
 toolbar: {
   flexDirection: 'row',
   backgroundColor: 'white',
   paddingHorizontal: 16,
   paddingVertical: 8,
   borderTopWidth: 1,
   borderTopColor: '#E9ECEF',
   justifyContent: 'space-around',
 },
 toolbarButton: {
   padding: 8,
   borderRadius: 8,
   backgroundColor: '#F1F3F5',
 },
 toolbarButtonText: {
   fontSize: 20,
 },
 modalOverlay: {
   flex: 1,
   backgroundColor: 'rgba(0, 0, 0, 0.5)',
   justifyContent: 'flex-end',
 },
 templateModal: {
   backgroundColor: 'white',
   borderTopLeftRadius: 20,
   borderTopRightRadius: 20,
   maxHeight: height * 0.7,
 },
 templateHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   padding: 20,
   borderBottomWidth: 1,
   borderBottomColor: '#E9ECEF',
 },
 templateTitle: {
   fontSize: 20,
   fontWeight: '600',
   color: '#212529',
 },
 closeButton: {
   fontSize: 18,
   color: '#6C757D',
 },
 templateItem: {
   padding: 20,
   borderBottomWidth: 1,
   borderBottomColor: '#F1F3F5',
 },
 templateName: {
   fontSize: 16,
   fontWeight: '500',
   color: '#212529',
 },
 linkSuggestionContainer: {
   position: 'absolute',
   bottom: 100,
   left: 16,
   right: 16,
   backgroundColor: '#007AFF',
   borderRadius: 12,
   padding: 12,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 4 },
   shadowOpacity: 0.15,
   shadowRadius: 8,
   elevation: 8,
 },
 linkSuggestionText: {
   color: 'white',
   fontSize: 14,
   marginBottom: 8,
 },
 linkSuggestionButtons: {
   flexDirection: 'row',
   justifyContent: 'flex-end',
 },
 linkAcceptButton: {
   backgroundColor: 'white',
   paddingHorizontal: 16,
   paddingVertical: 6,
   borderRadius: 6,
   marginRight: 8,
 },
 linkDismissButton: {
   backgroundColor: 'transparent',
   paddingHorizontal: 16,
   paddingVertical: 6,
   borderRadius: 6,
   borderWidth: 1,
   borderColor: 'white',
 },
 linkButtonText: {
   fontSize: 14,
   fontWeight: '500',
   color: '#007AFF',
 },
 relatedPanel: {
   position: 'absolute',
   right: 0,
   top: 0,
   bottom: 0,
   width: width * 0.8,
   backgroundColor: 'white',
   shadowColor: '#000',
   shadowOffset: { width: -2, height: 0 },
   shadowOpacity: 0.15,
   shadowRadius: 8,
   elevation: 8,
   zIndex: 1000,
 },
 relatedHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   paddingHorizontal: 20,
   paddingVertical: 16,
   borderBottomWidth: 1,
   borderBottomColor: '#E9ECEF',
 },
 relatedTitle: {
   fontSize: 18,
   fontWeight: '600',
   color: '#212529',
 },
 relatedItem: {
   padding: 16,
   borderBottomWidth: 1,
   borderBottomColor: '#F1F3F5',
 },
 relatedItemTitle: {
   fontSize: 16,
   fontWeight: '500',
   color: '#212529',
   marginBottom: 4,
 },
 relatedItemSnippet: {
   fontSize: 14,
   color: '#6C757D',
   lineHeight: 20,
 },
 zenModeOverlay: {
   position: 'absolute',
   top: 0,
   left: 0,
   right: 0,
   bottom: 0,
 },
 panelOverlay: {
   position: 'absolute',
   top: 0,
   left: -width,
   right: 0,
   bottom: 0,
   backgroundColor: 'rgba(0, 0, 0, 0.3)',
   zIndex: 999,
 },
 relatedContent: {
   flex: 1,
   backgroundColor: 'white',
   zIndex: 1001,
 },
});

export default ShinningEditorScreen;