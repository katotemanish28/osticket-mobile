import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register } from '../api/osticket';

const SignupScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'Full name is required';
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const result = await register(name.trim(), email.trim(), password);
            if (result.success) {
                await AsyncStorage.setItem('authToken', result.token);
                await AsyncStorage.setItem('userData', JSON.stringify(result.data));
                navigation.replace('Dashboard');
            } else {
                Alert.alert('Registration Failed', result.error || 'Could not create account. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const field = (label, value, setter, key, opts = {}) => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, errors[key] && styles.inputError]}
                placeholder={`Enter your ${label.toLowerCase()}`}
                placeholderTextColor="#999"
                value={value}
                onChangeText={(text) => {
                    setter(text);
                    if (errors[key]) setErrors({ ...errors, [key]: null });
                }}
                editable={!loading}
                {...opts}
            />
            {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.appName}>osTicket</Text>
                    <Text style={styles.subtitle}>Create your account</Text>
                </View>

                <View style={styles.form}>
                    {field('Full Name', name, setName, 'name', { autoCapitalize: 'words' })}
                    {field('Email', email, setEmail, 'email', { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false })}
                    {field('Password', password, setPassword, 'password', { secureTextEntry: true, autoCapitalize: 'none' })}
                    {field('Confirm Password', confirmPassword, setConfirmPassword, 'confirmPassword', { secureTextEntry: true, autoCapitalize: 'none' })}

                    <TouchableOpacity
                        style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.registerButtonText}>Create Account</Text>
                        }
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Already have an account?{' '}
                        <Text style={styles.loginLink} onPress={() => navigation.goBack()}>
                            Sign In
                        </Text>
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 36 },
    appName: { fontSize: 36, fontWeight: 'bold', color: '#1976d2', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666' },
    form: { width: '100%' },
    inputContainer: { marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#333',
    },
    inputError: { borderColor: '#d32f2f' },
    errorText: { color: '#d32f2f', fontSize: 12, marginTop: 4 },
    registerButton: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    registerButtonDisabled: { backgroundColor: '#90caf9' },
    registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    footer: { marginTop: 28, alignItems: 'center' },
    footerText: { color: '#666', fontSize: 14 },
    loginLink: { color: '#1976d2', fontWeight: '600' },
});

export default SignupScreen;
