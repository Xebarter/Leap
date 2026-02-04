import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"

export function LandlordPropertiesTable({ properties }: { properties: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Base Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.title}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[240px] truncate">{p.location}</TableCell>
                <TableCell>
                  {p.is_active ? (
                    <Badge className="bg-green-100 text-green-800">active</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">{formatPrice(p.price_ugx)}</TableCell>
              </TableRow>
            ))}
            {properties.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No properties found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-4 text-sm text-muted-foreground">
          Need to add a property? Please contact an admin.
        </div>
      </CardContent>
    </Card>
  )
}
