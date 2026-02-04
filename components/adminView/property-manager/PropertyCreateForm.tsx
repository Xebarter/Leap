"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus } from "lucide-react"
import { PropertyDetailsUploadImproved } from "@/components/adminView/property-details-upload-improved"
import { PropertyImageManager } from "@/components/adminView/property-image-manager"
import { FloorUnitTypeConfigurator, FloorUnitTypeConfiguration } from "@/components/adminView/floor-unit-type-configurator"
import { ImageUploadArea } from "./ImageUploadArea"
import { PropertyCreateFormProps } from "./types"

/**
 * Property creation and editing form component
 */
export function PropertyCreateForm({
  onSubmit,
  onCancel,
  isLoading,
  property,
  blocks = []
}: PropertyCreateFormProps) {
  const [allImageUrls, setAllImageUrls] = useState<string[]>(property?.image_urls ?? [])
  const [mainPropertyImage, setMainPropertyImage] = useState<string>(property?.image_url ?? '')
  const [videoUrl, setVideoUrl] = useState<string>(property?.video_url ?? '')
  const [useExistingBlock, setUseExistingBlock] = useState(!!property?.block_id)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(property?.block_id ?? null)
  const [propertyDetails, setPropertyDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [floorUnitConfig, setFloorUnitConfig] = useState<FloorUnitTypeConfiguration | null>(null);
  const [totalFloors, setTotalFloors] = useState<number>(property?.total_floors ?? 1);
  const [propertyPrice, setPropertyPrice] = useState<number>(property?.price_ugx ? property.price_ugx / 100 : 1000000);
  const [propertyBedrooms, setPropertyBedrooms] = useState<number>(property?.bedrooms ?? 1);
  const [propertyBathrooms, setPropertyBathrooms] = useState<number>(property?.bathrooms ?? 1);
  const [selectedCategory, setSelectedCategory] = useState<string>(property?.category ?? '');
  const [buildingName, setBuildingName] = useState<string>('')
  const [landlords, setLandlords] = useState<any[]>([])
  const [selectedLandlordId, setSelectedLandlordId] = useState<string>(property?.landlord_id ?? '')

  // Load landlords on component mount
  useEffect(() => {
    loadLandlords();
  }, []);

  // Load property details when editing
  useEffect(() => {
    if (property?.id) {
      loadPropertyDetails();
    }
  }, [property?.id]);

  const loadLandlords = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("landlord_profiles")
        .select(`
          id,
          user_id,
          business_name,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq("status", "active")
        .order("business_name");

      if (!error && data) {
        setLandlords(data);
      }
    } catch (error) {
      console.error("Error loading landlords:", error);
    }
  };

  const loadPropertyDetails = async () => {
    if (!property?.id) return;
    
    console.log('🔍 Loading property details for property ID:', property.id);
    setLoadingDetails(true);
    try {
      const supabase = createClient();
      
      // Fetch property details
      const { data: detailsData, error: detailsError } = await supabase
        .from('property_details')
        .select('*')
        .eq('property_id', property.id);

      if (detailsError) {
        console.error("❌ Error loading property details:", detailsError);
        return;
      }

      console.log('✅ Found property details:', detailsData?.length || 0);

      // Fetch images for each detail
      const detailsWithImages: any[] = [];
      if (detailsData) {
        for (const detail of detailsData) {
          const { data: imagesData, error: imagesError } = await supabase
            .from('property_detail_images')
            .select('*')
            .eq('property_detail_id', detail.id)
            .order('display_order', { ascending: true });

          if (!imagesError) {
            console.log(`✅ Found ${imagesData?.length || 0} images for detail: ${detail.detail_name}`);
            detailsWithImages.push({
              ...detail,
              images: imagesData || []
            });
          } else {
            console.error(`❌ Error loading images for detail ${detail.id}:`, imagesError);
            detailsWithImages.push({
              ...detail,
              images: []
            });
          }
        }
      }

      console.log('📦 Total details with images:', detailsWithImages.length);
      setPropertyDetails(detailsWithImages);
    } catch (error) {
      console.error("❌ Error loading property details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Memoized callback for floor unit config changes
  const handleFloorUnitConfigChange = useCallback((config: FloorUnitTypeConfiguration) => {
    setFloorUnitConfig(config);
  }, []);

  // Handle image upload success
  const handleUploadSuccess = (url: string) => {
    setAllImageUrls(prev => [...prev, url])
    // If this is the first image, set it as the main property image
    if (!mainPropertyImage) {
      setMainPropertyImage(url)
    }
  }

  // Remove image from arrays
  const removeImage = (url: string) => {
    setAllImageUrls(prev => prev.filter(u => u !== url))
    if (mainPropertyImage === url) {
      // Set another image as main if available
      const remainingImages = allImageUrls.filter(u => u !== url)
      setMainPropertyImage(remainingImages[0] || '')
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Add additional data that's not in form fields
    formData.set("all_image_urls", JSON.stringify(allImageUrls))
    formData.set("main_property_image", mainPropertyImage)
    formData.set("video_url", videoUrl)
    
    // Add floor unit type configuration
    if (floorUnitConfig) {
      formData.set("floor_unit_config", JSON.stringify(floorUnitConfig))
      formData.set("total_floors", floorUnitConfig.totalFloors.toString())
      
      // Generate units config string for backward compatibility
      const unitsPerFloor = floorUnitConfig.floors.map(f => 
        f.unitTypes.reduce((sum, ut) => sum + ut.count, 0)
      ).join(',')
      formData.set("units_config", unitsPerFloor)
    } else {
      // Fallback to old method if no floor config
      const totalFloorsVal = formData.get("total_floors") as string
      const unitsConfig = formData.get("units_config") as string
      formData.set("total_floors", totalFloorsVal || "1")
      formData.set("units_config", unitsConfig || "")
    }
    
    // Add block selection data if applicable
    if (useExistingBlock && selectedBlockId) {
      formData.set("add_to_existing_block", "on")
      formData.set("existing_block_id", selectedBlockId)
    }

    // Add landlord_id if selected
    if (selectedLandlordId) {
      formData.set("landlord_id", selectedLandlordId)
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        {/* Category Selection */}
        <div className="grid gap-4">
          <h3 className="text-sm font-medium">Property Category</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              name="category" 
              value={selectedCategory ?? ''} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Condo">Condo</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Townhouse">Townhouse</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {selectedCategory === 'Apartment' 
                ? "Each unit type will become its own property listing with separate images, pricing, and details"
                : "Select \"Apartment\" to configure building floors and units"}
            </p>
          </div>
        </div>

        {/* Landlord Selection */}
        <div className="grid gap-4">
          <h3 className="text-sm font-medium">Property Owner</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="landlord_id">Landlord/Owner (Optional)</Label>
            <Select 
              name="landlord_id" 
              value={selectedLandlordId} 
              onValueChange={setSelectedLandlordId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select landlord (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None - Unassigned</SelectItem>
                {landlords.map((landlord) => (
                  <SelectItem key={landlord.id} value={landlord.id}>
                    {landlord.business_name || landlord.profiles?.full_name || landlord.profiles?.email || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Assign this property to a specific landlord for ownership tracking and commission management
            </p>
          </div>
        </div>

        {/* For Apartments: Show Building-Level Info Only */}
        {selectedCategory === 'Apartment' ? (
          <>
            {/* Building Information */}
            <div className="grid gap-4">
              <h3 className="text-sm font-medium">Building Information</h3>
              <p className="text-xs text-muted-foreground -mt-2">
                Enter building-level details. Property-specific info (images, pricing, descriptions) will be configured per unit type below.
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="building_name">Building Name *</Label>
                  <Input
                    id="building_name"
                    name="building_name"
                    placeholder="e.g., Sunset Apartments, Palm Heights"
                    value={buildingName ?? ''}
                    onChange={(e) => setBuildingName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Used as prefix for unit type listings (e.g., "Palm Heights - 2 Bedroom")
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Enter building location"
                    defaultValue={property?.location || ''}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="google_maps_embed_url">Google Maps Link (Optional)</Label>
                <Input
                  id="google_maps_embed_url"
                  name="google_maps_embed_url"
                  placeholder="Paste Google Maps link (e.g., https://maps.google.com/?q=...)"
                  defaultValue={property?.google_maps_embed_url || ''}
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the URL from Google Maps. Visitors will see an interactive map on the property details page.
                </p>
              </div>
              
              {/* Hidden fields for form submission compatibility */}
              <input type="hidden" name="title" value={buildingName || 'Apartment Building'} />
              <input type="hidden" name="description" value={`Apartment units at ${buildingName}`} />
              <input type="hidden" name="price" value="0" />
              <input type="hidden" name="bedrooms" value="1" />
              <input type="hidden" name="bathrooms" value="1" />
            </div>

            {/* Number of Floors */}
            <div className="grid gap-4">
              <h3 className="text-sm font-medium">Building Structure</h3>
              <div className="grid gap-2">
                <Label htmlFor="total_floors">Number of Floors *</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon" 
                    onClick={() => setTotalFloors(Math.max(1, totalFloors - 1))}
                    disabled={totalFloors <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="total_floors"
                    name="total_floors"
                    type="number"
                    min="1"
                    max="50"
                    value={isNaN(totalFloors) ? 1 : totalFloors}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setTotalFloors(isNaN(val) ? 1 : val);
                    }}
                    className="w-24 text-center"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon" 
                    onClick={() => setTotalFloors(Math.min(50, totalFloors + 1))}
                    disabled={totalFloors >= 50}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">floors</span>
                </div>
              </div>
            </div>

            {/* Minimum Initial Deposit - Building Level */}
            <div className="grid gap-4">
              <h3 className="text-sm font-medium">Deposit Policy</h3>
              <div className="grid gap-2 max-w-xs">
                <Label htmlFor="minimum_initial_months">
                  {selectedCategory === 'hostel' ? 'Minimum Initial Deposit' : 'Minimum Initial Deposit (Months)'} *
                </Label>
                {selectedCategory === 'hostel' ? (
                  <Select 
                    name="minimum_initial_months" 
                    defaultValue={property?.minimum_initial_months?.toString() || '1'}
                    required
                  >
                    <SelectTrigger id="minimum_initial_months">
                      <SelectValue placeholder="Select deposit period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Half Semester</SelectItem>
                      <SelectItem value="2">Full Semester</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="minimum_initial_months"
                    name="minimum_initial_months"
                    type="number"
                    min="1"
                    defaultValue={property?.minimum_initial_months || '1'}
                    required
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedCategory === 'hostel' 
                    ? 'Choose whether students pay for half or full semester upfront'
                    : 'Applies to all unit types in this building'}
                </p>
              </div>
            </div>

            {/* Floor and Unit Type Configuration */}
            <div className="border-t pt-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium">Unit Type Configuration</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure floors, then add <strong>images, pricing, descriptions, and features</strong> for each unit type in the "Unit Type Details" tab
                </p>
              </div>
              <FloorUnitTypeConfigurator
                totalFloors={totalFloors}
                onChange={handleFloorUnitConfigChange}
                propertyPrice={propertyPrice}
                propertyBedrooms={propertyBedrooms}
                propertyBathrooms={propertyBathrooms}
                buildingName={buildingName}
                buildingLocation={property?.location || ''}
              />
            </div>

            {/* Image Management - For apartments */}
            {property?.id && (
              <div className="border-t pt-6">
                <PropertyImageManager
                  propertyId={property.id}
                  mainImageUrl={mainPropertyImage}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* For Non-Apartments: Show Full Property Form */}
            {/* Basic Information */}
            <div className="grid gap-4">
              <h3 className="text-sm font-medium">Basic Information</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Enter property title"
                    defaultValue={property?.title || ''}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Enter property location"
                    defaultValue={property?.location || ''}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="google_maps_embed_url_single">Google Maps Link (Optional)</Label>
                <Input
                  id="google_maps_embed_url_single"
                  name="google_maps_embed_url"
                  placeholder="Paste Google Maps link (e.g., https://maps.google.com/?q=...)"
                  defaultValue={property?.google_maps_embed_url || ''}
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the URL from Google Maps. Visitors will see an interactive map on the property details page.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your property..."
                  defaultValue={property?.description || ''}
                  required
                />
              </div>
            </div>

            {/* Pricing - For non-apartments */}
            <div className="grid gap-4">
              <h3 className="text-sm font-medium">Pricing</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="price">Monthly Fee (UGX) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={isNaN(propertyPrice) ? 0 : propertyPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setPropertyPrice(isNaN(val) ? 0 : val);
                    }}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="minimum_initial_months">
                    {selectedCategory === 'hostel' ? 'Minimum Initial Deposit' : 'Minimum Initial Deposit (Months)'}
                  </Label>
                  {selectedCategory === 'hostel' ? (
                    <Select 
                      name="minimum_initial_months" 
                      defaultValue={property?.minimum_initial_months?.toString() || '1'}
                    >
                      <SelectTrigger id="minimum_initial_months">
                        <SelectValue placeholder="Select deposit period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Half Semester</SelectItem>
                        <SelectItem value="2">Full Semester</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="minimum_initial_months"
                      name="minimum_initial_months"
                      type="number"
                      min="1"
                      defaultValue={property?.minimum_initial_months || '1'}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Property Details - For non-apartments */}
            <div className="grid gap-4">
              <h3 className="text-sm font-medium">Property Details</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="0"
                    value={isNaN(propertyBedrooms) ? 1 : propertyBedrooms}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setPropertyBedrooms(isNaN(val) ? 1 : val);
                    }}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    min="0"
                    value={isNaN(propertyBathrooms) ? 1 : propertyBathrooms}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setPropertyBathrooms(isNaN(val) ? 1 : val);
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Media - For non-apartments */}
            <div className="grid gap-4">
              <h3 className="text-sm font-medium">Media</h3>
              
              <div className="grid gap-2">
                <Label>Property Images</Label>
                <ImageUploadArea
                  onUploadSuccess={handleUploadSuccess}
                  isLoading={isLoading}
                />
                
                {allImageUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    {allImageUrls.map((url) => (
                      <div key={url} className="relative group">
                        <img
                          src={url}
                          alt="Property"
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm"
                        >
                          Remove
                        </button>
                        {mainPropertyImage === url && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="main_property_image">Main Property Image</Label>
                <Select
                  value={mainPropertyImage || ''}
                  onValueChange={setMainPropertyImage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select main image">
                      {mainPropertyImage ? (
                        <img
                          src={mainPropertyImage}
                          alt="Main"
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        "Select main image"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allImageUrls.length === 0 ? (
                      <SelectItem value="__no_images__" disabled>No images uploaded</SelectItem>
                    ) : (
                      allImageUrls.map((url) => (
                        <SelectItem key={url} value={url}>
                          <div className="flex items-center gap-2">
                            <img
                              src={url}
                              alt="Preview"
                              className="w-8 h-8 object-cover rounded"
                            />
                            <span>Main Image</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="video_url">Video URL (YouTube or TikTok)</Label>
                <Input
                  id="video_url"
                  name="video_url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl ?? ''}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Add a YouTube or TikTok video URL to showcase your property.
                </p>
              </div>
            </div>

            {/* Property Details with Images - For non-apartments */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-4">Property Details & Room Images</h3>
              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading property details...</div>
                </div>
              ) : (
                <PropertyDetailsUploadImproved
                  propertyId={property?.id || null}
                  initialDetails={propertyDetails}
                  onDetailsUpdated={setPropertyDetails}
                />
              )}
            </div>

            {/* Image Management - For non-apartments */}
            {property?.id && (
              <div className="border-t pt-6">
                <PropertyImageManager
                  propertyId={property.id}
                  mainImageUrl={mainPropertyImage}
                />
              </div>
            )}
          </>
        )}

        {/* Block Association - For all property types */}
        <div className="grid gap-4">
          <h3 className="text-sm font-medium">Block Association</h3>
          
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useExistingBlock"
                checked={useExistingBlock}
                onChange={(e) => {
                  setUseExistingBlock(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedBlockId(null);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="useExistingBlock" className="text-sm font-medium">
                Associate with an existing block
              </Label>
            </div>
            
            {useExistingBlock && (
              <div className="mt-2">
                <Label htmlFor="blockSelection">Select Block</Label>
                <div className="flex gap-2 mt-1">
                  <select
                    id="blockSelection"
                    value={selectedBlockId || ""}
                    onChange={(e) => setSelectedBlockId(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={blocks.length === 0}
                  >
                    <option value="">Select a block</option>
                    {blocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name} ({block.location})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This will link the property to an existing block.
                </p>
              </div>
            )}
            {useExistingBlock && blocks.length === 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                No existing blocks found.
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : property ? "Update Property" : "Create Property"}
          </Button>
        </div>
      </div>
    </form>
  )
}
