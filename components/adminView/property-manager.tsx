/**
 * Property Manager - Main export file
 * 
 * This file re-exports all property manager components and utilities
 * from the modular structure in the property-manager directory.
 * 
 * The large property-manager.tsx file has been refactored into smaller modules:
 * - types.ts: TypeScript interfaces and types
 * - utils.ts: Utility functions for unit types
 * - property-service.ts: API calls and data operations
 * - ImageUploadArea.tsx: Image upload component
 * - PropertyCreateForm.tsx: Property creation/editing form
 * - PropertyManager.tsx: Main property manager component
 */

// Re-export everything from the modular structure
export * from "./property-manager"

// For backward compatibility, also export named exports
export { PropertyManager } from "./property-manager/PropertyManager"
export { PropertyCreateForm } from "./property-manager/PropertyCreateForm"
export { ImageUploadArea } from "./property-manager/ImageUploadArea"
export { getOrCreateBlock, createPropertiesFromFloorUnitConfig } from "./property-manager/property-service"
export { generateBlockName, getBedroomsForUnitType, getBathroomsForUnitType, getUnitTypeLabel, extractUniqueUnitTypes } from "./property-manager/utils"
