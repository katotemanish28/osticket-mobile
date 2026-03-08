// src/screens/AdminTicketDetailScreen.js
// Admin view of a ticket with reply thread

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
import { API_BASE_URL, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS } from '../api/config';
import { useThemeContext } from '../context/ThemeContext';

const AdminTicketDetailScreen = ({ route, navigation }) => {
    const { theme } = useThemeContext();
    const isDark = theme === 'dark';
    const styles = createStyles(isDark);
    const { ticketId } = route.params;

    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState(null);

    // Reply thread state
    const [replies, setReplies] = useState([]);
    const [repliesLoading, setRepliesLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    const scrollViewRef = useRef(null);

    const getToken = async () => AsyncStorage.getItem('authToken');

    useEffect(() => {
        loadTicketDetails();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadReplies();
        }, [ticketId])
    );

    const loadTicketDetails = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await response.json();
            if (json.success) {
                setTicket(json.data);
            } else {
                Alert.alert('Error', json.message || 'Failed to load ticket');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error');
        }
        setLoading(false);
    };

    const loadReplies = async () => {
        setRepliesLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await response.json();
            if (json.success) {
                setReplies(json.messages || []);
            } else {
                setReplies([]);
            }
        } catch (e) {
            setReplies([]);
        }
        setRepliesLoading(false);
    };

    const handleSendReply = async () => {
        const trimmed = replyText.trim();
        if (!trimmed) return;

        setSending(true);
        try {
            const token = await getToken();
            const response = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: trimmed }),
            });
            const json = await response.json();

            if (json.success) {
                setReplyText('');
                // Add optimistically
                const newReply = {
                    id: Date.now(),
                    message: trimmed,
                    user_name: json.data?.user_name || 'Admin',
                    is_own: true,
                    is_staff: true,
                    created: new Date().toISOString(),
                };
                setReplies((prev) => [...prev, newReply]);

                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 200);

                setTimeout(() => loadReplies(), 1500);
            } else {
                Alert.alert('Error', json.message || 'Failed to send reply');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error');
        }
        setSending(false);
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
                <ActivityIndicator size="large" color="#e65100" />
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
                            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[displayTicket.status] || '#1976d2' }]}>
                                <Text style={styles.badgeText}>{displayTicket.status.toUpperCase()}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[displayTicket.priority] || '#1976d2' }]}>
                                <Text style={styles.badgeText}>
                                    {PRIORITY_LABELS[displayTicket.priority] || 'Normal'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Subject */}
                    <Text style={styles.subject}>{displayTicket.subject}</Text>

                    {/* User Info */}
                    <View style={styles.metadataContainer}>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Created:</Text>
                            <Text style={styles.metadataValue}>
                                {new Date(displayTicket.created).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>User:</Text>
                            <Text style={styles.metadataValue}>{displayTicket.user_name}</Text>
                        </View>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Email:</Text>
                            <Text style={styles.metadataValue}>{displayTicket.user_email}</Text>
                        </View>
                    </View>

                    {/* Original Message */}
                    <View style={styles.messageContainer}>
                        <Text style={styles.messageLabel}>Original Message:</Text>
                        <Text style={styles.messageText}>{displayTicket.message}</Text>
                    </View>

                    {/* Reply Thread */}
                    <View style={styles.replySection}>
                        <View style={styles.replySectionHeader}>
                            <Text style={styles.replySectionTitle}>💬 Conversation</Text>
                            <TouchableOpacity onPress={loadReplies} style={styles.refreshBtn}>
                                <Text style={styles.refreshBtnText}>↻ Refresh</Text>
                            </TouchableOpacity>
                        </View>

                        {repliesLoading ? (
                            <View style={styles.repliesLoadingContainer}>
                                <ActivityIndicator size="small" color="#e65100" />
                                <Text style={styles.repliesLoadingText}>Loading messages...</Text>
                            </View>
                        ) : replies.length === 0 ? (
                            <View style={styles.emptyReplies}>
                                <Text style={styles.emptyRepliesIcon}>💬</Text>
                                <Text style={styles.emptyRepliesText}>No replies yet</Text>
                                <Text style={styles.emptyRepliesSubtext}>Reply to this ticket below</Text>
                            </View>
                        ) : (
                            <View style={styles.repliesList}>
                                {replies.map((reply, index) => {
                                    const isStaff = reply.is_staff || reply.is_own;
                                    return (
                                        <View
                                            key={reply.id || index}
                                            style={[
                                                styles.replyBubbleRow,
                                                isStaff ? styles.replyBubbleRowRight : styles.replyBubbleRowLeft,
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.replyBubble,
                                                    isStaff ? styles.replyBubbleStaff : styles.replyBubbleUser,
                                                ]}
                                            >
                                                <Text style={[styles.replySenderName, isStaff ? styles.staffName : styles.userName]}>
                                                    {reply.user_name || (isStaff ? 'Admin' : 'User')}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.replyMessageText,
                                                        isStaff ? styles.replyMessageTextStaff : styles.replyMessageTextUser,
                                                    ]}
                                                >
                                                    {reply.message || reply.body || ''}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.replyTime,
                                                        isStaff ? styles.replyTimeStaff : styles.replyTimeUser,
                                                    ]}
                                                >
                                                    {formatTime(reply.created || reply.created_at)}
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

            {/* Reply Input Bar */}
            <View style={styles.replyInputBar}>
                <TextInput
                    style={styles.replyInput}
                    placeholder="Reply as admin..."
                    placeholderTextColor={isDark ? "#aaa" : "#999"}
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

const createStyles = (isDark) => StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f5f5f5' },
    scrollContent: { paddingBottom: 16 },
    content: { padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#f5f5f5' },
    loadingText: { marginTop: 12, fontSize: 16, color: isDark ? '#aaa' : '#666' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#f5f5f5' },
    errorText: { fontSize: 16, color: '#d32f2f' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    ticketNumber: { fontSize: 18, fontWeight: 'bold', color: '#e65100' },
    badges: { flexDirection: 'row', gap: 8 },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    subject: { fontSize: 20, fontWeight: 'bold', color: isDark ? '#eee' : '#333', marginBottom: 16 },
    metadataContainer: { backgroundColor: isDark ? '#1e1e1e' : '#fff', borderRadius: 8, padding: 16, marginBottom: 16 },
    metadataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    metadataLabel: { fontSize: 14, color: isDark ? '#aaa' : '#666', fontWeight: '600' },
    metadataValue: { fontSize: 14, color: isDark ? '#eee' : '#333' },
    messageContainer: { backgroundColor: isDark ? '#1e1e1e' : '#fff', borderRadius: 8, padding: 16, marginBottom: 16 },
    messageLabel: { fontSize: 14, fontWeight: '600', color: isDark ? '#aaa' : '#666', marginBottom: 8 },
    messageText: { fontSize: 15, color: isDark ? '#eee' : '#333', lineHeight: 22 },

    // Reply Section
    replySection: { backgroundColor: isDark ? '#1e1e1e' : '#fff', borderRadius: 12, padding: 16, marginBottom: 8 },
    replySectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#eee', paddingBottom: 12 },
    replySectionTitle: { fontSize: 17, fontWeight: 'bold', color: isDark ? '#eee' : '#333' },
    refreshBtn: { paddingVertical: 4, paddingHorizontal: 10, backgroundColor: isDark ? '#4e342e' : '#fff3e0', borderRadius: 16 },
    refreshBtnText: { color: isDark ? '#ffcc80' : '#e65100', fontSize: 13, fontWeight: '600' },
    repliesLoadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 8 },
    repliesLoadingText: { color: isDark ? '#aaa' : '#888', fontSize: 14 },
    emptyReplies: { alignItems: 'center', paddingVertical: 24 },
    emptyRepliesIcon: { fontSize: 32, marginBottom: 8 },
    emptyRepliesText: { fontSize: 15, color: isDark ? '#888' : '#999', fontWeight: '600' },
    emptyRepliesSubtext: { fontSize: 13, color: isDark ? '#aaa' : '#bbb', marginTop: 4 },
    repliesList: { gap: 10 },
    replyBubbleRow: { flexDirection: 'row', marginBottom: 2 },
    replyBubbleRowRight: { justifyContent: 'flex-end' },
    replyBubbleRowLeft: { justifyContent: 'flex-start' },
    replyBubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    replyBubbleStaff: { backgroundColor: '#e65100', borderBottomRightRadius: 4 },
    replyBubbleUser: { backgroundColor: isDark ? '#333' : '#f0f0f0', borderBottomLeftRadius: 4 },
    replySenderName: { fontSize: 12, fontWeight: 'bold', marginBottom: 3 },
    staffName: { color: 'rgba(255,255,255,0.8)' },
    userName: { color: isDark ? '#90caf9' : '#1976d2' },
    replyMessageText: { fontSize: 15, lineHeight: 20 },
    replyMessageTextStaff: { color: '#fff' },
    replyMessageTextUser: { color: isDark ? '#eee' : '#333' },
    replyTime: { fontSize: 11, marginTop: 4 },
    replyTimeStaff: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
    replyTimeUser: { color: isDark ? '#aaa' : '#999' },

    // Reply Input Bar
    replyInputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: isDark ? '#1e1e1e' : '#fff', borderTopWidth: 1, borderTopColor: isDark ? '#333' : '#e0e0e0', gap: 8 },
    replyInput: { flex: 1, minHeight: 40, maxHeight: 100, borderWidth: 1, borderColor: isDark ? '#333' : '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: isDark ? '#eee' : '#333', backgroundColor: isDark ? '#2c2c2c' : '#f9f9f9' },
    sendButton: { backgroundColor: '#e65100', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center', alignItems: 'center', minHeight: 40 },
    sendButtonDisabled: { backgroundColor: isDark ? '#555' : '#b0bec5' },
    sendButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

export default AdminTicketDetailScreen;
