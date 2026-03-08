// src/api/osticket.js
// osTicket API Integration Module

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL, API_KEY } from "./config";
// Use real API (set to true only for testing without backend)
const MOCK_MODE = false;

const mockLogin = async (email, password) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (email === "demo@test.com" && password === "password") {
    return {
      success: true,
      token: "mock-token-12345",
      data: {
        id: 1,
        name: "Demo User",
        email: "demo@test.com",
      },
    };
  }

  return {
    success: false,
    error: "Invalid credentials. Try: demo@test.com / password",
  };
};
// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for auth tokens
let cachedToken = null;

api.interceptors.request.use(
  async (config) => {
    // Get stored auth token if available
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error("API Error:", error.response.data);

      if (error.response.status === 401) {
        // Unauthorized - token expired
        handleUnauthorized();
      }
    } else if (error.request) {
      // No response received
      console.error("Network Error:", error.request);
    }
    return Promise.reject(error);
  },
);

// Helper function to get stored auth token
const getAuthToken = async () => {
  if (cachedToken) return cachedToken;
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (token) cachedToken = token;
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Handle unauthorized access
const handleUnauthorized = () => {
  // Clear stored credentials and redirect to login
  // This will be implemented in your navigation logic
  cachedToken = null;
  console.log("User unauthorized - redirect to login");
};

// ==================== AUTH FUNCTIONS ====================

/**
 * Authenticate user with osTicket
 * Note: This requires a custom endpoint as osTicket doesn't have built-in user auth API
 */
export const login = async (email, password) => {
  if (MOCK_MODE) {
    return mockLogin(email, password);
  }
  try {
    const response = await api.post("/auth/login", { email, password });
    cachedToken = response.data.token;
    return {
      success: true,
      data: response.data.data,
      token: response.data.token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Login failed",
    };
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post("/auth/register", { name, email, password });
    return {
      success: true,
      data: response.data.data,
      token: response.data.token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Registration failed",
    };
  }
};

/**
 * Forgot password — verify email exists
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to verify email",
    };
  }
};

/**
 * Verify OTP — returns a reset token
 */
export const verifyOtp = async (email, otp) => {
  try {
    const response = await api.post("/auth/verify-otp", { email, otp });
    return {
      success: true,
      message: response.data.message,
      resetToken: response.data.resetToken,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to verify OTP",
    };
  }
};

/**
 * Reset password — requires reset token from OTP verification
 */
export const resetPassword = async (resetToken, newPassword) => {
  try {
    const response = await api.post("/auth/reset-password", { resetToken, newPassword });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to reset password",
    };
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    await api.post("/auth/logout");
    // Clear local storage
    cachedToken = null;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==================== TICKET FUNCTIONS ====================

/**
 * Create a new ticket
 * @param {Object} ticketData - Ticket information
 */
export const createTicket = async (ticketData) => {
  // MOCK MODE - Simulate ticket creation
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay

    const ticketId = Math.floor(Math.random() * 10000) + 1000;

    return {
      success: true,
      ticketId: ticketId,
      data: {
        ticket_id: ticketId,
        number: `TKT-${ticketId}`,
        subject: ticketData.subject,
        status: "open",
      },
    };
  }

  // REAL API MODE - middleware POST /tickets
  try {
    const response = await api.post("/tickets", {
      subject: ticketData.subject,
      message: ticketData.message,
      priority: ticketData.priority || 2,
      topicId: ticketData.topicId || 1,
      deptId: ticketData.deptId || 1,
    });

    const data = response.data.data || response.data;
    const ticketId = data.ticket_id ?? data.id ?? response.data.ticket_id;

    return {
      success: true,
      ticketId,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create ticket",
    };
  }
};

/**
 * Get ticket details by ID
 */
export const getTicket = async (ticketId) => {
  try {
    const response = await api.get(`/tickets/${ticketId}`);
    // Middleware returns { success, data: ticket }
    const ticket = response.data.data || response.data;

    return {
      success: true,
      data: ticket,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch ticket",
    };
  }
};

/**
 * Get list of user's tickets
 * Note: This requires a custom endpoint
 */
export const getTickets = async (filters = {}) => {
  try {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      status: filters.status || "open", // open, closed, all
      sortBy: filters.sortBy || "created",
      order: filters.order || "desc",
      search: filters.search || "",
    };

    const response = await api.get("/tickets", { params });

    return {
      success: true,
      data: response.data.tickets || response.data,
      total: response.data.total || 0,
      page: response.data.page || 1,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch tickets",
      data: [],
    };
  }
};

/**
 * Reply to a ticket
 */
