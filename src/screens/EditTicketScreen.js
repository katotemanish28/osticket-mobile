// src/screens/EditTicketScreen.js
// Screen for editing an existing ticket

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { VALIDATION } from '../api/config';
import { getTicket, updateTicket } from '../api/osticket';
import { useThemeContext } from '../context/ThemeContext';

const EditTicketScreen = ({ route, navigation }) => {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const styles = createStyles(isDark);
  const { ticketId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 3,
    status: 'open',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadTicketData();
  }, []);

  // Load existing ticket data
  const loadTicketData = async () => {
    setLoading(true);
    const result = await getTicket(ticketId);

    if (result.success) {
      setFormData({
        subject: result.data.subject || '',
        message: result.data.message || '',
        priority: result.data.priority_id || 3,
        status: result.data.status || 'open',
      });
    } else {
      Alert.alert('Error', 'Failed to load ticket data');
    }
    setLoading(false);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length < VALIDATION.subject.minLength) {
      newErrors.subject = VALIDATION.subject.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setSaving(true);

    try {
      const result = await updateTicket(ticketId, {
        subject: formData.subject.trim(),
        priority: formData.priority,
      });

      if (result.success) {
        Alert.alert(
          'Success',
          'Ticket updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update ticket');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading ticket...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Edit Ticket</Text>
        <Text style={styles.subtitle}>Ticket #{ticketId}</Text>

        {/* Subject Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={[styles.input, errors.subject && styles.inputError]}
            placeholder="Brief description of the issue"
            placeholderTextColor={isDark ? "#aaa" : "#999"}
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
            editable={!saving}
          />
          {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
        </View>

        {/* Priority Selector */}
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
                disabled={saving}
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

        {/* Note about limitations */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            ℹ️ Note: Only subject and priority can be modified. To add new information,
            reply to the ticket instead.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#121212' : '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: isDark ? '#aaa' : '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#eee' : '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: isDark ? '#aaa' : '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#eee' : '#333',
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
  noteContainer: {
    backgroundColor: isDark ? '#1b3a57' : '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 13,
    color: isDark ? '#90caf9' : '#1976d2',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: isDark ? '#90caf9' : '#1976d2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: isDark ? '#555' : '#90caf9',
  },
  saveButtonText: {
    color: isDark ? '#121212' : '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  cancelButtonText: {
    color: isDark ? '#aaa' : '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditTicketScreen;