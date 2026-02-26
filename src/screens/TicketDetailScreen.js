// src/screens/TicketDetailScreen.js
// Enhanced version with Edit, Delete, and Reply Thread functionality

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS } from '../api/config';
import { deleteTicket, getTicket, getTicketReplies, replyToTicket } from '../api/osticket';

const TicketDetailScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reply thread state
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const scrollViewRef = useRef(null);

  // Load current user data from storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('userData');
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadTicketDetails();
  }, []);

  // Refresh replies when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReplies();
    }, [ticketId])
  );

  const loadTicketDetails = async () => {
    setLoading(true);
    const result = await getTicket(ticketId);

    if (result.success) {
      setTicket(result.data);
    } else {
      Alert.alert('Error', result.error || 'Failed to load ticket details');
    }
    setLoading(false);
  };

  const loadReplies = async () => {
    setRepliesLoading(true);
    const result = await getTicketReplies(ticketId);

    if (result.success) {
      setReplies(result.data);
    } else {
      // Don't alert — just show empty state; endpoint may not exist yet
      setReplies([]);
    }
    setRepliesLoading(false);
  };

  const handleSendReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setSending(true);
    const result = await replyToTicket(ticketId, trimmed);

    if (result.success) {
      setReplyText('');
      // Add the reply optimistically to the list
      const newReply = {
        id: Date.now(),
        message: trimmed,
        user_name: currentUser?.name || 'You',
        user_id: currentUser?.id,
        created: new Date().toISOString(),
        is_own: true,
      };
      setReplies((prev) => [...prev, newReply]);

      // Scroll to bottom after a short delay
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);

      // Also refresh from server to get accurate data
      setTimeout(() => loadReplies(), 1500);
    } else {
      Alert.alert('Error', result.error || 'Failed to send reply');
    }
    setSending(false);
  };

  // Handle Edit
  const handleEdit = () => {
    navigation.navigate('EditTicket', { ticketId: ticketId });
  };

  // Handle Delete
  const handleDelete = () => {
    Alert.alert(
      'Delete Ticket',
      'Are you sure you want to delete this ticket? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);

    const result = await deleteTicket(ticketId);

    if (result.success) {
      Alert.alert(
        'Success',
        'Ticket deleted successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to delete ticket');
      setDeleting(false);
    }
  };

  // Determine if a reply is from the current user
  const isOwnReply = (reply) => {
    if (reply.is_own) return true;
    if (currentUser?.id && reply.user_id) {
      return String(currentUser.id) === String(reply.user_id);
    }
    if (currentUser?.email && reply.user_email) {
      return currentUser.email === reply.user_email;
    }
    return false;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading ticket...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ticket not found</Text>
      </View>
    );
  }

  const displayTicket = {
    number: ticket.number || `#${ticket.ticket_id ?? ticketId}`,
    subject: ticket.subject || 'No subject',
    status: ticket.status ?? ticket.status_state ?? 'open',
    priority: ticket.priority_id ?? ticket.priority ?? 2,
    created: ticket.created || new Date().toISOString(),
    user_name: ticket.user_name || 'User',
    user_email: ticket.user_email || '',
    message: ticket.message || '',
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.ticketNumber}>{displayTicket.number}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[displayTicket.status] }]}>
                <Text style={styles.badgeText}>{displayTicket.status.toUpperCase()}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[displayTicket.priority] }]}>
                <Text style={styles.badgeText}>
                  {PRIORITY_LABELS[displayTicket.priority] || 'Normal'}
                </Text>
              </View>
            </View>
          </View>

          {/* Subject */}
          <Text style={styles.subject}>{displayTicket.subject}</Text>

          {/* Metadata */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Created:</Text>
              <Text style={styles.metadataValue}>
                {new Date(displayTicket.created).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>From:</Text>
              <Text style={styles.metadataValue}>{displayTicket.user_name}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Email:</Text>
              <Text style={styles.metadataValue}>{displayTicket.user_email}</Text>
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{displayTicket.message}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              disabled={deleting}
            >
              <Text style={styles.editButtonText}>✏️ Edit Ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>🗑️ Delete Ticket</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ==================== REPLY THREAD ==================== */}
          <View style={styles.replySection}>
            <View style={styles.replySectionHeader}>
              <Text style={styles.replySectionTitle}>💬 Replies</Text>
              <TouchableOpacity onPress={loadReplies} style={styles.refreshBtn}>
                <Text style={styles.refreshBtnText}>↻ Refresh</Text>
              </TouchableOpacity>
            </View>

            {repliesLoading ? (
              <View style={styles.repliesLoadingContainer}>
                <ActivityIndicator size="small" color="#1976d2" />
                <Text style={styles.repliesLoadingText}>Loading replies...</Text>
              </View>
            ) : replies.length === 0 ? (
              <View style={styles.emptyReplies}>
                <Text style={styles.emptyRepliesIcon}>💬</Text>
                <Text style={styles.emptyRepliesText}>No replies yet</Text>
                <Text style={styles.emptyRepliesSubtext}>Start the conversation below</Text>
              </View>
            ) : (
              <View style={styles.repliesList}>
                {replies.map((reply, index) => {
                  const own = isOwnReply(reply);
                  return (
                    <View
                      key={reply.id || index}
                      style={[
                        styles.replyBubbleRow,
                        own ? styles.replyBubbleRowRight : styles.replyBubbleRowLeft,
                      ]}
                    >
                      <View
                        style={[
                          styles.replyBubble,
                          own ? styles.replyBubbleOwn : styles.replyBubbleOther,
                        ]}
                      >
                        {!own && (
                          <Text style={styles.replySenderName}>
                            {reply.user_name || reply.name || 'Agent'}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.replyMessageText,
                            own ? styles.replyMessageTextOwn : styles.replyMessageTextOther,
                          ]}
                        >
                          {reply.message || reply.body || reply.text || ''}
                        </Text>
                        <Text
                          style={[
                            styles.replyTime,
                            own ? styles.replyTimeOwn : styles.replyTimeOther,
                          ]}
                        >
                          {formatTime(reply.created || reply.created_at || reply.timestamp)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Reply Input Bar - Fixed at bottom */}
      <View style={styles.replyInputBar}>
        <TextInput
          style={styles.replyInput}
          placeholder="Type a reply..."
          placeholderTextColor="#999"
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={5000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!replyText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendReply}
          disabled={!replyText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  subject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metadataContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  metadataValue: {
    fontSize: 14,
    color: '#333',
  },
  messageContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  actionButtons: {
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#ef5350',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ==================== REPLY THREAD STYLES ====================
  replySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  replySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  replySectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
  },
  refreshBtnText: {
    color: '#1976d2',
    fontSize: 13,
    fontWeight: '600',
  },
  repliesLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  repliesLoadingText: {
    color: '#888',
    fontSize: 14,
  },
  emptyReplies: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyRepliesIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyRepliesText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '600',
  },
  emptyRepliesSubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 4,
  },
  repliesList: {
    gap: 10,
  },
  replyBubbleRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  replyBubbleRowRight: {
    justifyContent: 'flex-end',
  },
  replyBubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  replyBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  replyBubbleOwn: {
    backgroundColor: '#1976d2',
    borderBottomRightRadius: 4,
  },
  replyBubbleOther: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  replySenderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 3,
  },
  replyMessageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  replyMessageTextOwn: {
    color: '#fff',
  },
  replyMessageTextOther: {
    color: '#333',
  },
  replyTime: {
    fontSize: 11,
    marginTop: 4,
  },
  replyTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  replyTimeOther: {
    color: '#999',
  },

  // ==================== REPLY INPUT BAR ====================
  replyInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#1976d2',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default TicketDetailScreen;