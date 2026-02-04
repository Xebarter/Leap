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
  Layers
} from 'lucide-react'

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
  }, [searchQuery, locationFilter])

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleViewDetails}
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

function BuildingCard({ building, onEdit, onDelete, onView }: any) {
  // Use block image, or fallback to first property's image
  const imageUrl = building.block_image_url || 
    building.properties?.[0]?.image_url || 
    building.properties?.[0]?.images?.[0]

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={building.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={building.statistics.availableUnits > 0 ? 'default' : 'secondary'}>
            {building.statistics.availableUnits} Available
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{building.name}</h3>
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-3 w-3 mr-1" />
          {building.location}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>{building.total_floors} Floors</span>
          </div>
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span>{building.statistics.totalUnits} Units</span>
          </div>
          <div className="flex items-center gap-1">
            <DoorOpen className="h-4 w-4 text-green-600" />
            <span>{building.statistics.availableUnits} Free</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>{building.statistics.occupancyRate}% Full</span>
          </div>
        </div>

        {building.statistics.priceRange && (
          <div className="text-sm mb-4">
            <span className="text-muted-foreground">Price: </span>
            <span className="font-medium">
              {formatPrice(building.statistics.priceRange.min / 100)}
              {building.statistics.priceRange.min !== building.statistics.priceRange.max &&
                ` - ${formatPrice(building.statistics.priceRange.max / 100)}`}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(building)}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(building)}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(building)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function BuildingListItem({ building, onEdit, onDelete, onView }: any) {
  // Use block image, or fallback to first property's image
  const imageUrl = building.block_image_url || 
    building.properties?.[0]?.image_url || 
    building.properties?.[0]?.images?.[0]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Image */}
          <div className="w-full sm:w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={building.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1">{building.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  {building.location}
                </div>
              </div>
              <Badge variant={building.statistics.availableUnits > 0 ? 'default' : 'secondary'}>
                {building.statistics.availableUnits} Available
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-sm">
              <div>
                <span className="text-muted-foreground">Floors:</span>
                <span className="ml-1 font-medium">{building.total_floors}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Units:</span>
                <span className="ml-1 font-medium">{building.statistics.totalUnits}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Occupied:</span>
                <span className="ml-1 font-medium">{building.statistics.occupiedUnits}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Occupancy:</span>
                <span className="ml-1 font-medium">{building.statistics.occupancyRate}%</span>
              </div>
            </div>

            {building.statistics.priceRange && (
              <div className="text-sm mb-3">
                <span className="text-muted-foreground">Price Range: </span>
                <span className="font-medium">
                  {formatPrice(building.statistics.priceRange.min / 100)}
                  {building.statistics.priceRange.min !== building.statistics.priceRange.max &&
                    ` - ${formatPrice(building.statistics.priceRange.max / 100)}`}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onView(building)}>
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(building)}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(building)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
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
