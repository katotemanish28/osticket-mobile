// src/screens/ForgotPasswordScreen.js
// Three-step forgot password: email → OTP verification → set new password

import React, { useState, useRef } from 'react';
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
import { forgotPassword, verifyOtp, resetPassword } from '../api/osticket';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef(null);

  // Start resend cooldown timer
  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const result = await forgotPassword(email.trim());

    if (result.success) {
      setUserName(result.data?.name || '');
      setStep(2);
      startCooldown();
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } else {
      Alert.alert('Error', result.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const newErrors = {};
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otp.trim().length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const result = await verifyOtp(email.trim(), otp.trim());

    if (result.success) {
      setResetToken(result.resetToken);
      setStep(3);
    } else {
      Alert.alert('Error', result.error || 'Invalid OTP');
    }
    setLoading(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const result = await forgotPassword(email.trim());
    if (result.success) {
      Alert.alert('OTP Sent', 'A new OTP has been sent to your email.');
      setOtp('');
      startCooldown();
    } else {
      Alert.alert('Error', result.error || 'Failed to resend OTP');
    }
    setLoading(false);
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const result = await resetPassword(resetToken, newPassword);

    if (result.success) {
      Alert.alert(
        'Success! ✅',
        result.message || 'Your password has been reset successfully.',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to reset password');
    }
    setLoading(false);
  };

  const stepTitles = {
    1: { icon: '📧', title: 'Forgot Password?', subtitle: 'Enter your registered email to receive an OTP' },
    2: { icon: '🔢', title: 'Enter OTP', subtitle: `We sent a 6-digit code to ${email}` },
    3: { icon: '🔒', title: 'Set New Password', subtitle: `Hi ${userName || 'there'}! Choose a strong new password` },
  };

  const currentStep = stepTitles[step];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>{currentStep.icon}</Text>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
          </View>

          {/* Step Labels */}
          <View style={styles.stepLabels}>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Email</Text>
            <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>OTP</Text>
            <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>Password</Text>
          </View>

          {/* Step 1: Email */}
          {step === 1 && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your registered email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <View style={styles.form}>
              <View style={styles.emailConfirmBadge}>
                <Text style={styles.emailConfirmText}>📧 OTP sent to {email}</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Enter 6-Digit OTP</Text>
                <TextInput
                  ref={otpInputRef}
                  style={[styles.input, styles.otpInput, errors.otp && styles.inputError]}
                  placeholder="000000"
                  placeholderTextColor="#ccc"
                  value={otp}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtp(digits);
                    if (errors.otp) setErrors({ ...errors, otp: null });
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
                {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity
                style={[styles.resendBtn, resendCooldown > 0 && styles.resendBtnDisabled]}
                onPress={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
              >
                <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : '🔄 Resend OTP'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backLink}
                onPress={() => { setStep(1); setOtp(''); setErrors({}); }}
              >
                <Text style={styles.backLinkText}>← Change email</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <View style={styles.form}>
              <View style={styles.emailConfirmBadge}>
                <Text style={styles.emailConfirmText}>✅ OTP verified for {email}</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={[styles.input, errors.newPassword && styles.inputError]}
                  placeholder="Enter new password (min 6 chars)"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) setErrors({ ...errors, newPassword: null });
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
                {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Back to login */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },

  // Step Indicator
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ddd' },
  stepDotActive: { backgroundColor: '#1976d2' },
  stepLine: { width: 32, height: 3, backgroundColor: '#ddd', marginHorizontal: 6 },
  stepLineActive: { backgroundColor: '#1976d2' },
  stepLabels: { flexDirection: 'row', justifyContent: 'center', marginBottom: 28, gap: 40 },
  stepLabel: { fontSize: 12, color: '#bbb', fontWeight: '600' },
  stepLabelActive: { color: '#1976d2' },

  // Form
  form: { width: '100%' },
  emailConfirmBadge: { backgroundColor: '#e8f5e9', borderRadius: 8, padding: 12, marginBottom: 20, alignItems: 'center' },
  emailConfirmText: { color: '#2e7d32', fontSize: 14, fontWeight: '600' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 16, fontSize: 16, color: '#333' },
  inputError: { borderColor: '#d32f2f' },
  otpInput: { textAlign: 'center', fontSize: 28, fontWeight: 'bold', letterSpacing: 12, paddingVertical: 18 },
  errorText: { color: '#d32f2f', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: '#1976d2', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  buttonDisabled: { backgroundColor: '#90caf9' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Resend OTP
  resendBtn: { alignItems: 'center', marginTop: 16, padding: 8 },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: { color: '#1976d2', fontSize: 14, fontWeight: '600' },
  resendTextDisabled: { color: '#999' },

  // Links
  backLink: { alignItems: 'center', marginTop: 12 },
  backLinkText: { color: '#1976d2', fontSize: 14 },
  loginLink: { alignItems: 'center', marginTop: 32 },
  loginLinkText: { color: '#666', fontSize: 14 },
});

export default ForgotPasswordScreen;
