"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  MapPin,
  Home,
  ShowerHead,
  Bed,
  Building2,
  KeySquare,
  Eye,
  EyeOff,
  Filter,
  LayoutGrid,
  List,
  ArrowUpRight,
  Loader2,
  Star,
  UserCog
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { PropertyCreateForm } from "@/components/adminView/property-manager"
import { ApartmentCreationWizard, ApartmentEditData } from "@/components/adminView/apartment-creation-wizard"

// ... (Interfaces remain the same as your provided code)
interface PropertyUnit { id: string; property_id: string; block_id: string; floor_number: number; unit_number: string; bedrooms: number; bathrooms: number; is_available: boolean; created_at: string; }
interface PropertyBlock { id: string; name: string; location: string; total_floors: number; total_units: number; created_at: string; }
interface Property { id: string; property_code?: string; is_featured?: boolean; title: string; location: string; description: string; price_ugx: number; category: string; bedrooms: number; bathrooms: number; image_url: string; video_url: string; minimum_initial_months: number; total_floors: number; units_config: string; block_id?: string; created_at: string; property_blocks?: PropertyBlock; property_units?: PropertyUnit[]; }

export function ComprehensivePropertyManager({
  initialProperties,
  initialBlocks,
  initialUnits,
  userId
}: {
  initialProperties: Property[];
  initialBlocks: PropertyBlock[];
  initialUnits: PropertyUnit[];
  userId?: string;
}) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [blocks, setBlocks] = useState<PropertyBlock[]>(initialBlocks);
  const [units, setUnits] = useState<PropertyUnit[]>(initialUnits);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState("properties");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  
  // State for property type selection and apartment wizard
  const [showPropertyTypeSelector, setShowPropertyTypeSelector] = useState(false);
  const [showApartmentWizard, setShowApartmentWizard] = useState(false);
  const [editingApartmentData, setEditingApartmentData] = useState<ApartmentEditData | null>(null);
  const [isLoadingApartmentData, setIsLoadingApartmentData] = useState(false);

  // Reassign landlord dialog state
  const [landlords, setLandlords] = useState<any[]>([])
  const [reassignOpen, setReassignOpen] = useState(false)
  const [reassignProperty, setReassignProperty] = useState<any | null>(null)
  const [selectedLandlordId, setSelectedLandlordId] = useState<string>('none')
  const [reassignLoading, setReassignLoading] = useState(false)

  // Bulk selection + reassignment
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set())
  const [bulkLandlordId, setBulkLandlordId] = useState<string>('none')
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('landlord_profiles')
          .select(`id,business_name,profiles:user_id(full_name,email)`)
          .eq('status', 'active')
          .order('business_name')

        if (data) setLandlords(data)
      } catch (e) {
        console.error('Failed to load landlords:', e)
      }
    })()
  }, [])

  // Stats for the Dashboard Ribbon
  const stats = useMemo(() => ({
    totalProperties: properties.length,
    totalUnits: units.length,
    availableUnits: units.filter(u => u.is_available).length,
    occupancyRate: units.length > 0 ? Math.round(((units.length - units.filter(u => u.is_available).length) / units.length) * 100) : 0
  }), [properties, units]);

  const filteredProperties = properties.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.property_code && p.property_code.includes(searchQuery))
  );

  const visiblePropertyIds = useMemo(() => filteredProperties.map((p) => p.id), [filteredProperties])
  const allVisibleSelected = useMemo(
    () => visiblePropertyIds.length > 0 && visiblePropertyIds.every((id) => selectedPropertyIds.has(id)),
    [visiblePropertyIds, selectedPropertyIds]
  )

  const filteredUnits = units.filter(u =>
    (u.unit_number.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!showAvailableOnly || u.is_available)
  );

  // Toggle featured status for a property
  const handleToggleFeatured = async (property: Property) => {
    try {
      const supabase = createClient();
      const newFeaturedStatus = !property.is_featured;
      
      const { error } = await supabase
        .from('properties')
        .update({ is_featured: newFeaturedStatus })
        .eq('id', property.id);
      
      if (error) {
        // If column doesn't exist, show helpful message
        if (error.message?.includes('is_featured')) {
          toast.error('Please run the database migration to enable featured properties');
          return;
        }
        throw error;
      }
      
      // Update local state
      setProperties(prev => prev.map(p => 
        p.id === property.id ? { ...p, is_featured: newFeaturedStatus } : p
      ));
      
      toast.success(newFeaturedStatus ? 'Property marked as featured' : 'Property removed from featured');
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const allImageUrls = JSON.parse(formData.get("all_image_urls") as string) as string[];
      const primaryImageUrl = formData.get("main_property_image") as string || allImageUrls[0] || null;

      if (!userId) {
        toast.error("Authentication required");
        return;
      }

      // Get floor unit config if present (for apartments)
      const floorUnitConfigStr = formData.get("floor_unit_config") as string;
      const floorUnitConfig = floorUnitConfigStr ? JSON.parse(floorUnitConfigStr) : null;

      const requestBody = {
        title: (formData.get("title") as string)?.trim(),
        location: (formData.get("location") as string)?.trim(),
        description: (formData.get("description") as string)?.trim(),
        price: (formData.get("price") as string)?.trim(),
        category: formData.get("category"),
        bedrooms: formData.get("bedrooms"),
        bathrooms: formData.get("bathrooms"),
        image_url: primaryImageUrl,
        video_url: formData.get("video_url"),
        minimum_initial_months: formData.get("minimum_initial_months"),
        total_floors: formData.get("total_floors"),
        units_config: formData.get("units_config"),
        floor_unit_config: floorUnitConfig, // Pass floor unit config for apartments
        building_name: (formData.get("building_name") as string)?.trim() || null, // Pass building name for apartments
        all_image_urls: allImageUrls,
        add_to_existing_block: formData.get("add_to_existing_block") === "on",
        existing_block_id: formData.get("existing_block_id") || null,
        editingPropertyId: editingProperty?.id || null
      };

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Failed to save");

      const supabase = createClient();
      const [p, b, u] = await Promise.all([
        supabase.from("properties").select(`
          *, 
          property_units(*),
          landlord_profiles!landlord_id (
            id,
            business_name,
            profiles:user_id (
              full_name,
              email
            )
          )
        `).order("created_at", { ascending: false }),
        supabase.from("property_blocks").select("*").order("created_at", { ascending: false }),
        supabase.from("property_units").select("*").order("created_at", { ascending: false })
      ]);

      if (p.data) setProperties(p.data);
      if (b.data) setBlocks(b.data);
      if (u.data) setUnits(u.data);

      setIsOpen(false);
      setEditingProperty(null);
      toast.success("Property updated successfully");
    } catch (error) {
      toast.error("Error saving changes");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle property edit - detects if apartment and redirects to dedicated editor
  const handleEdit = async (property: Property) => {
    // Check if this is an apartment property with a block - redirect to full-page editor
    if (property.category === 'Apartment' && property.block_id) {
      // Navigate to the dedicated apartment editor
      window.location.href = `/admin/properties/apartment/${property.block_id}/edit`;
      return;
    }
    
    // Regular property edit - use the existing property editor
    window.location.href = `/admin/properties/${property.id}/edit`;
  };

  async function handleDelete(id: string) {
    if (!confirm("Are you sure? This action cannot be undone.")) return
    setIsLoading(true);
    try {
      const response = await fetch('/api/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error();
      setProperties(properties.filter((p) => p.id !== id));
      toast.success("Property deleted");
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setIsLoading(false);
    }
  }

  // Refresh data after operations
  const refreshData = async () => {
    const supabase = createClient();
    const [p, b, u] = await Promise.all([
      supabase.from("properties").select(`
        *, 
        property_units(*),
        landlord_profiles!landlord_id (
          id,
          business_name,
          profiles:user_id (
            full_name,
            email
          )
        )
      `).order("created_at", { ascending: false }),
      supabase.from("property_blocks").select("*").order("created_at", { ascending: false }),
      supabase.from("property_units").select("*").order("created_at", { ascending: false })
    ]);

    if (p.data) setProperties(p.data);
    if (b.data) setBlocks(b.data);
    if (u.data) setUnits(u.data);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">

      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Property Management</h1>
          <p className="text-muted-foreground">Manage your real estate portfolio and unit availability.</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="lg" 
              className="shadow-lg hover:shadow-xl transition-all gap-2 px-6"
            >
              <Plus className="h-5 w-5" /> Add New Property
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem asChild>
              <a href="/admin/properties/apartment/new?type=apartment" className="flex items-start gap-3 p-3 cursor-pointer">
                <Building2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Apartment Building</div>
                  <div className="text-xs text-muted-foreground">Multiple floors & unit types</div>
                </div>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/properties/apartment/new?type=hostel" className="flex items-start gap-3 p-3 cursor-pointer">
                <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium">Hostel Building</div>
                  <div className="text-xs text-muted-foreground">Multiple floors & unit types</div>
                </div>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/properties/apartment/new?type=office" className="flex items-start gap-3 p-3 cursor-pointer">
                <Building2 className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-medium">Office Building</div>
                  <div className="text-xs text-muted-foreground">Multiple floors & unit types</div>
                </div>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/properties/new/edit" className="flex items-start gap-3 p-3 cursor-pointer">
                <Home className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Single Property</div>
                  <div className="text-xs text-muted-foreground">House, condo, villa, etc.</div>
                </div>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Dialog open={isOpen} onOpenChange={(val) => { 
          setIsOpen(val); 
          if (!val) {
            setEditingProperty(null);
            setEditingApartmentData(null);
            setShowApartmentWizard(false);
            setShowPropertyTypeSelector(false);
          }
        }}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingProperty 
                  ? "Edit Property" 
                  : editingApartmentData 
                    ? `Edit ${editingApartmentData.buildingName}` 
                    : "Create Listing"}
              </DialogTitle>
            </DialogHeader>
            
            {isLoadingApartmentData ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
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
                  toast.success("Apartment updated successfully");
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
            ) : showApartmentWizard && !editingApartmentData ? (
              <ApartmentCreationWizard
                onComplete={async () => {
                  await refreshData();
                  setIsOpen(false);
                  setShowApartmentWizard(false);
                  toast.success("Apartment created successfully");
                }}
                onCancel={() => {
                  setIsOpen(false);
                  setShowApartmentWizard(false);
                }}
              />
            ) : (
              <PropertyCreateForm
                onSubmit={handleSubmit}
                onCancel={() => { setIsOpen(false); setEditingProperty(null); }}
                isLoading={isLoading}
                property={editingProperty || undefined}
                blocks={blocks}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* --- QUICK STATS RIBBON --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Properties" value={stats.totalProperties} icon={Home} color="text-blue-600" />
        <StatCard title="Total Units" value={stats.totalUnits} icon={KeySquare} color="text-purple-600" />
        <StatCard title="Available Units" value={stats.availableUnits} icon={Eye} color="text-green-600" />
        <StatCard title="Occupancy Rate" value={`${stats.occupancyRate}%`} icon={Building2} color="text-orange-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/30 p-2 rounded-lg border">
          <TabsList className="bg-transparent border-none">
            <TabsTrigger value="properties" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Properties</TabsTrigger>
            <TabsTrigger value="units" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Units</TabsTrigger>
            <TabsTrigger value="blocks" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Blocks</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by title, location..."
                className="pl-10 w-full lg:w-[350px] bg-background border-none shadow-none ring-1 ring-border focus-visible:ring-2"
                value={searchQuery ?? ''}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {activeTab === "units" && (
              <Button
                variant={showAvailableOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                className="gap-2 shrink-0"
              >
                <Filter className="h-4 w-4" />
                {showAvailableOnly ? "Available" : "All Units"}
              </Button>
            )}
          </div>
        </div>

        {/* --- PROPERTIES VIEW --- */}
        <TabsContent value="properties" className="mt-0 outline-none">
          {/* Bulk action bar */}
          {activeTab === 'properties' && selectedPropertyIds.size > 0 && (
            <div className="mb-3 rounded-xl border bg-card shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div className="text-sm">
                <span className="font-semibold">{selectedPropertyIds.size}</span> selected
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Select value={bulkLandlordId} onValueChange={setBulkLandlordId}>
                  <SelectTrigger className="w-full sm:w-[260px]">
                    <SelectValue placeholder="Select landlord" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {landlords.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.business_name || l.profiles?.full_name || l.profiles?.email || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={async () => {
                    if (bulkLandlordId === '') return
                    setBulkLoading(true)
                    try {
                      const ids = Array.from(selectedPropertyIds)
                      const updates = ids
                        .map((id) => properties.find((p) => p.id === id))
                        .filter(Boolean) as any[]

                      const results = await Promise.allSettled(
                        updates.map((p) => {
                          const payload = {
                            editingPropertyId: p.id,
                            title: p.title,
                            location: p.location,
                            description: p.description,
                            price: (p.price_ugx || 0) / 100,
                            category: p.category,
                            bedrooms: p.bedrooms,
                            bathrooms: p.bathrooms,
                            image_url: p.image_url,
                            all_image_urls: p.image_urls || [],
                            video_url: p.video_url,
                            minimum_initial_months: p.minimum_initial_months,
                            total_floors: p.total_floors,
                            units_config: p.units_config,
                            add_to_existing_block: !!p.block_id,
                            existing_block_id: p.block_id || null,
                            google_maps_embed_url: p.google_maps_embed_url || null,
                            landlord_id: bulkLandlordId === 'none' ? null : bulkLandlordId,
                          }
                          return fetch('/api/properties', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                          }).then(async (res) => {
                            const json = await res.json().catch(() => ({}))
                            if (!res.ok) throw new Error(json?.error || 'Failed')
                            return true
                          })
                        })
                      )

                      const failed = results.filter((r) => r.status === 'rejected')
                      if (failed.length > 0) {
                        toast.error(`Updated ${results.length - failed.length}/${results.length}. ${failed.length} failed.`)
                      } else {
                        toast.success(`Updated ${results.length} properties.`)
                      }

                      await refreshData()
                      setSelectedPropertyIds(new Set())
                    } catch (e: any) {
                      toast.error(e?.message || 'Bulk update failed')
                    } finally {
                      setBulkLoading(false)
                    }
                  }}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Applying...</span>
                  ) : (
                    'Apply'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPropertyIds(new Set())}
                  disabled={bulkLoading}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[40px]">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) => {
                          setSelectedPropertyIds((prev) => {
                            const next = new Set(prev)
                            if (checked) {
                              visiblePropertyIds.forEach((id) => next.add(id))
                            } else {
                              visiblePropertyIds.forEach((id) => next.delete(id))
                            }
                            return next
                          })
                        }}
                        aria-label="Select all visible properties"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[400px]">Property Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead className="text-center">Configuration</TableHead>
                  <TableHead className="text-center">Capacity</TableHead>
                  <TableHead className="text-right">Price (UGX)</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.length > 0 ? (
                  filteredProperties.map((property) => (
                    <TableRow key={property.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedPropertyIds.has(property.id)}
                            onCheckedChange={(checked) => {
                              setSelectedPropertyIds((prev) => {
                                const next = new Set(prev)
                                if (checked) next.add(property.id)
                                else next.delete(property.id)
                                return next
                              })
                            }}
                            aria-label={`Select property ${property.title}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border bg-muted">
                            {property.image_url ? (
                              <img src={property.image_url} alt="" className="object-cover w-full h-full" />
                            ) : (
                              <Home className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-base truncate group-hover:text-primary transition-colors">{property.title}</span>
                            {property.property_code && (
                              <span className="text-xs font-mono text-muted-foreground">ID: {property.property_code}</span>
                            )}
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 mr-1 shrink-0" />
                              <span className="truncate">{property.location}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="font-medium">{property.category}</Badge>
                          {property.is_featured && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                              <Star className="h-3 w-3 fill-amber-500" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {(property as any).landlord_profiles ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {(property as any).landlord_profiles.business_name || 
                                 (property as any).landlord_profiles.profiles?.full_name || 
                                 'Unknown'}
                              </span>
                              {(property as any).landlord_profiles.profiles?.email && (
                                <span className="text-xs text-muted-foreground">
                                  {(property as any).landlord_profiles.profiles.email}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center"><Bed className="h-3.5 w-3.5 mr-1" /> {property.bedrooms}</span>
                          <span className="flex items-center"><ShowerHead className="h-3.5 w-3.5 mr-1" /> {property.bathrooms}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium">{property.property_units?.length || 0} Units</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{property.total_floors} Floors</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-base">
                        {formatPrice(property.price_ugx / 100)}
                      </TableCell>
                      <TableCell>
                        <PropertyActions property={property} onEdit={handleEdit} onDelete={() => handleDelete(property.id)} onToggleFeatured={handleToggleFeatured} onReassign={(p: any) => {
                          setReassignProperty(p)
                          const current = (p as any).landlord_id || (p as any).landlord_profiles?.id || 'none'
                          setSelectedLandlordId(current || 'none')
                          setReassignOpen(true)
                        }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyState colSpan={8} />
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- UNITS VIEW --- */}
        <TabsContent value="units" className="mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUnits.map((unit) => (
              <Card key={unit.id} className="hover:shadow-md transition-all border-l-4 border-l-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <KeySquare className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-lg">Unit {unit.unit_number}</CardTitle>
                    </div>
                    <Badge variant={unit.is_available ? "default" : "destructive"} className={unit.is_available ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                      {unit.is_available ? "Available" : "Occupied"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 mr-2" />
                    Floor {unit.floor_number} • {properties.find(p => p.id === unit.property_id)?.title}
                  </div>
                  <div className="flex gap-4 pt-2 border-t text-sm">
                    <span className="flex items-center"><Bed className="h-4 w-4 mr-1.5 opacity-60" /> {unit.bedrooms} Bed</span>
                    <span className="flex items-center"><ShowerHead className="h-4 w-4 mr-1.5 opacity-60" /> {unit.bathrooms} Bath</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- BLOCKS VIEW --- */}
        <TabsContent value="blocks" className="mt-0 outline-none">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden text-center p-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Block Management</h3>
            <p className="text-muted-foreground mb-6">Manage structural blocks and their assigned properties.</p>
            {/* Similar table structure to properties would go here */}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reassign landlord dialog */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Landlord</DialogTitle>
            <DialogDescription>
              Select the landlord who should own this property. This will update landlord access in the landlord portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Property</Label>
            <div className="rounded-md border p-3 bg-muted/30">
              <div className="font-semibold">{reassignProperty?.title || 'Property'}</div>
              <div className="text-xs text-muted-foreground">{reassignProperty?.location || ''}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Landlord</Label>
            <Select value={selectedLandlordId || 'none'} onValueChange={setSelectedLandlordId}>
              <SelectTrigger>
                <SelectValue placeholder="Select landlord" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {landlords.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.business_name || l.profiles?.full_name || l.profiles?.email || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!reassignProperty) return
                setReassignLoading(true)
                try {
                  const payload = {
                    editingPropertyId: reassignProperty.id,
                    title: reassignProperty.title,
                    location: reassignProperty.location,
                    description: reassignProperty.description,
                    price: (reassignProperty.price_ugx || 0) / 100,
                    category: reassignProperty.category,
                    bedrooms: reassignProperty.bedrooms,
                    bathrooms: reassignProperty.bathrooms,
                    image_url: reassignProperty.image_url,
                    all_image_urls: reassignProperty.image_urls || [],
                    video_url: reassignProperty.video_url,
                    minimum_initial_months: reassignProperty.minimum_initial_months,
                    total_floors: reassignProperty.total_floors,
                    units_config: reassignProperty.units_config,
                    add_to_existing_block: !!reassignProperty.block_id,
                    existing_block_id: reassignProperty.block_id || null,
                    google_maps_embed_url: reassignProperty.google_maps_embed_url || null,
                    landlord_id: selectedLandlordId === 'none' ? null : selectedLandlordId,
                  }

                  const res = await fetch('/api/properties', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  })
                  const json = await res.json().catch(() => ({}))
                  if (!res.ok) throw new Error(json?.error || 'Failed to reassign landlord')

                  toast.success('Landlord reassigned')
                  setReassignOpen(false)
                  setReassignProperty(null)

                  // Refresh properties list (reuse existing refresh logic)
                  await refreshData()
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to reassign')
                } finally {
                  setReassignLoading(false)
                }
              }}
              disabled={reassignLoading}
            >
              {reassignLoading ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** * UI SUB-COMPONENTS 
 */

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="border-none shadow-sm bg-background ring-1 ring-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-muted/50 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PropertyActions({ property, onEdit, onDelete, onToggleFeatured, onReassign }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={`/admin/properties/${property.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Details
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <LayoutGrid className="mr-2 h-4 w-4" /> Manage Units
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onReassign(property)} className="cursor-pointer">
          <UserCog className="mr-2 h-4 w-4" /> Reassign Landlord
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleFeatured(property)} className="cursor-pointer">
          <Star className={`mr-2 h-4 w-4 ${property.is_featured ? 'fill-amber-500 text-amber-500' : ''}`} />
          {property.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive cursor-pointer">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Property
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmptyState({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-64 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-muted rounded-full">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="max-w-[200px]">
            <p className="font-semibold">No results found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or add a new entry.</p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}