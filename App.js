import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { ThemeProvider, useThemeContext } from "./src/context/ThemeContext";
import EditTicketScreen from "./src/screens/EditTicketScreen";

// Import screens
import AdminPanelScreen from "./src/screens/AdminPanelScreen";
import AdminTicketDetailScreen from "./src/screens/AdminTicketDetailScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";
import CreateTicketScreen from "./src/screens/CreateTicketScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import LoginScreen from "./src/screens/LoginScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SignupScreen from "./src/screens/SignupScreen";
import TicketDetailScreen from "./src/screens/TicketDetailScreen";
import TicketListScreen from "./src/screens/TicketListScreen";

const Stack = createStackNavigator();

function MainAppNavigator() {
  const { theme } = useThemeContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigationRef = useRef(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error("Error checking login status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: theme === 'dark' ? '#121212' : '#1976d2' },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ title: "Create Account" }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Reset Password" }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "My Tickets" }}
        />
        <Stack.Screen
          name="CreateTicket"
          component={CreateTicketScreen}
          options={{ title: "New Ticket" }}
        />
        <Stack.Screen
          name="TicketList"
          component={TicketListScreen}
          options={{ title: "All Tickets" }}
        />
        <Stack.Screen
          name="TicketDetail"
          component={TicketDetailScreen}
          options={{ title: "Ticket Details" }}
        />
        <Stack.Screen
          name="EditTicket"
          component={EditTicketScreen}
          options={{ title: "Edit Ticket" }}
        />
        <Stack.Screen
          name="AdminPanel"
          component={AdminPanelScreen}
          options={{ title: "Admin Panel" }}
        />
        <Stack.Screen
          name="AdminTicketDetail"
          component={AdminTicketDetailScreen}
          options={{ title: "Ticket Details (Admin)" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "My Profile" }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ title: "Change Password" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainAppNavigator />
    </ThemeProvider>
  );
}
