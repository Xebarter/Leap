"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Line, LineChart, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatPrice } from "@/lib/utils"

interface AdminAnalyticsProps {
  revenueData?: { month: string; revenue: number }[];
  bookingTrends?: { day: string; bookings: number }[];
  topProperties?: { name: string; location: string; occupancy: string; revenue: number }[];
}

export function AdminAnalytics({ 
  revenueData = [
    { month: "Jan", revenue: 4500000 },
    { month: "Feb", revenue: 5200000 },
    { month: "Mar", revenue: 4800000 },
    { month: "Apr", revenue: 6100000 },
    { month: "May", revenue: 5900000 },
    { month: "Jun", revenue: 7200000 },
  ],
  bookingTrends = [
    { day: "Mon", bookings: 12 },
    { day: "Tue", bookings: 18 },
    { day: "Wed", bookings: 15 },
    { day: "Thu", bookings: 22 },
    { day: "Fri", bookings: 30 },
    { day: "Sat", bookings: 25 },
    { day: "Sun", bookings: 20 },
  ],
  topProperties = [
    { name: "Modern Lakeview Villa", location: "Entebbe", occupancy: "94%", revenue: 12500000 },
    { name: "City Center Loft", location: "Kampala", occupancy: "88%", revenue: 8200000 },
    { name: "Safari Garden Cottage", location: "Jinja", occupancy: "82%", revenue: 5900000 },
  ]
}: AdminAnalyticsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-none">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue growth in UGX</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `UGX${value / 1000000}M`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
            <CardDescription>Daily booking volume for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                bookings: {
                  label: "Bookings",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="var(--color-bookings)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-bookings)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none">
        <CardHeader>
          <CardTitle>Top Performing Properties</CardTitle>
          <CardDescription>Properties with the highest occupancy rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProperties.map((property, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">{property.name}</div>
                  <div className="text-sm text-muted-foreground">{property.location}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{property.occupancy}</div>
                  <div className="text-sm text-muted-foreground">{formatPrice(property.revenue)} UGX</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}