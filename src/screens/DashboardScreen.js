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
import { PRIORITY_LABELS, STATUS_COLORS } from '../api/config';
import { getTickets, getTicketStats } from '../api/osticket';
import { useThemeContext } from '../context/ThemeContext';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
];

const DashboardScreen = ({ navigation }) => {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const styles = createStyles(isDark);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });

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

  // Add header buttons
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

  const loadStats = useCallback(async () => {
    const result = await getTicketStats();
    if (result.success && result.data) {
      const d = result.data.data || result.data;
      setStats({
        total: Number(d.total) || 0,
        open: Number(d.open) || 0,
        closed: Number(d.closed) || 0,
      });
    }
  }, []);

  const loadTickets = useCallback(async (isRefresh = false, filter = activeFilter) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const result = await getTickets({ status: filter, page: 1, limit: 50 });
    if (result.success) {
      setTickets(result.data || []);
    } else {
      setError(result.error || 'Failed to load tickets');
      setTickets([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [activeFilter]);

  const loadAll = useCallback(async (isRefresh = false) => {
    await Promise.all([loadTickets(isRefresh), loadStats()]);
  }, [loadTickets, loadStats]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const onRefresh = () => loadAll(true);

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    loadTickets(false, filterKey);
  };

  const openTicket = (ticket) => {
    const ticketId = ticket.ticket_id ?? ticket.id;
    if (ticketId != null) {
      navigation.navigate('TicketDetail', { ticketId: String(ticketId) });
    }
  };

  const renderStatsCards = () => (
    <View style={styles.statsRow}>
      <View style={[styles.statCard, { backgroundColor: '#1976d2' }]}>
        <Text style={styles.statNumber}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: '#2e7d32' }]}>
        <Text style={styles.statNumber}>{stats.open}</Text>
        <Text style={styles.statLabel}>Open</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: '#c62828' }]}>
        <Text style={styles.statNumber}>{stats.closed}</Text>
        <Text style={styles.statLabel}>Closed</Text>
      </View>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterRow}>
      {FILTER_TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.filterTab,
            activeFilter === tab.key && styles.filterTabActive,
          ]}
          onPress={() => handleFilterChange(tab.key)}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === tab.key && styles.filterTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
        <TouchableOpacity style={styles.retryButton} onPress={() => loadAll()}>
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

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Filter Tabs */}
      {renderFilterTabs()}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('CreateTicket')}
      >
        <Text style={styles.buttonText}>+ Create New Ticket</Text>
      </TouchableOpacity>

      {tickets.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            No {activeFilter !== 'all' ? activeFilter : ''} tickets found.
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

const createStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: isDark ? '#121212' : '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  headerBtnText: {
    fontSize: 20,
    color: isDark ? '#eee' : '#333',
  },
  // Stats Cards
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '600',
  },
  // Filter Tabs
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: isDark ? '#2c2c2c' : '#e0e0e0',
    borderRadius: 8,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: isDark ? '#90caf9' : '#1976d2',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#aaa' : '#666',
  },
  filterTabTextActive: {
    color: isDark ? '#121212' : '#fff',
  },
  // Admin Button
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
  // Create Ticket
  button: {
    backgroundColor: isDark ? '#90caf9' : '#1976d2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: isDark ? '#121212' : '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Tickets List
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: isDark ? '#888' : '#999',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  ticketCard: {
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
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
    color: isDark ? '#aaa' : '#666',
    marginBottom: 4,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#eee' : '#333',
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
    color: isDark ? '#aaa' : '#666',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: isDark ? '#aaa' : '#666',
  },
  errorText: {
    fontSize: 16,
    color: isDark ? '#ff5252' : '#c62828',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: isDark ? '#90caf9' : '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: isDark ? '#121212' : '#fff',
    fontWeight: '600',
  },
});

export default DashboardScreen;
