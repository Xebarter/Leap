"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatPrice } from "@/lib/utils"
import { 
  Plus, Pencil, Trash2, Search, MoreHorizontal, 
  MapPin, Home, Bed, DollarSign, Building2, Eye, EyeOff, Filter
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ApartmentCreationWizard, ApartmentEditData } from "@/components/adminView/apartment-creation-wizard"
import { PropertyCreateForm } from "./PropertyCreateForm"
import { Property, PropertyBlock, PropertyUnit } from "./types"
import { getOrCreateBlock, createPropertiesFromFloorUnitConfig } from "./property-service"

interface PropertyManagerProps {
  initialProperties: Property[]
  initialBlocks: PropertyBlock[]
  initialUnits: PropertyUnit[]
}

/**
 * Main Property Manager component for admin dashboard
 */
export function PropertyManager({ 
  initialProperties, 
  initialBlocks,
  initialUnits
}: PropertyManagerProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [blocks, setBlocks] = useState<PropertyBlock[]>(initialBlocks);
  const [units, setUnits] = useState<PropertyUnit[]>(initialUnits);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState("properties");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  
  // State for property type selection
  const [showPropertyTypeSelector, setShowPropertyTypeSelector] = useState(false);
  const [showApartmentWizard, setShowApartmentWizard] = useState(false);
  
  // State for editing apartments
  const [editingApartmentData, setEditingApartmentData] = useState<ApartmentEditData | null>(null);
  const [isLoadingApartmentData, setIsLoadingApartmentData] = useState(false);

  // Refresh data from server
  const refreshData = async () => {
    try {
      const supabase = createClient();
      
      const { data: propsData } = await supabase
        .from('properties')
        .select('*, property_blocks(*), property_units(*)')
        .order('created_at', { ascending: false });
      
      const { data: blocksData } = await supabase
        .from('property_blocks')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: unitsData } = await supabase
        .from('property_units')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (propsData) setProperties(propsData);
      if (blocksData) setBlocks(blocksData);
      if (unitsData) setUnits(unitsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Handle property submission
  const handlePropertySubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Extract form data
      const title = formData.get("title") as string;
      const location = formData.get("location") as string;
      const description = formData.get("description") as string;
      const category = formData.get("category") as string;
      const price = parseFloat(formData.get("price") as string);
      const bedrooms = parseInt(formData.get("bedrooms") as string);
      const bathrooms = parseInt(formData.get("bathrooms") as string);
      const mainPropertyImage = formData.get("main_property_image") as string;
      const videoUrl = formData.get("video_url") as string;
      const minimumInitialMonths = parseInt(formData.get("minimum_initial_months") as string) || 1;
      const totalFloors = parseInt(formData.get("total_floors") as string) || 1;
      const unitsConfig = formData.get("units_config") as string;
      const floorUnitConfigStr = formData.get("floor_unit_config") as string;
      const buildingName = formData.get("building_name") as string;
      
      // Check if this is an apartment with floor unit configuration
      if (category === "Apartment" && floorUnitConfigStr) {
        const floorUnitConfig = JSON.parse(floorUnitConfigStr);
        const allImageUrls = JSON.parse(formData.get("all_image_urls") as string || "[]");
        
        await createPropertiesFromFloorUnitConfig(
          supabase,
          {
            title: buildingName || title,
            location,
            description,
            category,
            price_ugx: 0,
            image_url: mainPropertyImage,
            video_url: videoUrl,
            minimum_initial_months: minimumInitialMonths
          },
          floorUnitConfig,
          buildingName,
          allImageUrls
        );
      } else {
        // Regular property creation
        const propertyData: any = {
          title,
          location,
          description,
          price_ugx: Math.round(price * 100),
          category,
          bedrooms,
          bathrooms,
          image_url: mainPropertyImage,
          video_url: videoUrl,
          minimum_initial_months: minimumInitialMonths,
          total_floors: totalFloors,
          units_config: unitsConfig,
          is_active: true,
        };

        // Handle block association
        if (formData.get("add_to_existing_block")) {
          propertyData.block_id = formData.get("existing_block_id") as string;
        }

        if (editingProperty) {
          // Update existing property
          const { error } = await supabase
            .from('properties')
            .update(propertyData)
            .eq('id', editingProperty.id);
          
          if (error) throw error;
        } else {
          // Create new property
          const { error } = await supabase
            .from('properties')
            .insert(propertyData);
          
          if (error) throw error;
        }
      }

      await refreshData();
      setIsOpen(false);
      setEditingProperty(null);
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Failed to save property');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle property deletion
  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
      
      if (error) throw error;
      
      await refreshData();
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  // Open create dialog
  const handleCreate = () => {
    setEditingProperty(null);
    setShowPropertyTypeSelector(true);
    setIsOpen(true);
  };

  // Open edit dialog - for apartments, load full block data
  const handleEdit = async (property: Property) => {
    // Check if this is an apartment property with a block
    if (property.category === 'Apartment' && property.block_id) {
      setIsLoadingApartmentData(true);
      try {
        const { fetchApartmentBlockData } = await import('./apartment-edit-service');
        const blockData = await fetchApartmentBlockData(property.id);
        
        if (blockData) {
          // Set editing data with full block configuration
          setEditingApartmentData({
            blockId: blockData.blockId,
            blockName: blockData.blockName,
            location: blockData.location,
            totalFloors: blockData.totalFloors,
            buildingName: blockData.buildingName,
            minimumInitialMonths: blockData.minimumInitialMonths,
            floorConfig: blockData.floorConfig,
            category: 'Apartment',
            existingPropertyIds: blockData.existingPropertyIds
          });
          setShowApartmentWizard(true);
        } else {
          // Fall back to regular edit if block data fetch fails
          setEditingProperty(property);
        }
      } catch (error) {
        console.error('Error loading apartment block data:', error);
        // Fall back to regular edit
        setEditingProperty(property);
      } finally {
        setIsLoadingApartmentData(false);
      }
    } else {
      // Regular property edit
      setEditingProperty(property);
    }
    
    setIsOpen(true);
  };

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Filter units
  const filteredUnits = units.filter(unit => {
    if (showAvailableOnly && !unit.is_available) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Property Management</h2>
          <p className="text-muted-foreground">Manage all properties, blocks, and units</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="properties">
            <Home className="h-4 w-4 mr-2" />
            Properties ({properties.length})
          </TabsTrigger>
          <TabsTrigger value="blocks">
            <Building2 className="h-4 w-4 mr-2" />
            Blocks ({blocks.length})
          </TabsTrigger>
          <TabsTrigger value="units">
            <Bed className="h-4 w-4 mr-2" />
            Units ({units.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {activeTab === "units" && (
          <Button
            variant="outline"
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAvailableOnly ? "Show All" : "Available Only"}
          </Button>
        )}
      </div>

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No properties found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {property.image_url && (
                          <img
                            src={property.image_url}
                            alt={property.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{property.title}</div>
                          {property.property_blocks && (
                            <div className="text-xs text-muted-foreground">
                              Block: {property.property_blocks.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {property.location}
                      </div>
                    </TableCell>
                    <TableCell>{property.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {formatPrice(property.price_ugx / 100)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(property)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(property.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Blocks Tab */}
      {activeTab === "blocks" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => (
            <div key={block.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{block.name}</h3>
                  <p className="text-sm text-muted-foreground">{block.location}</p>
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{block.total_floors}</div>
                  <div className="text-xs text-muted-foreground">Floors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{block.total_units}</div>
                  <div className="text-xs text-muted-foreground">Units</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Units Tab */}
      {activeTab === "units" && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit Number</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No units found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unit_number}</TableCell>
                    <TableCell>Floor {unit.floor_number}</TableCell>
                    <TableCell>{unit.unit_number}</TableCell>
                    <TableCell>{unit.bedrooms} bed • {unit.bathrooms} bath</TableCell>
                    <TableCell>{formatPrice((unit as any).price_ugx / 100)}</TableCell>
                    <TableCell>
                      {unit.is_available ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Eye className="h-3 w-3 mr-1" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Occupied
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setEditingProperty(null);
          setEditingApartmentData(null);
          setShowApartmentWizard(false);
          setShowPropertyTypeSelector(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProperty 
                ? "Edit Property" 
                : editingApartmentData 
                  ? `Edit ${editingApartmentData.buildingName}` 
                  : "Create New Property"}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingApartmentData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading building configuration...</p>
              </div>
            </div>
          ) : showApartmentWizard && editingApartmentData ? (
            <ApartmentCreationWizard
              onComplete={async () => {
                await refreshData();
                setIsOpen(false);
                setEditingApartmentData(null);
                setShowApartmentWizard(false);
              }}
              onCancel={() => {
                setIsOpen(false);
                setEditingApartmentData(null);
                setShowApartmentWizard(false);
              }}
              editData={editingApartmentData}
            />
          ) : showPropertyTypeSelector && !editingProperty ? (
            <div className="space-y-4 py-6">
              <p className="text-sm text-muted-foreground">What type of property would you like to create?</p>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => {
                    setShowApartmentWizard(true);
                    setShowPropertyTypeSelector(false);
                  }}
                  className="border-2 rounded-lg p-6 hover:border-primary transition-colors text-left"
                >
                  <Building2 className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Apartment Building</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure multiple floors and unit types. Each unit type becomes a separate listing.
                  </p>
                </button>
                <button
                  onClick={() => {
                    setShowPropertyTypeSelector(false);
                  }}
                  className="border-2 rounded-lg p-6 hover:border-primary transition-colors text-left"
                >
                  <Home className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Single Property</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a single property listing (house, condo, villa, etc.)
                  </p>
                </button>
              </div>
            </div>
          ) : showApartmentWizard ? (
            <ApartmentCreationWizard
              onComplete={async () => {
                await refreshData();
                setIsOpen(false);
                setShowApartmentWizard(false);
              }}
              onCancel={() => {
                setIsOpen(false);
                setShowApartmentWizard(false);
              }}
            />
          ) : (
            <PropertyCreateForm
              onSubmit={handlePropertySubmit}
              onCancel={() => setIsOpen(false)}
              isLoading={isLoading}
              property={editingProperty}
              blocks={blocks}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
