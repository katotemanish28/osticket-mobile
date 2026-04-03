import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_BASE_URL } from '../api/config';
import { useThemeContext } from '../context/ThemeContext';


const STATUS_OPTIONS = ['open', 'resolved', 'closed'];
const PRIORITY_OPTIONS = [
    { label: 'Low', value: 1 },
    { label: 'Normal', value: 2 },
    { label: 'High', value: 3 },
    { label: 'Critical', value: 4 },
];
const AdminPanelScreen = ({ navigation }) => {
    const { theme } = useThemeContext();
    const isDark = theme === 'dark';
    const styles = createStyles(isDark);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Add header buttons similar to DashboardScreen
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('TicketList')} style={styles.headerBtn}>
                        <Ionicons name="search" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ ...styles.headerBtn, marginLeft: 8 }}>
                        <Ionicons name="person-circle-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, styles]);

    const fetchAdminTickets = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/tickets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await response.json();
            if (json.success) {
                setTickets(json.tickets || []);  
            } else {
                setError(json.message || 'Failed to load admin tickets');
            }
        } catch (e) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAdminTickets();
        }, [fetchAdminTickets])
    );

    const updateStatus = async (ticketId, status) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });
            const json = await response.json();
            if (json.success) {
                fetchAdminTickets(true);
            } else {
                Alert.alert('Error', json.message || 'Failed to update status');
            }
        } catch {
            Alert.alert('Error', 'Network error. Please try again.');
        }
    };

    const showStatusPicker = (ticketId) => {
        Alert.alert('Change Status', 'Select a new status:', [
            ...STATUS_OPTIONS.map((s) => ({
                text: s.charAt(0).toUpperCase() + s.slice(1),
                onPress: () => updateStatus(ticketId, s),
            })),
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const renderItem = ({ item }) => {
        const ticketId = item.ticket_id ?? item.id;
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AdminTicketDetail', { ticketId: String(ticketId) })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.ticketNum}>#{item.number || ticketId}</Text>
                    <TouchableOpacity
                        style={styles.statusBadge}
                        onPress={(e) => {
                            e.stopPropagation && e.stopPropagation();
                            showStatusPicker(ticketId);
                        }}
                    >
                        <Text style={styles.statusText}>
                            {item.status_name || item.status_state || 'Open'} ▼
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subject} numberOfLines={2}>
                    {item.subject || 'No subject'}
                </Text>
                <Text style={styles.meta}>
                    👤 {item.name || item.user_name || 'Unknown'} · 🏷 {item.priority_name || 'Normal'}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#e65100" />
                <Text style={styles.loadingText}>Loading admin tickets...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAdminTickets()}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.adminHeader}>
                <Text style={styles.subtitle}>{tickets.length} ticket(s) total</Text>
                <TouchableOpacity 
                    style={styles.manageAgentsBtn}
                    onPress={() => navigation.navigate('AgentManagement')}
                >
                    <Ionicons name="people" size={18} color="#fff" />
                    <Text style={styles.manageAgentsBtnText}>Manage Agents</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.createTicketBtn}
                onPress={() => navigation.navigate('CreateTicket')}
            >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.createTicketBtnText}>Create New Ticket</Text>
            </TouchableOpacity>
            
            <FlatList
                data={tickets}
                keyExtractor={(item) => String(item.ticket_id ?? item.id ?? Math.random())}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchAdminTickets(true)}
                        colors={['#e65100']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No tickets found.</Text>
                    </View>
                }
            />
        </View>
    );
};

const createStyles = (isDark) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f5f5f5', padding: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    subtitle: { fontSize: 13, color: isDark ? '#aaa' : '#888' },
    adminHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: isDark ? '#1e1e1e' : '#fff',
        padding: 12,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    manageAgentsBtn: {
        backgroundColor: '#e65100',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    manageAgentsBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    createTicketBtn: {
        backgroundColor: isDark ? '#90caf9' : '#1976d2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    createTicketBtnText: {
        color: isDark ? '#121212' : '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingText: { marginTop: 12, fontSize: 16, color: isDark ? '#aaa' : '#666' },
    errorText: { fontSize: 16, color: isDark ? '#ff5252' : '#c62828', textAlign: 'center', marginBottom: 16 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#999' },
    retryBtn: {
        backgroundColor: '#e65100',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    headerBtn: {
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    retryBtnText: { color: '#fff', fontWeight: '600' },
    listContent: { paddingBottom: 24 },
    card: {
        backgroundColor: isDark ? '#1e1e1e' : '#fff',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    ticketNum: { fontSize: 12, color: isDark ? '#aaa' : '#888' },
    statusBadge: {
        backgroundColor: '#e65100',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    subject: { fontSize: 15, fontWeight: '600', color: isDark ? '#eee' : '#333', marginBottom: 6 },
    meta: { fontSize: 12, color: isDark ? '#aaa' : '#777' },
});

export default AdminPanelScreen;
