import { useState } from 'react';
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
import { changePassword } from '../api/osticket';
import { useThemeContext } from '../context/ThemeContext';

const ChangePasswordScreen = ({ navigation }) => {
    const { theme } = useThemeContext();
    const isDark = theme === 'dark';
    const styles = createStyles(isDark);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};

        if (!currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (currentPassword && newPassword && currentPassword === newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const result = await changePassword(currentPassword, newPassword);

            if (result.success) {
                Alert.alert(
                    'Success',
                    result.message || 'Password changed successfully!',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to change password');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.heading}>Change Your Password</Text>
                <Text style={styles.subheading}>
                    Enter your current password and choose a new one.
                </Text>

                {/* Current Password */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Current Password</Text>
                    <TextInput
                        style={[styles.input, errors.currentPassword && styles.inputError]}
                        placeholder="Enter current password"
                        placeholderTextColor={isDark ? "#aaa" : "#999"}
                        value={currentPassword}
                        onChangeText={(text) => {
                            setCurrentPassword(text);
                            if (errors.currentPassword) setErrors({ ...errors, currentPassword: null });
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    {errors.currentPassword && (
                        <Text style={styles.errorText}>{errors.currentPassword}</Text>
                    )}
                </View>

                {/* New Password */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                        style={[styles.input, errors.newPassword && styles.inputError]}
                        placeholder="Enter new password"
                        placeholderTextColor={isDark ? "#aaa" : "#999"}
                        value={newPassword}
                        onChangeText={(text) => {
                            setNewPassword(text);
                            if (errors.newPassword) setErrors({ ...errors, newPassword: null });
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    {errors.newPassword && (
                        <Text style={styles.errorText}>{errors.newPassword}</Text>
                    )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput
                        style={[styles.input, errors.confirmPassword && styles.inputError]}
                        placeholder="Re-enter new password"
                        placeholderTextColor={isDark ? "#aaa" : "#999"}
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Change Password</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const createStyles = (isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    scrollContent: {
        padding: 24,
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: isDark ? '#eee' : '#333',
        marginBottom: 6,
    },
    subheading: {
        fontSize: 14,
        color: isDark ? '#aaa' : '#888',
        marginBottom: 28,
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
        padding: 16,
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
    button: {
        backgroundColor: isDark ? '#90caf9' : '#1976d2',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: isDark ? '#555' : '#90caf9',
    },
    buttonText: {
        color: isDark ? '#121212' : '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ChangePasswordScreen;
