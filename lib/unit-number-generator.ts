/**
 * Utility functions for generating unique 10-digit unit numbers
 * 
 * Format: PPPPFUUUCC
 * - PPPP: Property/Block identifier (4 digits)
 * - F: Floor number (1 digit, 0-9, with special handling for floors > 9)
 * - UUU: Unit counter on that floor (3 digits, 001-999)
 * - CC: Check digits for validation (2 digits)
 * 
 * Example: 1234510201
 * - Property: 1234
 * - Floor: 5
 * - Unit: 102 (102nd unit on floor 5)
 * - Check: 01
 */

/**
 * Generate a 10-digit unique unit number
 * @param propertyId - UUID or identifier for the property/block
 * @param floorNumber - Floor number (1-99)
 * @param unitIndex - Unit index on that floor (1-999)
 * @returns A 10-digit string unit number
 */
export function generateUnitNumber(
  propertyId: string,
  floorNumber: number,
  unitIndex: number
): string {
  // Generate 4-digit property hash from UUID
  const propertyHash = hashPropertyId(propertyId);
  
  // Floor number (handle floors > 9 by using modulo)
  const floorDigit = floorNumber % 10;
  
  // Unit counter (3 digits, pad with zeros)
  const unitCounter = String(unitIndex).padStart(3, '0').slice(0, 3);
  
  // Combine: PPPP + F + UUU
  const baseNumber = `${propertyHash}${floorDigit}${unitCounter}`;
  
  // Calculate check digits
  const checkDigits = calculateCheckDigits(baseNumber);
  
  // Final 10-digit number
  return `${baseNumber}${checkDigits}`;
}

/**
 * Hash a property UUID to a 4-digit number
 * Uses simple hash algorithm for consistency
 */
function hashPropertyId(propertyId: string): string {
  // Remove hyphens and take relevant characters
  const cleaned = propertyId.replace(/-/g, '');
  
  // Create a numeric hash
  let hash = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive 4-digit number
  const positiveHash = Math.abs(hash);
  const fourDigit = (positiveHash % 9000) + 1000; // Range: 1000-9999
  
  return String(fourDigit);
}

/**
 * Calculate check digits using Luhn algorithm variant
 * @param baseNumber - The 8-digit base number (PPPPFUUU)
 * @returns 2-digit check digits
 */
function calculateCheckDigits(baseNumber: string): string {
  let sum = 0;
  let isEven = false;
  
  // Process digits from right to left
  for (let i = baseNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(baseNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  // Calculate check digit
  const checkSum = (10 - (sum % 10)) % 10;
  
  // Add second check digit based on sum of all digits
  const digitSum = baseNumber.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  const secondCheck = digitSum % 10;
  
  return `${checkSum}${secondCheck}`;
}

/**
 * Validate a 10-digit unit number
 * @param unitNumber - The 10-digit unit number to validate
 * @returns true if valid, false otherwise
 */
export function validateUnitNumber(unitNumber: string): boolean {
  // Check length
  if (unitNumber.length !== 10) {
    return false;
  }
  
  // Check if all digits
  if (!/^\d{10}$/.test(unitNumber)) {
    return false;
  }
  
  // Extract base and check digits
  const baseNumber = unitNumber.slice(0, 8);
  const providedCheck = unitNumber.slice(8, 10);
  
  // Calculate expected check digits
  const expectedCheck = calculateCheckDigits(baseNumber);
  
  return providedCheck === expectedCheck;
}

/**
 * Parse a 10-digit unit number into its components
 * @param unitNumber - The 10-digit unit number
 * @returns Object with property hash, floor, and unit index
 */
export function parseUnitNumber(unitNumber: string): {
  propertyHash: string;
  floorNumber: number;
  unitIndex: number;
  isValid: boolean;
} {
  if (unitNumber.length !== 10) {
    return { propertyHash: '', floorNumber: 0, unitIndex: 0, isValid: false };
  }
  
  const propertyHash = unitNumber.slice(0, 4);
  const floorNumber = parseInt(unitNumber[4], 10);
  const unitIndex = parseInt(unitNumber.slice(5, 8), 10);
  const isValid = validateUnitNumber(unitNumber);
  
  return {
    propertyHash,
    floorNumber,
    unitIndex,
    isValid
  };
}

/**
 * Format a unit number for display (e.g., "1234-5-102-01")
 * @param unitNumber - The 10-digit unit number
 * @returns Formatted string
 */
export function formatUnitNumber(unitNumber: string): string {
  if (unitNumber.length !== 10) {
    return unitNumber;
  }
  
  return `${unitNumber.slice(0, 4)}-${unitNumber[4]}-${unitNumber.slice(5, 8)}-${unitNumber.slice(8, 10)}`;
}

/**
 * Generate sequential unit numbers for multiple units on the same floor
 * @param propertyId - UUID or identifier for the property/block
 * @param floorNumber - Floor number
 * @param count - Number of units to generate
 * @param startIndex - Starting unit index (default: 1)
 * @returns Array of 10-digit unit numbers
 */
export function generateSequentialUnitNumbers(
  propertyId: string,
  floorNumber: number,
  count: number,
  startIndex: number = 1
): string[] {
  const unitNumbers: string[] = [];
  
  for (let i = 0; i < count; i++) {
    unitNumbers.push(generateUnitNumber(propertyId, floorNumber, startIndex + i));
  }
  
  return unitNumbers;
}
