import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import EditTicketScreen from "./src/screens/EditTicketScreen";

// Import screens
import AdminPanelScreen from "./src/screens/AdminPanelScreen";
import AdminTicketDetailScreen from "./src/screens/AdminTicketDetailScreen";
import CreateTicketScreen from "./src/screens/CreateTicketScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import TicketDetailScreen from "./src/screens/TicketDetailScreen";
import TicketListScreen from "./src/screens/TicketListScreen";

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: "#1976d2" },
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
