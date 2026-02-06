'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Home,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Loader2,
  LayoutGrid,
  List,
  Filter,
  DoorOpen,
  DoorClosed,
  Layers,
  UserCheck
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ============================================================================
// TYPES
// ============================================================================

interface BuildingUnit {
  id: string
  floor_number: number
  unit_number: string
  unit_type: string
  bedrooms: number
  bathrooms: number
  is_available: boolean
  price_ugx?: number
  area_sqft?: number
  template_name?: string
  features?: string[]
  sync_with_template?: boolean
}

interface BuildingProperty {
  id: string
  title: string
  category: string
  price_ugx: number
  bedrooms: number
  bathrooms: number
  is_active: boolean
  image_url: string
  floor_unit_config?: any
  description?: string
  amenities?: string[]
  features?: string[]
  total_floors?: number
  images?: string[]
}

interface UnitTypeSummary {
  templateName: string
  type: string
  bedrooms: number
  bathrooms: number
  price_ugx: number
  count: number
  available: number
  occupied: number
  units: string[]
}

interface BuildingStatistics {
  totalProperties: number
  totalUnits: number
  availableUnits: number
  occupiedUnits: number
  occupancyRate: number
  unitTypes: string[]
  priceRange: {
    min: number
    max: number
  } | null
}

interface Building {
  id: string
  name: string
  location: string
  description?: string
  total_floors: number
  landlord_id?: string | null
  landlord_name?: string | null
  total_units: number
  block_image_url?: string
  created_at: string
  updated_at: string
  statistics: BuildingStatistics
  properties: BuildingProperty[]
  units: BuildingUnit[]
  unitsByFloor?: Record<number, BuildingUnit[]>
  unitTypesSummary?: UnitTypeSummary[]
}

