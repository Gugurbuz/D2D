export const APP_CONFIG = {
  name: 'D2D Satış Uygulaması',
  version: '1.0.0',
  company: 'Enerjisa',
  
  // Performance settings
  debounceDelay: 300,
  queryStaleTime: 5 * 60 * 1000, // 5 minutes
  
  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,
  
  // Map settings
  defaultMapCenter: { lat: 40.9923, lng: 29.0275 },
  defaultZoom: 13,
  maxZoom: 18,
  minZoom: 8,
  
  // Visit settings
  checkinRadius: 200, // meters
  defaultVisitDuration: 30, // minutes
  maxDailyVisits: 50,
  
  // File upload
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  
  // API settings
  requestTimeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['sales_rep', 'manager', 'admin', 'operations_manager'],
  route: ['sales_rep'],
  visits: ['sales_rep', 'manager'],
  reports: ['sales_rep', 'manager', 'operations_manager'],
  assignments: ['manager'],
  team: ['manager'],
  userManagement: ['admin'],
  systemManagement: ['admin'],
  systemReports: ['admin'],
  tariffs: ['operations_manager'],
  fieldOpsMap: ['operations_manager'],
  messages: ['sales_rep', 'manager', 'admin', 'operations_manager'],
  profile: ['sales_rep', 'manager', 'admin', 'operations_manager'],
};

export const STORAGE_KEYS = {
  authToken: 'enerjisa_auth_token',
  userPreferences: 'enerjisa_user_preferences',
  draftVisit: 'enerjisa_draft_visit',
  mapSettings: 'enerjisa_map_settings',
  dashboardLayout: 'enerjisa_dashboard_layout',
};