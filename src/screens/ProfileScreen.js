import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
    const { theme, toggleTheme } = useThemeContext();
    const isDark = theme === 'dark';
    const styles = createStyles(isDark);
    const [userData, setUserData] = useState(null);

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

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Avatar Circle */}
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {userData?.name ? userData.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                </View>
            </View>

            {/* User Info */}
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{userData?.name || 'N/A'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{userData?.email || 'N/A'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Role</Text>
                    <View style={[
                        styles.roleBadge,
                        { backgroundColor: userData?.role === 'admin' ? '#e65100' : '#1976d2' }
                    ]}>
                        <Text style={styles.roleText}>
                            {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Theme Toggle */}
            <View style={styles.actionButton}>
                <Ionicons name="moon-outline" size={22} color={isDark ? '#aaa' : '#666'} style={styles.actionIcon} />
                <Text style={styles.actionText}>Dark Theme</Text>
                <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isDark ? "#1976d2" : "#f4f3f4"}
                />
            </View>

            {/* Actions */}
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('ChangePassword')}
            >
                <Ionicons name="lock-closed-outline" size={22} color={isDark ? '#aaa' : '#666'} style={styles.actionIcon} />
                <Text style={styles.actionText}>Change Password</Text>
                <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
            >
                <Text style={[styles.actionText, styles.logoutText, { textAlign: 'center' }]}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const createStyles = (isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    content: {
        padding: 24,
    },
    // Avatar
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1976d2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Info card
    infoCard: {
        backgroundColor: isDark ? '#1e1e1e' : '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: isDark ? '#aaa' : '#888',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 15,
        color: isDark ? '#eee' : '#333',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: isDark ? '#333' : '#f0f0f0',
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    // Action buttons
    actionButton: {
        backgroundColor: isDark ? '#1e1e1e' : '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    actionIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    actionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: isDark ? '#eee' : '#333',
    },
    actionArrow: {
        fontSize: 22,
        color: isDark ? '#666' : '#ccc',
        fontWeight: '300',
    },
    logoutButton: {
        borderWidth: 1,
        borderColor: isDark ? '#ff5252' : '#ffcdd2',
        backgroundColor: isDark ? '#331a1a' : '#fff5f5',
    },
    logoutText: {
        color: isDark ? '#ff5252' : '#c62828',
    },
});

export default ProfileScreen;