export const replyToTicket = async (ticketId, message) => {
  try {
    const response = await api.post(`/tickets/${ticketId}/message.json`, {
      message,
      alert: true,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to send reply",
    };
  }
};

/**
 * Get replies/messages for a ticket
 * @param {string} ticketId - Ticket ID
 */
export const getTicketReplies = async (ticketId) => {
  try {
    const response = await api.get(`/tickets/${ticketId}/messages`);
    const messages = response.data.messages || response.data.data || response.data || [];

    return {
      success: true,
      data: Array.isArray(messages) ? messages : [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch replies',
      data: [],
    };
  }
};

/**
 * Upload file attachment
 */

export const uploadAttachment = async (ticketId, file) => {
  // MOCK MODE - Just pretend upload succeeded
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate upload delay

    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000),
        filename: file.name,
        size: file.size,
        type: file.type,
      },
    };
  }

  // REAL API MODE
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.type,
      name: file.name,
    });

    const response = await api.post(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to upload file",
    };
  }
};

/**
 * Search tickets
 */
export const searchTickets = async (query, filters = {}) => {
  try {
    const params = {
      q: query,
      status: filters.status || "all",
    };

    const response = await api.get("/tickets/search", { params });

    return {
      success: true,
      tickets: response.data.tickets || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Search failed",
      tickets: [],
      total: 0,
    };
  }
};

/**
 * Get ticket statistics for dashboard
 */
export const getTicketStats = async () => {
  try {
    const response = await api.get("/tickets/stats");

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {
        total: 0,
        open: 0,
        closed: 0,
        pending: 0,
      },
    };
  }
};

/**
 * Get help topics (categories)
 */
export const getHelpTopics = async () => {
  // MOCK MODE
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      data: [
        { id: 1, topic: "General Support" },
        { id: 2, topic: "Technical Issue" },
        { id: 3, topic: "Billing Question" },
        { id: 4, topic: "Feature Request" },
      ],
    };
  }

  // REAL API MODE
  try {
    const response = await api.get("/help-topics");

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * Get custom form fields
 */
export const getCustomFields = async (topicId) => {
  try {
    const response = await api.get(`/help-topics/${topicId}/fields`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

export const updateTicket = async (ticketId, updates) => {
  // MOCK MODE
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      data: {
        ticket_id: ticketId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
    };
  }

  // REAL API MODE
  try {
    const response = await api.put(`/tickets/${ticketId}`, updates);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update ticket',
    };
  }
};

/**
 * Delete a ticket
 * @param {string} ticketId - Ticket ID to delete
 */
export const deleteTicket = async (ticketId) => {
  // MOCK MODE
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      message: 'Ticket deleted successfully',
      ticketId: ticketId,
    };
  }

  // REAL API MODE
  try {
    const response = await api.delete(`/tickets/${ticketId}`);

    return {
      success: true,
      message: 'Ticket deleted successfully',
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete ticket',
    };
  }
};

/**
 * Update ticket status
 * @param {string} ticketId - Ticket ID
 * @param {string} status - New status (open, closed, resolved, etc.)
 */
export const updateTicketStatus = async (ticketId, status) => {
  // MOCK MODE
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      data: {
        ticket_id: ticketId,
        status: status,
        updated_at: new Date().toISOString(),
      },
    };
  }

  // REAL API MODE
  try {
    const response = await api.patch(`/tickets/${ticketId}/status`, {
      status: status,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update ticket status',
    };
  }
};

/**
 * Update ticket priority
 * @param {string} ticketId - Ticket ID
 * @param {number} priority - Priority level (1-4)
 */
export const updateTicketPriority = async (ticketId, priority) => {
  // MOCK MODE
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      data: {
        ticket_id: ticketId,
        priority: priority,
        updated_at: new Date().toISOString(),
      },
    };
  }

  // REAL API MODE
  try {
    const response = await api.patch(`/tickets/${ticketId}/priority`, {
      priority: priority,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update ticket priority',
    };
  }
};

// ==================== EXPORT ALL FUNCTIONS ====================
// Make sure to add these to your default export at the bottom:

/**
 * Change password (logged-in user)
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.post("/auth/change-password", { currentPassword, newPassword });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to change password",
    };
  }
};

export default {
  login,
  register,
  forgotPassword,
  verifyOtp,
  resetPassword,
  logout,
  createTicket,
  getTicket,
  getTickets,
  replyToTicket,
  getTicketReplies,
  uploadAttachment,
  searchTickets,
  getTicketStats,
  getHelpTopics,
  getCustomFields,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  updateTicketPriority,
  changePassword,
};

