import { useCallback, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PRIORITY_LABELS, STATUS_COLORS } from '../api/config';
import { searchTickets } from '../api/osticket';
import { useThemeContext } from '../context/ThemeContext';

const TicketListScreen = ({ navigation }) => {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const [query, setQuery] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);

  const handleSearch = useCallback(async (searchText) => {
    const q = searchText !== undefined ? searchText : query;
    setLoading(true);
    setSearched(true);
    const result = await searchTickets(q.trim(), { status: 'all' });
    if (result.success) {
      setTickets(result.tickets || []);
      setTotal(result.total || 0);
    } else {
      setTickets([]);
      setTotal(0);
    }
    setLoading(false);
  }, [query]);

  const onSubmit = () => handleSearch();

  const onClear = () => {
    setQuery('');
    setTickets([]);
    setSearched(false);
    setTotal(0);
  };

  const openTicket = useCallback((ticket) => {
    const ticketId = ticket.ticket_id ?? ticket.id;
    if (ticketId != null) {
      navigation.navigate('TicketDetail', { ticketId: String(ticketId) });
    }
  }, [navigation]);

  const renderItem = useCallback(({ item }) => {
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
  }, [styles, openTicket]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tickets..."
          placeholderTextColor={isDark ? "#aaa" : "#999"}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={onSubmit}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : searched && tickets.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No tickets found for &quot;{query}&quot;</Text>
        </View>
      ) : !searched ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Enter a search term to find tickets</Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultCount}>{total} result(s) found</Text>
          <FlatList
            data={tickets}
            keyExtractor={(item, index) => String(item.ticket_id ?? item.id ?? index)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: isDark ? '#eee' : '#333',
  },
  clearBtn: {
    position: 'absolute',
    right: 84,
    padding: 6,
  },
  clearBtnText: {
    fontSize: 16,
    color: isDark ? '#888' : '#999',
  },
  searchBtn: {
    backgroundColor: isDark ? '#90caf9' : '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
  },
  searchBtnText: {
    color: isDark ? '#121212' : '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultCount: {
    fontSize: 13,
    color: isDark ? '#aaa' : '#888',
    marginBottom: 10,
  },
  // Ticket cards
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
  emptyText: {
    fontSize: 16,
    color: isDark ? '#888' : '#999',
    textAlign: 'center',
  },
});

export default TicketListScreen;