// Utility functions for property management

import { FloorUnitTypeConfiguration } from "@/components/adminView/floor-unit-type-configurator"
import { UniqueUnitType } from "./types"

/**
 * Get bedrooms count from unit type
 */
export function getBedroomsForUnitType(unitType: string): number {
  const bedroomMap: Record<string, number> = {
    'Studio': 0,
    '1BR': 1,
    '2BR': 2,
    '3BR': 3,
    '4BR': 4,
    'Penthouse': 4
  };
  return bedroomMap[unitType] ?? 1;
}

/**
 * Get bathrooms count from unit type
 */
export function getBathroomsForUnitType(unitType: string): number {
  const bathroomMap: Record<string, number> = {
    'Studio': 1,
    '1BR': 1,
    '2BR': 2,
    '3BR': 2,
    '4BR': 3,
    'Penthouse': 3
  };
  return bathroomMap[unitType] ?? 1;
}

/**
 * Get unit type label
 */
export function getUnitTypeLabel(unitType: string): string {
  const labelMap: Record<string, string> = {
    'Studio': 'Studio',
    '1BR': '1 Bedroom',
    '2BR': '2 Bedroom',
    '3BR': '3 Bedroom',
    '4BR': '4 Bedroom',
    'Penthouse': 'Penthouse'
  };
  return labelMap[unitType] ?? unitType;
}

/**
 * Generate a unique block name
 */
export function generateBlockName(location: string): string {
  const now = new Date();
  return `${location.substring(0, 10).replace(/\s+/g, '')}-${now.getTime().toString().slice(-6)}`;
}

/**
 * Extract unique unit types from floor configuration
 */
export function extractUniqueUnitTypes(floorConfig: FloorUnitTypeConfiguration): UniqueUnitType[] {
  const unitTypeMap = new Map<string, UniqueUnitType>();

  for (const floor of floorConfig.floors) {
    for (const ut of floor.unitTypes) {
      const existing = unitTypeMap.get(ut.type);
      if (existing) {
        // Update existing entry
        existing.totalUnits += ut.count;
        existing.unitsPerFloor.push({ floor: floor.floorNumber, count: ut.count });
        // Use the highest monthly fee if different across floors
        if (ut.monthlyFee > existing.monthlyFee) {
          existing.monthlyFee = ut.monthlyFee;
        }
      } else {
        // Create new entry
        unitTypeMap.set(ut.type, {
          type: ut.type,
          label: getUnitTypeLabel(ut.type),
          monthlyFee: ut.monthlyFee,
          bedrooms: getBedroomsForUnitType(ut.type),
          bathrooms: getBathroomsForUnitType(ut.type),
          totalUnits: ut.count,
          unitsPerFloor: [{ floor: floor.floorNumber, count: ut.count }]
        });
      }
    }
  }

  // Merge in unit type details (descriptions, custom titles, and images) if available
  if (floorConfig.unitTypeDetails) {
    for (const details of floorConfig.unitTypeDetails) {
      const unitType = unitTypeMap.get(details.type);
      if (unitType) {
        unitType.description = details.description;
        unitType.customTitle = details.title;
        unitType.imageUrl = details.imageUrl;
      }
    }
  }

  return Array.from(unitTypeMap.values());
}
