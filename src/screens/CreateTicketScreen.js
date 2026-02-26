// src/screens/CreateTicketScreen.js
// Create Ticket Screen with File Upload Support

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { createTicket, getHelpTopics, uploadAttachment } from '../api/osticket';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { APP_CONFIG, VALIDATION } from '../api/config';

const CreateTicketScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [helpTopics, setHelpTopics] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 3, // Normal
    topicId: null,
    name: '',
    email: '',
    phone: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadHelpTopics();
    requestPermissions();
  }, []);

  // Request camera and media library permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus.status !== 'granted' || mediaStatus.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and media library permissions are needed to attach photos.'
        );
      }
    }
  };

  // Load help topics from API
  const loadHelpTopics = async () => {
    const result = await getHelpTopics();
    if (result.success) {
      setHelpTopics(result.data);
      if (result.data.length > 0) {
        setFormData(prev => ({ ...prev, topicId: result.data[0].id }));
      }
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length < VALIDATION.subject.minLength) {
      newErrors.subject = VALIDATION.subject.message;
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < VALIDATION.message.minLength) {
      newErrors.message = VALIDATION.message.message;
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!VALIDATION.email.pattern.test(formData.email)) {
      newErrors.email = VALIDATION.email.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file picker
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        if (result.size > APP_CONFIG.maxFileSize) {
          Alert.alert('Error', 'File size exceeds 10MB limit');
          return;
        }

        setAttachments([...attachments, {
          uri: result.uri,
          name: result.name,
          type: result.mimeType,
          size: result.size,
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  // Handle image picker (camera or gallery)
  const pickImage = async (useCamera = false) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
          });

      if (!result.canceled) {
        const newAttachments = result.assets.map(asset => ({
          uri: asset.uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
        }));

        setAttachments([...attachments, ...newAttachments]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Show attachment options
  const showAttachmentOptions = () => {
    Alert.alert(
      'Add Attachment',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => pickImage(true) },
        { text: 'Choose from Gallery', onPress: () => pickImage(false) },
        { text: 'Choose File', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setLoading(true);

    try {
      // Create ticket
      const result = await createTicket({
        ...formData,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      if (result.success) {
        // Upload attachments if any (failures won't block ticket creation)
        if (attachments.length > 0) {
          for (const file of attachments) {
            try {
              await uploadAttachment(result.ticketId, file);
            } catch (error) {
              console.warn('Failed to upload attachment:', error);
              // Continue with other attachments even if one fails
            }
          }
        }

        Alert.alert(
          'Success',
          `Ticket #${result.ticketId} created successfully!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Ticket</Text>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Your full name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            editable={!loading}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="your.email@example.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Phone Input (Optional) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Your phone number (optional)"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Help Topic Picker */}
        {helpTopics.length > 0 && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              {/* Note: Replace with proper Picker component */}
              <Text style={styles.pickerText}>
                {helpTopics.find(t => t.id === formData.topicId)?.topic || 'Select category'}
              </Text>
            </View>
          </View>
        )}

        {/* Priority Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityButtons}>
            {[
              { value: 4, label: 'Low', color: '#388e3c' },
              { value: 3, label: 'Normal', color: '#1976d2' },
              { value: 2, label: 'Urgent', color: '#f57c00' },
              { value: 1, label: 'Emergency', color: '#d32f2f' },
            ].map((priority) => (
              <TouchableOpacity
                key={priority.value}
                style={[
                  styles.priorityButton,
                  formData.priority === priority.value && {
                    backgroundColor: priority.color,
                  },
                ]}
                onPress={() => setFormData({ ...formData, priority: priority.value })}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    formData.priority === priority.value && styles.priorityButtonTextActive,
                  ]}
                >
                  {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={[styles.input, errors.subject && styles.inputError]}
            placeholder="Brief description of the issue"
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
            editable={!loading}
          />
          {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
        </View>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.textArea, errors.message && styles.inputError]}
            placeholder="Describe your issue in detail..."
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!loading}
          />
          {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
        </View>

        {/* Attachments */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Attachments</Text>
          
          {attachments.map((file, index) => (
            <View key={index} style={styles.attachmentItem}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {file.name}
              </Text>
              <TouchableOpacity
                onPress={() => removeAttachment(index)}
                disabled={loading}
              >
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.attachButton}
            onPress={showAttachmentOptions}
            disabled={loading}
          >
            <Text style={styles.attachButtonText}>+ Add Attachment</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Ticket</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  attachButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 12,
    alignItems: 'center',
  },
  attachButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#90caf9',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateTicketScreen;