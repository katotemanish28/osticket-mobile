// Change from mock to real API
export const API_BASE_URL = "https://osticket-middleware.onrender.com/api";
export const API_KEY = "2CE383D9A0AE107E1CE6774DC58CDAC2"; // osTicket API key (IP: 192.168.1.8)

// API Configuration
export const API_CONFIG = {
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// App Configuration
export const APP_CONFIG = {
  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,

  // File uploads
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],

  // Ticket settings
  defaultPriority: 2, // Normal
  defaultDepartment: 1,

  // Refresh intervals (in milliseconds)
  ticketListRefreshInterval: 30000, // 30 seconds
  ticketDetailRefreshInterval: 10000, // 10 seconds
};

// Status mappings
export const TICKET_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
  RESOLVED: "resolved",
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
};

// Priority mappings
export const TICKET_PRIORITY = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  EMERGENCY: 4,
};

// Priority labels for display
export const PRIORITY_LABELS = {
  1: "Low",
  2: "Normal",
  3: "High",
  4: "Emergency",
};

// Priority colors for UI
export const PRIORITY_COLORS = {
  1: "#388e3c", // Green
  2: "#1976d2", // Blue
  3: "#f57c00", // Orange
  4: "#d32f2f", // Red
};

// Status colors for UI
export const STATUS_COLORS = {
  open: "#1976d2", // Blue
  closed: "#388e3c", // Green
  resolved: "#00897b", // Teal
  pending: "#f57c00", // Orange
  in_progress: "#7b1fa2", // Purple
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  AUTH_FAILED: "Authentication failed. Please check your credentials.",
  SESSION_EXPIRED: "Your session has expired. Please login again.",
  TICKET_CREATE_FAILED: "Failed to create ticket. Please try again.",
  TICKET_FETCH_FAILED: "Failed to load ticket. Please try again.",
  FILE_TOO_LARGE: "File size exceeds maximum limit of 10MB.",
  INVALID_FILE_TYPE: "File type not allowed.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

// Validation rules
export const VALIDATION = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  phone: {
    pattern: /^[\d\s\-\+\(\)]+$/,
    message: "Please enter a valid phone number",
  },
  subject: {
    minLength: 5,
    maxLength: 200,
    message: "Subject must be between 5 and 200 characters",
  },
  message: {
    minLength: 10,
    maxLength: 5000,
    message: "Message must be between 10 and 5000 characters",
  },
};

export default {
  API_BASE_URL,
  API_KEY,
  API_CONFIG,
  APP_CONFIG,
  TICKET_STATUS,
  TICKET_PRIORITY,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  ERROR_MESSAGES,
  VALIDATION,
};
