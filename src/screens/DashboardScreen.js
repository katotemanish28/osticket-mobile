import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTickets } from '../api/osticket';
import { STATUS_COLORS, PRIORITY_LABELS } from '../api/config';

const DashboardScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  // Load user data (role) from storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('userData');
        if (stored) setUserData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    };
    loadUser();
  }, []);

  // Add logout button to header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutBtn}>
          <Text style={styles.headerLogoutText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
          navigation.replace('Login');
        },
      },
    ]);
  };

  const loadTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const result = await getTickets({ status: 'all', page: 1, limit: 50 });
    if (result.success) {
      setTickets(result.data || []);
    } else {
      setError(result.error || 'Failed to load tickets');
      setTickets([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Refresh tickets when screen comes into focus (e.g., after creating a ticket)
  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets])
  );

  const onRefresh = () => loadTickets(true);

  const openTicket = (ticket) => {
    const ticketId = ticket.ticket_id ?? ticket.id;
    if (ticketId != null) {
      navigation.navigate('TicketDetail', { ticketId: String(ticketId) });
    }
  };

  const renderItem = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status_state] || STATUS_COLORS.open;
    const priorityLabel = PRIORITY_LABELS[item.priority_id] || item.priority_name || 'Normal';
    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => openTicket(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.ticketNumber} numberOfLines={1}>
          #{item.number || item.ticket_id}
        </Text>
        <Text style={styles.ticketSubject} numberOfLines={2}>
          {item.subject || 'No subject'}
        </Text>
        <View style={styles.ticketMeta}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status_name || item.status_state || 'Open'}</Text>
          </View>
          <Text style={styles.priorityText}>{priorityLabel}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading tickets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadTickets()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Admin Panel button — only visible to admin users */}
      {userData?.role === 'admin' && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => navigation.navigate('AdminPanel')}
        >
          <Text style={styles.adminButtonText}>⚙️ Admin Panel</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('CreateTicket')}
      >
        <Text style={styles.buttonText}>+ Create New Ticket</Text>
      </TouchableOpacity>

      {tickets.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            No tickets yet. Create your first ticket!
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => String(item.ticket_id ?? item.id ?? Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976d2']} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerLogoutBtn: {
    marginRight: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerLogoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  adminButton: {
    backgroundColor: '#e65100',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  ticketCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default DashboardScreen;
