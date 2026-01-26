/**
 * Utility functions for consistent date formatting across server and client
 * to prevent hydration mismatches
 */

/**
 * Format a date consistently without using locale-dependent methods
 * Returns format: "Jan 15, 2024"
 */
export function formatDateConsistent(dateInput: string | Date | null | undefined): string {
  if (!dateInput) {
    return 'N/A';
  }
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Format a date in ISO format: "2024-01-15"
 * This is the most reliable format for server/client consistency
 */
export function formatDateISO(dateInput: string | Date | null | undefined): string {
  if (!dateInput) {
    return '';
  }
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Format currency consistently without locale
 * Returns format: "1,234,567"
 */
export function formatCurrencyNumber(value: number): string {
  return value.toLocaleString('en-US', { useGrouping: true, maximumFractionDigits: 0 });
}
