/**
 * 🎨 Centralized Theme Configuration for Greedy Campaign Manager
 * 
 * This file provides a centralized configuration for all theme-related
 * styling, colors, and DaisyUI component usage throughout the application.
 */

// ===== DAISYUI THEME CONFIGURATION =====
export const THEME = {
  // Current theme name (matches tailwind.config.js)
  name: 'emerald',

  // Available themes for easy switching
  availableThemes: ['light', 'dark', 'cmyk', "emerald", "corporate"] as const,

  // Theme colors (semantic colors from DaisyUI)
  colors: {
    // Primary application colors
    primary: 'primary',
    'primary-focus': 'primary-focus',
    'primary-content': 'primary-content',
    
    // Secondary colors
    secondary: 'secondary',
    'secondary-focus': 'secondary-focus', 
    'secondary-content': 'secondary-content',
    
    // Accent colors
    accent: 'accent',
    'accent-focus': 'accent-focus',
    'accent-content': 'accent-content',
    
    // Neutral colors for backgrounds
    neutral: 'neutral',
    'neutral-focus': 'neutral-focus',
    'neutral-content': 'neutral-content',
    
    // Base colors
    'base-100': 'base-100', // Main background
    'base-200': 'base-200', // Card background
    'base-300': 'base-300', // Input background
    'base-content': 'base-content', // Main text
    
    // Semantic state colors
    info: 'info',
    'info-content': 'info-content',
    success: 'success',
    'success-content': 'success-content',
    warning: 'warning',
    'warning-content': 'warning-content',
    error: 'error',
    'error-content': 'error-content',
  }
} as const;

// ===== COMPONENT COLOR MAPPINGS =====
export const COMPONENT_COLORS = {
  // Page backgrounds
  page: {
    background: 'bg-base-100',
    content: 'text-base-content'
  },
  
  // Card components
  card: {
    background: 'bg-base-200',
    border: 'border-base-300',
    content: 'text-base-content'
  },
  
  // Form elements
  form: {
    input: {
      background: 'bg-base-300',
      border: 'border-base-300',
      focus: 'focus:border-primary',
      content: 'text-base-content'
    },
    button: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      ghost: 'btn-ghost',
      outline: 'btn-outline'
    }
  },
  
  // Navigation
  navigation: {
    background: 'bg-base-200',
    active: 'bg-primary text-primary-content',
    hover: 'hover:bg-base-300'
  },
  
  // Status indicators
  status: {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10', 
    error: 'text-error bg-error/10',
    info: 'text-info bg-info/10'
  },
  
  // Combat tracker specific colors (replacing hardcoded colors)
  combat: {
    turn: {
      active: 'bg-primary text-primary-content',
      waiting: 'bg-base-200 text-base-content',
      unconscious: 'bg-error/20 text-error'
    },
    health: {
      full: 'text-success',
      injured: 'text-warning', 
      critical: 'text-error'
    }
  }
} as const;

// ===== UTILITY FUNCTIONS =====

/**
 * Get DaisyUI color class name
 */
export const getColor = (colorName: keyof typeof THEME.colors): string => {
  return THEME.colors[colorName];
};

/**
 * Get component color classes
 */
export const getComponentColors = (component: keyof typeof COMPONENT_COLORS) => {
  return COMPONENT_COLORS[component];
};

/**
 * Generate CSS classes for a component
 */
export const buildClasses = (...classes: (string | false | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Apply theme colors to an element dynamically
 */
export const applyThemeColor = (element: HTMLElement, colorName: keyof typeof THEME.colors) => {
  element.className = element.className.replace(/text-\w+/g, '').replace(/bg-\w+/g, '');
  element.classList.add(`bg-${THEME.colors[colorName]}`, `text-${THEME.colors[colorName]}-content`);
};

// ===== COMPONENT STYLE PRESETS =====
export const STYLE_PRESETS = {
  // Card styles
  card: {
    default: 'card bg-base-200 shadow-lg',
    compact: 'card card-compact bg-base-200 shadow-md',
    bordered: 'card bg-base-200 border border-base-300'
  },
  
  // Button styles  
  button: {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary', 
    success: 'btn btn-success',
    warning: 'btn btn-warning',
    error: 'btn btn-error',
    ghost: 'btn btn-ghost',
    outline: 'btn btn-outline'
  },
  
  // Input styles
  input: {
    default: 'input input-bordered bg-base-300',
    primary: 'input input-bordered input-primary bg-base-300',
    error: 'input input-bordered input-error bg-base-300'
  },
  
  // Badge styles
  badge: {
    primary: 'badge badge-primary',
    secondary: 'badge badge-secondary',
    success: 'badge badge-success',
    warning: 'badge badge-warning', 
    error: 'badge badge-error',
    ghost: 'badge badge-ghost'
  }
} as const;

// ===== THEME UTILITIES =====

/**
 * Apply a theme to the document
 */
export const applyTheme = (themeName: string) => {
  document.documentElement.setAttribute('data-theme', themeName);
};

/**
 * Get the current theme from localStorage or default
 */
export const getCurrentTheme = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('greedy-theme') || THEME.name;
  }
  return THEME.name;
};

/**
 * Set and persist a theme
 */
export const setTheme = (themeName: string) => {
  applyTheme(themeName);
  if (typeof window !== 'undefined') {
    localStorage.setItem('greedy-theme', themeName);
  }
};

/**
 * Initialize theme on app startup
 */
export const initializeTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = getCurrentTheme();
    applyTheme(savedTheme);
  }
};

// ===== EXPORT ALL =====
export default {
  THEME,
  COMPONENT_COLORS,
  getColor,
  getComponentColors,
  buildClasses,
  applyThemeColor,
  STYLE_PRESETS,
  // Theme switching utilities
  applyTheme,
  getCurrentTheme,
  setTheme,
  initializeTheme
};