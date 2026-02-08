import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { Users, Home, Building2, DollarSign, Key, UserCheck, TrendingUp } from "lucide-react"

interface AdminStatsProps {
  totalProperties: number
  availableProperties: number
  occupiedProperties: number
  totalUsers: number
  activeOccupancies: number
  totalRevenue: number
  totalLandlords: number
}

export function AdminStats({ 
  totalProperties,
  availableProperties,
  occupiedProperties,
  totalUsers,
  activeOccupancies,
  totalRevenue,
  totalLandlords
}: AdminStatsProps) {
  const occupancyRate = totalProperties > 0 
    ? Math.round((occupiedProperties / totalProperties) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl md:text-3xl font-bold">{totalProperties}</div>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs text-muted-foreground">
              {availableProperties} available · {occupiedProperties} occupied
            </p>
          </div>
          <div className="mt-2">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {occupancyRate}% occupancy rate
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">
            {formatPrice(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Last 6 months</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Active payments tracked
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl md:text-3xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground mt-2">Registered users</p>
          <div className="mt-1">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              {activeOccupancies} active occupancies
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Landlords</CardTitle>
          <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl md:text-3xl font-bold">{totalLandlords}</div>
          <p className="text-xs text-muted-foreground mt-2">Active landlords</p>
          <div className="mt-1">
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
              Managing properties
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}