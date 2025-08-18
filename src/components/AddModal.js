// src/components/AddModal.js - CORRECTED

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  TouchableWithoutFeedback, Keyboard, ScrollView, SafeAreaView
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import firebaseService from '../services/firebaseService';

const AddModal = ({ visible, onClose, shinningToEdit }) => {
  const { state, actions } = useAppContext();
  const { user } = state;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (shinningToEdit) {
      setTitle(shinningToEdit.title);
      setContent(shinningToEdit.content);
      setTags(shinningToEdit.tags?.join(', ') || '');
    } else {
      setTitle('');
      setContent('');
      setTags('');
    }
  }, [shinningToEdit, visible]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content cannot be empty.');
      return;
    }
    setLoading(true);
    const shinningData = { title, content, tags: tags.split(',').map(tag => tag.trim()).filter(Boolean), type: 'text' };
    try {
      if (shinningToEdit) {
        await firebaseService.updateShinning(user.uid, shinningToEdit.id, shinningData);
        actions.showToast('Shinning updated successfully!');
      } else {
        await firebaseService.addShinning(user.uid, shinningData);
        actions.showToast('Shinning added successfully!');
      }
      onClose();
    } catch (error) {
      console.error('Failed to save shinning:', error);
      actions.showToast('Failed to save, please try again.', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!content.trim()) {
      actions.showToast('Please add some content first to get suggestions.', 'ERROR');
      return;
    }
    setIsAiLoading(true);
    try {
      const suggestedTags = await firebaseService.getAiSuggestedTags(content);
      if (suggestedTags && suggestedTags.length > 0) {
        const existingTags = new Set(tags.split(',').map(t => t.trim()).filter(Boolean));
        suggestedTags.forEach(tag => existingTags.add(tag));
        setTags(Array.from(existingTags).join(', '));
      } else {
        actions.showToast('No new tag suggestions found.');
      }
    } catch (error) {
      actions.showToast(error.message, 'ERROR');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
      <SafeAreaView style={{flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}> 
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}><Text style={styles.headerButtonText}>Cancel</Text></TouchableOpacity>
            <Text style={styles.headerTitle}>{shinningToEdit ? 'Edit Shinning' : 'Add New Shinning'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>{loading ? <ActivityIndicator /> : <Text style={styles.headerButtonText}>Save</Text>}</TouchableOpacity>
          </View>

          {/* --- WRAP form in dismissible components --- */}
            <ScrollView contentContainerStyle={styles.form}>
              <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} placeholderTextColor="#ADB5BD" />
              <TextInput style={[styles.input, styles.contentInput]} placeholder="Content" value={content} onChangeText={setContent} multiline placeholderTextColor="#ADB5BD" />
              <View style={styles.tagsInputContainer}>
                <TextInput style={styles.tagsInput} placeholder="Tags (comma-separated)" value={tags} onChangeText={setTags} placeholderTextColor="#ADB5BD" />
                <TouchableOpacity style={styles.aiButton} onPress={handleSuggestTags} disabled={isAiLoading}>
                  {isAiLoading ? <ActivityIndicator size="small" color="#007AFF" /> : <Text style={styles.aiButtonText}>✨</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E9ECEF', backgroundColor: 'white' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#212529' },
    headerButtonText: { fontSize: 16, color: '#007AFF' },
    form: { padding: 20 },
    input: { width: '100%', borderWidth: 1, borderColor: '#DEE2E6', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 16, backgroundColor: 'white', color: '#212529' },
    contentInput: { height: 200, textAlignVertical: 'top' },
    tagsInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DEE2E6', borderRadius: 8, backgroundColor: 'white' },
    tagsInput: { flex: 1, padding: 15, fontSize: 16, color: '#212529' },
    aiButton: { paddingHorizontal: 15, height: '100%', justifyContent: 'center', alignItems: 'center' },
    aiButtonText: { fontSize: 20 },
});

export default AddModal;