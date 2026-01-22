'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrencyNumber } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bed, ShowerHead, Home, Building } from 'lucide-react';

interface PropertyUnit {
  id: string;
  property_id: string;
  block_id: string;
  floor_number: number;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  is_available: boolean;
  title: string;
  price_ugx: number;
}

interface FloorPlanProps {
  propertyId: string;
  blockId: string;
}

export function FloorPlan({ propertyId, blockId }: FloorPlanProps) {
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [availableFloors, setAvailableFloors] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set mounted flag to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all properties in the block to get different unit types
  useEffect(() => {
    const fetchUnitsAndProperties = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Get all units for the block with associated property details
        const { data: unitsData, error: unitsError } = await supabase
          .from('property_units')
          .select(`
            id, 
            property_id, 
            block_id, 
            floor_number, 
            unit_number, 
            bedrooms, 
            bathrooms, 
            is_available,
            properties (
              title, 
              price_ugx,
              bedrooms,
              bathrooms
            )
          `)
          .eq('block_id', blockId)
          .order('floor_number', { ascending: false })
          .order('unit_number');
        
        if (unitsError) throw unitsError;
        
        if (unitsData) {
          // Transform the data to include property details properly
          const transformedUnits = unitsData.map((unit: any) => ({
            ...unit,
            title: unit.properties?.title || `Unit ${unit.unit_number}`,
            price_ugx: unit.properties?.price_ugx || 0,
            bedrooms: unit.bedrooms,
            bathrooms: unit.bathrooms
          }));
          
          setUnits(transformedUnits as PropertyUnit[]);
          
          // Extract unique floor numbers
          const floors = [...new Set(unitsData.map(unit => unit.floor_number))].sort((a, b) => b - a);
          setAvailableFloors(floors);
          
          // Default to the first floor if available
          if (floors.length > 0 && selectedFloor === null) {
            setSelectedFloor(floors[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching units:', err);
        setError('Failed to load floor plan information');
      } finally {
        setLoading(false);
      }
    };

    if (blockId) {
      fetchUnitsAndProperties();
    }
  }, [propertyId, blockId]);

  const unitsForSelectedFloor = selectedFloor 
    ? units.filter(unit => unit.floor_number === selectedFloor) 
    : [];

  // Prevent hydration mismatch - only render after mounting
  if (!mounted || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Floor Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading floor plan...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Floor Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 py-4">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Floor Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Select Floor</h3>
          <div className="flex flex-wrap gap-2">
            {availableFloors.map(floor => (
              <Button
                key={floor}
                variant={selectedFloor === floor ? "default" : "outline"}
                onClick={() => setSelectedFloor(floor)}
                className="px-3 py-1 text-sm"
              >
                Floor {floor}
              </Button>
            ))}
          </div>
        </div>

        {selectedFloor !== null && (
          <div>
            <h3 className="text-lg font-medium mb-3">Units on Floor {selectedFloor}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unitsForSelectedFloor.length > 0 ? (
                unitsForSelectedFloor.map(unit => (
                  <div 
                    key={unit.id} 
                    className={`border rounded-lg p-4 transition-all ${
                      unit.is_available 
                        ? 'border-green-500 bg-green-50/30 hover:bg-green-50 cursor-pointer' 
                        : 'border-gray-300 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold flex items-center gap-1">
                          <Home className="h-4 w-4" />
                          Unit {unit.unit_number}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {unit.title}
                        </p>
                      </div>
                      
                      {unit.is_available ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                          Occupied
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center text-sm">
                        <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                        {unit.bedrooms}
                      </div>
                      <div className="flex items-center text-sm">
                        <ShowerHead className="h-4 w-4 mr-1 text-muted-foreground" />
                        {unit.bathrooms}
                      </div>
                      <div className="ml-auto font-semibold">
                        {formatCurrencyNumber(Math.floor(unit.price_ugx / 100))} UGX/mo
                      </div>
                    </div>
                    
                    {unit.is_available && (
                      <div className="mt-3">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            // In a real implementation, this would trigger the booking process
                            // for the selected unit
                            alert(`Selected unit: ${unit.unit_number} on floor ${unit.floor_number}`);
                          }}
                        >
                          Select Unit
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground col-span-2">
                  No units available on this floor
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}