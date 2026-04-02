// src/screens/CreateTicketScreen.js
// Create Ticket Screen with File Upload Support

import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_CONFIG, VALIDATION } from '../api/config';
import { createTicket, getAgents, getDepartments, getHelpTopics, getSlaPlans, getTicketSources, uploadAttachment } from '../api/osticket';
import { useThemeContext } from '../context/ThemeContext';

const CreateTicketScreen = ({ navigation }) => {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const styles = createStyles(isDark);
  const [loading, setLoading] = useState(false);
  const [helpTopics, setHelpTopics] = useState([]);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 2, // Normal
    topicId: null,
    ticketSource: 'Phone',
    departmentId: null,
    slaPlanId: null,
    dueDate: '',
    assignTo: null,
    name: '',
    email: '',
    phone: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showSlaDropdown, setShowSlaDropdown] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [agents, setAgents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [slaPlans, setSlaPlans] = useState([]);
  const [ticketSources, setTicketSources] = useState([]);

  useEffect(() => {
    loadUser();
    loadFormOptions();
    requestPermissions();
  }, []);

  const loadAgents = async () => {
    const result = await getAgents();
    if (result.success) {
      setAgents(result.data);
    }
  };

  // Load user data to check for admin role
  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUserData(parsedUser);
        if (parsedUser.role === 'admin') {
          loadAgents();
        }
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
  };

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

  // Load form options from API
  const loadFormOptions = async () => {
    const [topicsRes, deptsRes, slasRes, sourcesRes] = await Promise.all([
      getHelpTopics(),
      getDepartments(),
      getSlaPlans(),
      getTicketSources()
    ]);
    if (topicsRes.success) setHelpTopics(topicsRes.data);
    if (deptsRes.success) setDepartments(deptsRes.data);
    if (slasRes.success) setSlaPlans(slasRes.data);
    if (sourcesRes.success) setTicketSources(sourcesRes.data);
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
            placeholderTextColor={isDark ? "#aaa" : "#999"}
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
            placeholderTextColor={isDark ? "#aaa" : "#999"}
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
            placeholderTextColor={isDark ? "#aaa" : "#999"}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Help Topic Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Help Topic *</Text>
          <TouchableOpacity
            style={[
              styles.pickerContainer,
              showTopicDropdown && styles.pickerContainerOpen
            ]}
            onPress={() => setShowTopicDropdown(!showTopicDropdown)}
            disabled={loading}
          >
            <Text style={styles.pickerText}>
              {formData.topicId ? helpTopics.find(t => t.id === formData.topicId)?.topic || formData.topicId : '— Select Help Topic —'}
            </Text>
          </TouchableOpacity>
          {showTopicDropdown && (
            <View style={styles.dropdownContainer}>
              {helpTopics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, topicId: topic.id });
                    setShowTopicDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{topic.topic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Ticket Source Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ticket Source *</Text>
          <TouchableOpacity
            style={[
              styles.pickerContainer,
              showSourceDropdown && styles.pickerContainerOpen
            ]}
            onPress={() => setShowSourceDropdown(!showSourceDropdown)}
            disabled={loading}
          >
            <Text style={styles.pickerText}>
              {formData.ticketSource || '— Select Source —'}
            </Text>
          </TouchableOpacity>

          {showSourceDropdown && (
            <View style={styles.dropdownContainer}>
              {ticketSources.map((source) => (
                <TouchableOpacity
                  key={source.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, ticketSource: source.name });
                    setShowSourceDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{source.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Department Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Department</Text>
          <TouchableOpacity
            style={[
              styles.pickerContainer,
              showDeptDropdown && styles.pickerContainerOpen
            ]}
            onPress={() => setShowDeptDropdown(!showDeptDropdown)}
            disabled={loading}
          >
            <Text style={styles.pickerText}>
              {formData.departmentId ? departments.find(d => d.id === formData.departmentId)?.name || formData.departmentId : '— Select Department —'}
            </Text>
          </TouchableOpacity>
          {showDeptDropdown && (
            <View style={styles.dropdownContainer}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, departmentId: dept.id });
                    setShowDeptDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{dept.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* SLA Plan Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>SLA Plan</Text>
          <TouchableOpacity
            style={[
              styles.pickerContainer,
              showSlaDropdown && styles.pickerContainerOpen
            ]}
            onPress={() => setShowSlaDropdown(!showSlaDropdown)}
            disabled={loading}
          >
            <Text style={styles.pickerText}>
              {formData.slaPlanId ? slaPlans.find(s => s.id === formData.slaPlanId)?.name || formData.slaPlanId : '— System Default —'}
            </Text>
          </TouchableOpacity>
          {showSlaDropdown && (
            <View style={styles.dropdownContainer}>
              {slaPlans.map((sla) => (
                <TouchableOpacity
                  key={sla.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, slaPlanId: sla.id });
                    setShowSlaDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{sla.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Due Date Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
          >
            <Text style={styles.pickerText}>
              {formData.dueDate || 'YYYY-MM-DD'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.dueDate ? new Date(formData.dueDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (event.type === 'set' && selectedDate) {
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  setFormData({ ...formData, dueDate: dateStr });
                } else if (event.type === 'dismissed') {
                  setShowDatePicker(false);
                }
              }}
            />
          )}
        </View>

        {/* Assign To (Admin Only) */}
        {userData?.role === 'admin' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Assign To (Admin Only)</Text>
            <TouchableOpacity
              style={[
                styles.pickerContainer,
                showAssignDropdown && styles.pickerContainerOpen
              ]}
              onPress={() => setShowAssignDropdown(!showAssignDropdown)}
              disabled={loading}
            >
              <Text style={styles.pickerText}>
                {formData.assignTo ? agents.find(a => a.id === formData.assignTo)?.name : '— Select an Agent OR a Team —'}
              </Text>
            </TouchableOpacity>
            {showAssignDropdown && (
              <View style={styles.dropdownContainer}>
                {agents.length > 0 ? agents.map((agent) => (
                  <TouchableOpacity
                    key={agent.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFormData({ ...formData, assignTo: agent.id });
                      setShowAssignDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{agent.name}</Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={[styles.dropdownItemText, { padding: 12 }]}>No agents available</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Priority Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityButtons}>
            {[
              { value: 1, label: 'Low', color: '#388e3c' },
              { value: 2, label: 'Normal', color: '#1976d2' },
              { value: 3, label: 'High', color: '#f57c00' },
              { value: 4, label: 'Emergency', color: '#d32f2f' },
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
            placeholderTextColor={isDark ? "#aaa" : "#999"}
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
            placeholderTextColor={isDark ? "#aaa" : "#999"}
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

const createStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#eee' : '#333',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#ddd' : '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: isDark ? '#eee' : '#333',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: isDark ? '#ff5252' : '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: isDark ? '#eee' : '#333',
    minHeight: 120,
  },
  pickerContainer: {
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: isDark ? '#eee' : '#333',
  },
  pickerContainerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownContainer: {
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: isDark ? '#eee' : '#333',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 12,
    color: isDark ? '#aaa' : '#666',
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: isDark ? '#eee' : '#333',
  },
  removeButton: {
    color: isDark ? '#ff5252' : '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  attachButton: {
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#90caf9' : '#1976d2',
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 12,
    alignItems: 'center',
  },
  attachButtonText: {
    color: isDark ? '#90caf9' : '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: isDark ? '#90caf9' : '#1976d2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: isDark ? '#555' : '#90caf9',
  },
  submitButtonText: {
    color: isDark ? '#121212' : '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateTicketScreen;