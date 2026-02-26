// Copy this file to config.js and fill in your values
// DO NOT commit config.js — it contains secrets

export const API_BASE_URL = "http://YOUR_SERVER_IP:3000/api";
export const API_KEY = "YOUR_OSTICKET_API_KEY";


/**
 * Priority labels and colors (no secrets here)
 */
export const PRIORITY_LABELS = {
  1: 'Low',
  2: 'Normal',
  3: 'High',
  4: 'Critical',
};

export const PRIORITY_COLORS = {
  1: '#4caf50',
  2: '#1976d2',
  3: '#f57c00',
  4: '#d32f2f',
};

export const STATUS_COLORS = {
  open: '#1976d2',
  resolved: '#4caf50',
  closed: '#9e9e9e',
};
