"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Activity, DollarSign, Key, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface RecentActivityProps {
  activities: Array<{
    id: string
    type: 'property_interest' | 'property_view' | 'booking'
    description: string
    timestamp: string
    user?: string
    propertyCode?: string
  }>
  occupancies: Array<any>
  transactions: Array<any>
}

export function RecentActivity({ activities, occupancies, transactions }: RecentActivityProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Active Occupancies Card */}
      <Card className="border-none shadow-sm bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Active Occupancies
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {occupancies.length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
          {occupancies.length > 0 ? (
            occupancies.map((occupancy) => {
              const daysRemaining = Math.ceil(
                (new Date(occupancy.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
              const isExpired = daysRemaining <= 0;

              return (
                <div
                  key={occupancy.id}
                  className="flex items-start justify-between gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {occupancy.properties?.title || 'Property'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {occupancy.profiles?.full_name || 'Unknown Tenant'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Code: {occupancy.properties?.property_code || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {isExpired ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    ) : isExpiringSoon ? (
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600 dark:text-yellow-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {daysRemaining}d left
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {daysRemaining}d left
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Until {new Date(occupancy.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active occupancies</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions & Activities */}
      <Card className="border-none shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Payments</TabsTrigger>
              <TabsTrigger value="activities">Interests</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-3 mt-4 max-h-[350px] overflow-y-auto">
              {transactions.length > 0 ? (
                transactions.slice(0, 8).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="shrink-0 mt-1">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {transaction.profiles?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.payment_method || 'Payment'} · {transaction.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatPrice(transaction.amount_ugx)}
                      </p>
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent transactions</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activities" className="space-y-3 mt-4 max-h-[350px] overflow-y-auto">
              {activities.length > 0 ? (
                activities.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="shrink-0 mt-1">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {activity.propertyCode && (
                          <Badge variant="outline" className="text-xs">
                            {activity.propertyCode}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
