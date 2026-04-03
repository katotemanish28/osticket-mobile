import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import { createAgent, getAgents } from '../api/osticket';
import { useThemeContext } from '../context/ThemeContext';

const AgentManagementScreen = () => {
    const { theme } = useThemeContext();
    const isDark = theme === 'dark';
    const styles = createStyles(isDark);

    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchAgents = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        
        const result = await getAgents();
        if (result.success) {
            setAgents(result.data || []);
        } else {
            setError(result.error || 'Failed to load agents');
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAgents();
        }, [fetchAgents])
    );

    const handleAddAgent = async () => {
        if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setCreating(true);
        const result = await createAgent({
            name: newName.trim(),
            email: newEmail.trim(),
            password: newPassword,
        });

        if (result.success) {
            Alert.alert('Success', 'Agent account created successfully');
            setIsModalVisible(false);
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            fetchAgents(true);
        } else {
            Alert.alert('Error', result.error || 'Failed to create agent');
        }
        setCreating(false);
    };

    const renderAgentItem = ({ item }) => (
        <View style={styles.agentCard}>
            <View style={styles.agentAvatar}>
                <Text style={styles.avatarText}>
                    {item.name ? item.name.charAt(0).toUpperCase() : 'A'}
                </Text>
            </View>
            <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{item.name}</Text>
                <Text style={styles.agentEmail}>{item.email || 'No email'}</Text>
            </View>
            <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Agent</Text>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#e65100" />
                <Text style={styles.loadingText}>Loading agents...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Summary Header */}
            <View style={styles.summaryHeader}>
                <View>
                    <Text style={styles.summaryLabel}>Total Agents</Text>
                    <Text style={styles.summaryCount}>{agents.length}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => setIsModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Add Agent</Text>
                </TouchableOpacity>
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAgents()}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={agents}
                keyExtractor={(item) => String(item.id || Math.random())}
                renderItem={renderAgentItem}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={() => fetchAgents(true)}
                ListEmptyComponent={
                    !error && (
                        <View style={styles.centered}>
                            <Ionicons name="people-outline" size={64} color={isDark ? '#333' : '#ccc'} />
                            <Text style={styles.emptyText}>No agents found</Text>
                        </View>
                    )
                }
            />

            {/* Add Agent Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Agent</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#333'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter agent name"
                                    placeholderTextColor={isDark ? '#888' : '#aaa'}
                                    value={newName}
                                    onChangeText={setNewName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter agent email"
                                    placeholderTextColor={isDark ? '#888' : '#aaa'}
                                    value={newEmail}
                                    onChangeText={setNewEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter temporary password"
                                    placeholderTextColor={isDark ? '#888' : '#aaa'}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity 
                                style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                                onPress={handleAddAgent}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Create Agent Account</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
};

const createStyles = (isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: isDark ? '#aaa' : '#666',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: isDark ? '#1e1e1e' : '#fff',
        padding: 20,
        margin: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    summaryLabel: {
        fontSize: 14,
        color: isDark ? '#aaa' : '#666',
        fontWeight: '600',
    },
    summaryCount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#e65100',
    },
    addButton: {
        backgroundColor: '#e65100',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 4,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    agentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#1e1e1e' : '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    agentAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffcc80',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#e65100',
        fontSize: 18,
        fontWeight: 'bold',
    },
    agentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    agentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: isDark ? '#eee' : '#333',
    },
    agentEmail: {
        fontSize: 13,
        color: isDark ? '#aaa' : '#777',
    },
    roleBadge: {
        backgroundColor: isDark ? '#2e7d32' : '#e8f5e9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        color: isDark ? '#81c784' : '#2e7d32',
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: isDark ? '#555' : '#ccc',
        fontWeight: '600',
    },
    errorContainer: {
        padding: 16,
        alignItems: 'center',
    },
    errorText: {
        color: '#d32f2f',
        marginBottom: 8,
    },
    retryBtn: {
        padding: 8,
        backgroundColor: '#e65100',
        borderRadius: 4,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: isDark ? '#1e1e1e' : '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#333',
    },
    modalForm: {
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: isDark ? '#aaa' : '#666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: isDark ? '#2c2c2c' : '#f9f9f9',
        borderWidth: 1,
        borderColor: isDark ? '#333' : '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: isDark ? '#eee' : '#333',
    },
    submitButton: {
        backgroundColor: '#e65100',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        backgroundColor: isDark ? '#555' : '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AgentManagementScreen;