interface BuildingsManagerProps {
  userId: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BuildingsManager({ userId }: BuildingsManagerProps) {
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [landlords, setLandlords] = useState<Array<{ id: string; business_name: string; name: string; email: string; status: string }>>([])
  const [assigningLandlord, setAssigningLandlord] = useState<string | null>(null)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchBuildings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (locationFilter) params.append('location', locationFilter)

      const response = await fetch(`/api/admin/buildings?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch buildings')
      }

      const data = await response.json()
      setBuildings(data.buildings || [])
    } catch (error) {
      console.error('Error fetching buildings:', error)
      toast.error('Failed to load buildings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuildings()
    fetchLandlords()
  }, [searchQuery, locationFilter])

  const fetchLandlords = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('landlord_profiles')
        .select(`
          id,
          business_name,
          user_id,
          status,
          profiles:user_id(
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching landlords:', error)
        throw error
      }

      const formattedLandlords = data?.map(landlord => ({
        id: landlord.id,
        business_name: landlord.business_name || 'Unnamed Business',
        name: (landlord.profiles as any)?.full_name || 'Unknown',
        email: (landlord.profiles as any)?.email || '',
        status: landlord.status
      })) || []

      setLandlords(formattedLandlords)
    } catch (error) {
      console.error('Error fetching landlords:', error)
      // Set empty array on error so UI still works
      setLandlords([])
    }
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleCreateNew = () => {
    router.push('/admin/properties/apartment/new?type=apartment')
  }

  const handleEdit = (building: Building) => {
    // Navigate to the full apartment editor
    router.push(`/admin/buildings/${building.id}/edit`)
  }

  const handleDelete = async (building: Building) => {
    setSelectedBuilding(building)
    setDeleteDialogOpen(true)
  }

  const handleAssignLandlord = async (buildingId: string, landlordId: string | null) => {
    setAssigningLandlord(buildingId)
    try {
      const response = await fetch('/api/admin/buildings/assign-landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          blockId: buildingId, 
          landlordId: landlordId || null 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign landlord')
      }

      const result = await response.json()
      
      toast.success(result.message)
      
      // Update the building in the local state
      setBuildings(prev => prev.map(b => {
        if (b.id === buildingId) {
          const landlord = landlordId ? landlords.find(l => l.id === landlordId) : null
          return {
            ...b,
            landlord_id: landlordId,
            landlord_name: landlord ? `${landlord.business_name} (${landlord.name})` : null
          }
        }
        return b
      }))
    } catch (error) {
      console.error('Error assigning landlord:', error)
      toast.error('Failed to assign landlord to building')
    } finally {
      setAssigningLandlord(null)
    }
  }

  const confirmDelete = async () => {
    if (!selectedBuilding) return

    setDeletingId(selectedBuilding.id)
    try {
      const response = await fetch(`/api/admin/buildings?id=${selectedBuilding.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete building')
      }

      toast.success('Building deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedBuilding(null)
      fetchBuildings()
    } catch (error) {
      console.error('Error deleting building:', error)
      toast.error('Failed to delete building')
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewDetails = (building: Building) => {
    setSelectedBuilding(building)
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const uniqueLocations = useMemo(() => {
    return [...new Set(buildings.map(b => b.location))].sort()
  }, [buildings])

  const totalStats = useMemo(() => {
    return buildings.reduce(
      (acc, building) => ({
        totalBuildings: acc.totalBuildings + 1,
        totalUnits: acc.totalUnits + building.statistics.totalUnits,
        availableUnits: acc.availableUnits + building.statistics.availableUnits,
        occupiedUnits: acc.occupiedUnits + building.statistics.occupiedUnits
      }),
      { totalBuildings: 0, totalUnits: 0, availableUnits: 0, occupiedUnits: 0 }
    )
  }, [buildings])

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Buildings"
          value={totalStats.totalBuildings}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Total Units"
          value={totalStats.totalUnits}
          icon={Home}
          color="purple"
        />
        <StatCard
          title="Available"
          value={totalStats.availableUnits}
          icon={DoorOpen}
          color="green"
        />
        <StatCard
          title="Occupied"
          value={totalStats.occupiedUnits}
          icon={DoorClosed}
          color="amber"
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Buildings Directory</CardTitle>
              <CardDescription>
                Manage all your apartment buildings and their units
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Building
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by building name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Location Filter */}
            <div className="w-full lg:w-64">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Locations</option>
                {uniqueLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Buildings List/Grid */}
          {buildings.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No buildings found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || locationFilter
                  ? 'Try adjusting your search filters'
                  : 'Get started by creating your first building'}
              </p>
              {!searchQuery && !locationFilter && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Building
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {buildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleViewDetails}
                  landlords={landlords}
                  onAssignLandlord={handleAssignLandlord}
                  assigningLandlord={assigningLandlord}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {buildings.map((building) => (
                <BuildingListItem
                  key={building.id}
                  building={building}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleViewDetails}
                  landlords={landlords}
                  onAssignLandlord={handleAssignLandlord}
                  assigningLandlord={assigningLandlord}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Building</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBuilding?.name}"? This will permanently
              delete all properties, units, and associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Building Details Dialog */}
      {selectedBuilding && !deleteDialogOpen && (
        <BuildingDetailsDialog
          building={selectedBuilding}
          open={!!selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'purple' | 'green' | 'amber'
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses: Record<StatCardProps['color'], string> = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600'
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BuildingCard({ building, onEdit, onDelete, onView, landlords, onAssignLandlord, assigningLandlord }: any) {
  // Use block image, or fallback to first property's image
  const imageUrl = building.block_image_url || 
    building.properties?.[0]?.image_url || 
    building.properties?.[0]?.images?.[0]

  const occupancyRate = building.statistics.occupancyRate
  const isHighOccupancy = occupancyRate >= 80
  const isMediumOccupancy = occupancyRate >= 50 && occupancyRate < 80

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 border">
      {/* Compact Image Section */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={building.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Building2 className="h-12 w-12 text-primary/30 group-hover:text-primary/50 transition-colors" />
          </div>
        )}
        
        {/* Compact Top Badge */}
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-md text-xs font-semibold">
            <div className={`h-1.5 w-1.5 rounded-full ${
              isHighOccupancy ? 'bg-green-500' :
              isMediumOccupancy ? 'bg-orange-500' :
              'bg-red-500'
            }`} />
            <span className={`${
              isHighOccupancy ? 'text-green-600 dark:text-green-400' :
              isMediumOccupancy ? 'text-orange-600 dark:text-orange-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {occupancyRate}%
            </span>
          </div>
        </div>

        {/* Compact Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
          <h3 className="font-semibold text-sm mb-0.5 line-clamp-1 drop-shadow-md">
            {building.name}
          </h3>
          <div className="flex items-center text-xs text-white/90">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="line-clamp-1 drop-shadow">{building.location}</span>
          </div>
        </div>
      </div>

      {/* Compact Content Section */}
      <CardContent className="p-3 space-y-2.5">
        {/* Compact Stats Grid - 2 rows */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="text-center p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mx-auto mb-0.5" />
            <div className="text-[10px] text-muted-foreground leading-tight">Floors</div>
            <div className="text-xs font-bold text-foreground">{building.total_floors}</div>
          </div>

          <div className="text-center p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
            <Home className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mx-auto mb-0.5" />
            <div className="text-[10px] text-muted-foreground leading-tight">Units</div>
            <div className="text-xs font-bold text-foreground">{building.statistics.totalUnits}</div>
          </div>

          <div className="text-center p-1.5 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50">
            <DoorOpen className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mx-auto mb-0.5" />
            <div className="text-[10px] text-muted-foreground leading-tight">Free</div>
            <div className="text-xs font-bold text-foreground">{building.statistics.availableUnits}</div>
          </div>

          <div className="text-center p-1.5 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50">
            <Users className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 mx-auto mb-0.5" />
            <div className="text-[10px] text-muted-foreground leading-tight">Rented</div>
            <div className="text-xs font-bold text-foreground">{building.statistics.occupiedUnits}</div>
          </div>
        </div>

        {/* Compact Occupancy Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">Occupancy</span>
            <span className={`text-[10px] font-bold ${
              isHighOccupancy ? 'text-green-600 dark:text-green-400' :
              isMediumOccupancy ? 'text-orange-600 dark:text-orange-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {building.statistics.occupiedUnits}/{building.statistics.totalUnits}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isHighOccupancy ? 'bg-gradient-to-r from-green-500 to-green-600' :
                isMediumOccupancy ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Compact Landlord Assignment */}
        <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
          <div className="flex items-center gap-1.5 mb-1.5">
            <UserCheck className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Landlord</span>
          </div>
          <Select
            value={building.landlord_id || 'none'}
            onValueChange={(value) => onAssignLandlord(building.id, value === 'none' ? null : value)}
            disabled={assigningLandlord === building.id}
          >
            <SelectTrigger className="h-7 w-full text-xs bg-background border-muted-foreground/20 hover:border-primary transition-colors">
              <SelectValue placeholder="Assign..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground italic text-xs">Not assigned</span>
              </SelectItem>
              {landlords.map((landlord: any) => (
                <SelectItem key={landlord.id} value={landlord.id}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{landlord.business_name}</span>
                    <Badge 
                      variant={
                        landlord.status === 'active' ? 'default' : 
                        landlord.status === 'pending' ? 'secondary' : 
                        'outline'
                      }
                      className="text-[9px] py-0 px-1"
                    >
                      {landlord.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {assigningLandlord === building.id && (
            <div className="flex items-center justify-center mt-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Compact Price Range */}
        {building.statistics.priceRange && (
          <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-primary/10">
                <TrendingUp className="h-3 w-3 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground font-medium">Price Range</div>
                <div className="text-xs font-bold text-primary truncate">
                  {formatPrice(building.statistics.priceRange.min / 100)}
                  {building.statistics.priceRange.min !== building.statistics.priceRange.max &&
                    ` - ${formatPrice(building.statistics.priceRange.max / 100)}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Action Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onView(building)}
            className="h-7 text-xs px-2"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(building)}
            className="h-7 text-xs px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(building)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function BuildingListItem({ building, onEdit, onDelete, onView, landlords, onAssignLandlord, assigningLandlord }: any) {
  // Use block image, or fallback to first property's image
  const imageUrl = building.block_image_url || 
    building.properties?.[0]?.image_url || 
    building.properties?.[0]?.images?.[0]

  const occupancyRate = building.statistics.occupancyRate
  const isHighOccupancy = occupancyRate >= 80
  const isMediumOccupancy = occupancyRate >= 50 && occupancyRate < 80

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-primary">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Compact Image Section */}
          <div className="relative w-full md:w-32 h-32 bg-gradient-to-br from-muted to-muted/50 flex-shrink-0 overflow-hidden group">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={building.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Building2 className="h-10 w-10 text-primary/40" />
              </div>
            )}
            {/* Compact Occupancy Badge Overlay */}
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-md text-xs font-semibold">
                <div className={`h-1.5 w-1.5 rounded-full ${
                  isHighOccupancy ? 'bg-green-500' :
                  isMediumOccupancy ? 'bg-orange-500' :
                  'bg-red-500'
                }`} />
                <span className={`${
                  isHighOccupancy ? 'text-green-600 dark:text-green-400' :
                  isMediumOccupancy ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {occupancyRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Compact Content Section */}
          <div className="flex-1 p-3">
            {/* Compact Header */}
            <div className="mb-2.5">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-0.5 text-foreground line-clamp-1">{building.name}</h3>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{building.location}</span>
                  </div>
                </div>
                {/* Action Buttons - Moved to Header for Compact Design */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onView(building)}
                    className="h-7 px-2"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEdit(building)}
                    className="h-7 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(building)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-2.5">
              {/* Left Column: Stats & Landlord */}
              <div className="flex-1 space-y-2">
                {/* Compact Stats Grid */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                    <Layers className="h-3 w-3 text-blue-600 dark:text-blue-400 mx-auto mb-0.5" />
                    <div className="text-[10px] text-muted-foreground leading-tight">Floors</div>
                    <div className="text-xs font-bold text-foreground">{building.total_floors}</div>
                  </div>

                  <div className="text-center p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                    <Home className="h-3 w-3 text-purple-600 dark:text-purple-400 mx-auto mb-0.5" />
                    <div className="text-[10px] text-muted-foreground leading-tight">Units</div>
                    <div className="text-xs font-bold text-foreground">{building.statistics.totalUnits}</div>
                  </div>

                  <div className="text-center p-1.5 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50">
                    <DoorOpen className="h-3 w-3 text-green-600 dark:text-green-400 mx-auto mb-0.5" />
                    <div className="text-[10px] text-muted-foreground leading-tight">Free</div>
                    <div className="text-xs font-bold text-foreground">{building.statistics.availableUnits}</div>
                  </div>

                  <div className="text-center p-1.5 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50">
                    <Users className="h-3 w-3 text-orange-600 dark:text-orange-400 mx-auto mb-0.5" />
                    <div className="text-[10px] text-muted-foreground leading-tight">Rented</div>
                    <div className="text-xs font-bold text-foreground">{building.statistics.occupiedUnits}</div>
                  </div>
                </div>

                {/* Compact Occupancy Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-medium">Occupancy</span>
                    <span className={`text-[10px] font-bold ${
                      isHighOccupancy ? 'text-green-600 dark:text-green-400' :
                      isMediumOccupancy ? 'text-orange-600 dark:text-orange-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {building.statistics.occupiedUnits}/{building.statistics.totalUnits}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isHighOccupancy ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        isMediumOccupancy ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                        'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Landlord & Price */}
              <div className="lg:w-64 space-y-2 flex-shrink-0">
                {/* Compact Landlord Assignment */}
                <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <UserCheck className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Landlord</span>
                  </div>
                  <Select
                    value={building.landlord_id || 'none'}
                    onValueChange={(value) => onAssignLandlord(building.id, value === 'none' ? null : value)}
                    disabled={assigningLandlord === building.id}
                  >
                    <SelectTrigger className="h-7 w-full text-xs bg-background border-muted-foreground/20 hover:border-primary transition-colors">
                      <SelectValue placeholder="Assign..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground italic text-xs">Not assigned</span>
                      </SelectItem>
                      {landlords.map((landlord: any) => (
                        <SelectItem key={landlord.id} value={landlord.id}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium">{landlord.business_name}</span>
                            <Badge 
                              variant={
                                landlord.status === 'active' ? 'default' : 
                                landlord.status === 'pending' ? 'secondary' : 
                                'outline'
                              }
                              className="text-[9px] py-0 px-1"
                            >
                              {landlord.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assigningLandlord === building.id && (
                    <div className="flex items-center justify-center mt-1.5">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                {/* Compact Price Range */}
                {building.statistics.priceRange && (
                  <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-primary/10">
                        <TrendingUp className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted-foreground font-medium">Price Range</div>
                        <div className="text-xs font-bold text-primary truncate">
                          {formatPrice(building.statistics.priceRange.min / 100)}
                          {building.statistics.priceRange.min !== building.statistics.priceRange.max &&
                            ` - ${formatPrice(building.statistics.priceRange.max / 100)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


function BuildingDetailsDialog({ building, open, onClose, onEdit }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{building.name}</DialogTitle>
          <DialogDescription className="flex items-center text-base">
            <MapPin className="h-4 w-4 mr-1" />
            {building.location}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="unit-types">Unit Types</TabsTrigger>
            <TabsTrigger value="floors">Floors</TabsTrigger>
            <TabsTrigger value="units">All Units ({building.units?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Image */}
            {(building.block_image_url || building.properties?.[0]?.image_url || building.properties?.[0]?.images?.[0]) && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={building.block_image_url || building.properties?.[0]?.image_url || building.properties?.[0]?.images?.[0]}
                  alt={building.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            {building.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{building.description}</p>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{building.total_floors}</div>
                <div className="text-sm text-muted-foreground">Total Floors</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{building.statistics.totalUnits}</div>
                <div className="text-sm text-muted-foreground">Total Units</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {building.statistics.availableUnits}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{building.statistics.occupancyRate}%</div>
                <div className="text-sm text-muted-foreground">Occupancy</div>
              </div>
            </div>

            {/* Unit Types */}
            {building.statistics.unitTypes.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Unit Types</h4>
                <div className="flex flex-wrap gap-2">
                  {building.statistics.unitTypes.map((type: string) => (
                    <Badge key={type} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            {building.statistics.priceRange && (
              <div>
                <h4 className="font-medium mb-2">Price Range</h4>
                <div className="text-lg">
                  {formatPrice(building.statistics.priceRange.min / 100)}
                  {building.statistics.priceRange.min !== building.statistics.priceRange.max &&
                    ` - ${formatPrice(building.statistics.priceRange.max / 100)}`}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="unit-types" className="mt-4">
            {building.unitTypesSummary && building.unitTypesSummary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {building.unitTypesSummary.map((unitType: UnitTypeSummary, index: number) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{unitType.type} - {unitType.bedrooms}BR/{unitType.bathrooms}BA</span>
                        <Badge variant="outline">{unitType.count} Units</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Monthly Price:</span>
                          <span className="font-medium">{formatPrice(unitType.price_ugx / 100)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Available:</span>
                          <span className="font-medium text-green-600">{unitType.available} units</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Occupied:</span>
                          <span className="font-medium text-amber-600">{unitType.occupied} units</span>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Unit Numbers:</p>
                          <div className="flex flex-wrap gap-1">
                            {unitType.units.slice(0, 10).map((unitNum: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {unitNum}
                              </Badge>
                            ))}
                            {unitType.units.length > 10 && (
                              <Badge variant="secondary" className="text-xs">
                                +{unitType.units.length - 10} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No unit types configured</p>
            )}
          </TabsContent>

          <TabsContent value="floors" className="mt-4">
            {building.unitsByFloor && Object.keys(building.unitsByFloor).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(building.unitsByFloor)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([floorNum, floorUnits]: [string, BuildingUnit[]]) => (
                    <Card key={floorNum}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            Floor {floorNum}
                          </span>
                          <div className="flex gap-2">
                            <Badge variant="outline">{floorUnits.length} Units</Badge>
                            <Badge variant="default">
                              {floorUnits.filter(u => u.is_available).length} Available
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {floorUnits.map((unit: BuildingUnit) => (
                            <div
                              key={unit.id}
                              className={`p-3 border rounded-lg ${
                                unit.is_available ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="font-medium">{unit.unit_number}</div>
                                <Badge 
                                  variant={unit.is_available ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {unit.is_available ? 'Free' : 'Occupied'}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>{unit.unit_type} - {unit.bedrooms}BR/{unit.bathrooms}BA</div>
                                {unit.price_ugx && (
                                  <div className="font-medium text-foreground">
                                    {formatPrice(unit.price_ugx / 100)}/mo
                                  </div>
                                )}
                                {unit.area_sqft && (
                                  <div>{unit.area_sqft} sqft</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No floor data available</p>
            )}
          </TabsContent>

          <TabsContent value="units" className="mt-4">
            {building.units && building.units.length > 0 ? (
              <div className="space-y-2">
                {building.units.map((unit: BuildingUnit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{unit.unit_number}</div>
                      <div className="text-sm text-muted-foreground">
                        Floor {unit.floor_number} • {unit.unit_type} • {unit.bedrooms} BR, {unit.bathrooms} BA
                        {unit.area_sqft && ` • ${unit.area_sqft} sqft`}
                      </div>
                      {unit.price_ugx && (
                        <div className="text-sm font-medium mt-1">
                          {formatPrice(unit.price_ugx / 100)}/month
                        </div>
                      )}
                    </div>
                    <Badge variant={unit.is_available ? 'default' : 'secondary'}>
                      {unit.is_available ? 'Available' : 'Occupied'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No units configured</p>
            )}
          </TabsContent>

        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit(building)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Building
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
