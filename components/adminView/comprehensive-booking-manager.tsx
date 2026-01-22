"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { format, isBefore, isToday } from "date-fns";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreHorizontal, 
  User, 
  Calendar, 
  DollarSign, 
  Home, 
  Mail, 
  Phone, 
  MapPin, 
  Search,
  Eye,
  Check,
  X,
  TrendingUp,
  Users,
  CalendarCheck,
  AlertCircle,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ComprehensiveBookingManager({ initialBookings }: { initialBookings: any[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [bookingTypeFilter, setBookingTypeFilter] = useState<"all" | "site_visit" | "rental">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // For now, we'll consider all bookings as rental bookings since there's no specific site visit table
  // In a real implementation, you'd want to add a booking_type column to the bookings table
  const isSiteVisitBooking = (booking: any) => {
    // Check if booking_type is 'visit' or has visit-specific fields
    return booking.booking_type === 'visit' || booking.visit_date || booking.visit_time;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const siteVisits = bookings.filter(b => isSiteVisitBooking(b)).length;
    const rentals = totalBookings - siteVisits;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const todayVisits = bookings.filter(b => {
      if (!b.visit_date) return false;
      return isToday(new Date(b.visit_date));
    }).length;

    return {
      totalBookings,
      siteVisits,
      rentals,
      pending,
      confirmed,
      cancelled,
      todayVisits,
    };
  }, [bookings]);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.profiles?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.visitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.properties?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.properties?.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = bookingTypeFilter === "all" || 
      (bookingTypeFilter === "site_visit" && isSiteVisitBooking(booking)) || 
      (bookingTypeFilter === "rental" && !isSiteVisitBooking(booking));

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Refresh bookings from server
  const refreshBookings = async () => {
    setIsRefreshing(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
    setIsRefreshing(false);
  };

  // Fetch comprehensive booking details when expanded
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (expandedBookingId && !bookingDetails[expandedBookingId] && !loadingDetails[expandedBookingId]) {
        setLoadingDetails(prev => ({ ...prev, [expandedBookingId]: true }));
        
        const supabase = createClient();
        
        // Get the booking with related data
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            properties (title, location, description),
            profiles (full_name, email, phone)
          `)
          .eq("id", expandedBookingId)
          .single();

        if (!error && data) {
          setBookingDetails(prev => ({ 
            ...prev, 
            [expandedBookingId]: data
          }));
        }
        
        setLoadingDetails(prev => ({ ...prev, [expandedBookingId]: false }));
      }
    };

    fetchBookingDetails();
  }, [expandedBookingId, bookingDetails, loadingDetails]);

  const updateBookingStatus = async (id: string, status: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select();

    if (!error && data) {
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
    }
  };

  const updatePaymentStatus = async (id: string, paid: boolean) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bookings")
      .update({ 
        site_visit_paid: paid,
        payment_status: paid ? "paid" : "pending"
      })
      .eq("id", id)
      .select();

    if (!error && data) {
      setBookings(bookings.map((b) => (b.id === id ? { ...b, site_visit_paid: paid, payment_status: paid ? "paid" : "pending" } : b)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-none">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-none">
            <XCircle className="mr-1 h-3 w-3" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-none">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        );
    }
  };

  const getPaymentStatusBadge = (paid: boolean) => {
    if (paid === undefined || paid === null) {
      return (
        <Badge className="bg-gray-500/10 text-gray-500 border-none">
          <Clock className="mr-1 h-3 w-3" /> Not Set
        </Badge>
      );
    }
    
    return paid ? (
      <Badge className="bg-green-500/10 text-green-500 border-none">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
      </Badge>
    ) : (
      <Badge className="bg-red-500/10 text-red-500 border-none">
        <XCircle className="mr-1 h-3 w-3" /> Pending
      </Badge>
    );
  };

  const getVisitStatusBadge = (visitDate: string) => {
    const visitDateObj = new Date(visitDate);
    const isPast = isBefore(visitDateObj, new Date());
    const isTodayVisit = isToday(visitDateObj);
    
    if (isPast) {
      return (
        <Badge className="bg-gray-500/10 text-gray-500 border-none">
          <XCircle className="mr-1 h-3 w-3" /> Completed
        </Badge>
      );
    } else if (isTodayVisit) {
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-none">
          <CheckCircle2 className="mr-1 h-3 w-3" /> Today
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-none">
          <Clock className="mr-1 h-3 w-3" /> Scheduled
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.siteVisits} visits • {stats.rentals} rentals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <CalendarCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled for today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>
                Manage and track all property bookings and site visits
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshBookings}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, property, location..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Type:</span>
            </div>
            <Button
              variant={bookingTypeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setBookingTypeFilter("all")}
            >
              All ({stats.totalBookings})
            </Button>
            <Button
              variant={bookingTypeFilter === "site_visit" ? "default" : "outline"}
              size="sm"
              onClick={() => setBookingTypeFilter("site_visit")}
            >
              Site Visits ({stats.siteVisits})
            </Button>
            <Button
              variant={bookingTypeFilter === "rental" ? "default" : "outline"}
              size="sm"
              onClick={() => setBookingTypeFilter("rental")}
            >
              Rentals ({stats.rentals})
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-medium">Status:</span>
            </div>
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              variant={statusFilter === "confirmed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("confirmed")}
            >
              Confirmed ({stats.confirmed})
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("cancelled")}
            >
              Cancelled ({stats.cancelled})
            </Button>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{filteredBookings.length}</strong> of{" "}
              <strong className="text-foreground">{stats.totalBookings}</strong> bookings
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {searchQuery || bookingTypeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters or search query to see more results."
                : "When customers book properties or schedule visits, they'll appear here."}
            </p>
            {(searchQuery || bookingTypeFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setBookingTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {filteredBookings.map((booking) => {
              const isVisit = isSiteVisitBooking(booking);
              return (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {isVisit 
                              ? (booking.visitor_name || "Unknown Visitor")
                              : (booking.profiles?.full_name || booking.profiles?.email || "Unknown User")
                            }
                          </div>
                          <Badge variant={isVisit ? "secondary" : "default"} className="text-xs mt-1">
                            {isVisit ? "Visit" : "Rental"}
                          </Badge>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{booking.properties?.title || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{booking.properties?.location || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>
                          {isVisit 
                            ? (booking.visit_date ? format(new Date(booking.visit_date), "MMM d, yyyy") : "N/A")
                            : (booking.check_in ? format(new Date(booking.check_in), "MMM d, yyyy") : "N/A")
                          }
                        </span>
                        {isVisit && booking.visit_time && (
                          <span className="text-muted-foreground">• {booking.visit_time}</span>
                        )}
                      </div>
                      {isVisit ? (
                        <>
                          {booking.visitor_email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{booking.visitor_email}</span>
                            </div>
                          )}
                          {booking.visitor_phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <span>{booking.visitor_phone}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {booking.profiles?.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{booking.profiles.email}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => updateBookingStatus(booking.id, "confirmed")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => updateBookingStatus(booking.id, "cancelled")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden lg:block">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">User/Visitor</TableHead>
                  <TableHead className="font-semibold">Property</TableHead>
                  <TableHead className="font-semibold">Date/Time</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="w-[80px] text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {filteredBookings.map((booking) => {
              const isVisit = isSiteVisitBooking(booking);
              return (
                <TableRow key={booking.id}>
                  {/* Type Column */}
                  <TableCell>
                    <Badge 
                      variant={isVisit ? "secondary" : "default"}
                      className="font-medium"
                    >
                      {isVisit ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Visit
                        </>
                      ) : (
                        <>
                          <Home className="h-3 w-3 mr-1" />
                          Rental
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  
                  {/* User/Visitor Column */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {isVisit 
                            ? (booking.visitor_name || "Unknown Visitor")
                            : (booking.profiles?.full_name || booking.profiles?.email || "Unknown User")
                          }
                        </div>
                        {isVisit && booking.visitor_email && (
                          <div className="text-xs text-muted-foreground truncate">
                            {booking.visitor_email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Property Column */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {booking.properties?.title || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{booking.properties?.location || "N/A"}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Date/Time Column */}
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {isVisit 
                              ? (booking.visit_date ? format(new Date(booking.visit_date), "MMM d, yyyy") : "N/A")
                              : (booking.check_in ? format(new Date(booking.check_in), "MMM d, yyyy") : "N/A")
                            }
                          </div>
                          {isVisit && booking.visit_time && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {booking.visit_time}
                            </div>
                          )}
                        </div>
                      </div>
                      {isVisit && booking.visit_date && getVisitStatusBadge(booking.visit_date)}
                    </div>
                  </TableCell>
                  
                  {/* Status Column */}
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(booking.status)}
                    </div>
                  </TableCell>
                  
                  {/* Contact Column */}
                  <TableCell>
                    <div className="text-xs space-y-1.5">
                      {isVisit ? (
                        <>
                          {booking.visitor_email && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{booking.visitor_email}</span>
                            </div>
                          )}
                          {booking.visitor_phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span>{booking.visitor_phone}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {booking.profiles?.email && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{booking.profiles.email}</span>
                            </div>
                          )}
                          {booking.profiles?.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span>{booking.profiles.phone}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Actions Column */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "confirmed")}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          Confirm {isVisit ? "Visit" : "Booking"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel {isVisit ? "Visit" : "Booking"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
              </TableBody>
            </Table>
          </div>
        </Card>
        </>
      )}

      {/* Accordion for comprehensive booking details */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Booking Details</h3>
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          onValueChange={(value) => setExpandedBookingId(value || null)}
        >
          {filteredBookings.map((booking) => {
            const details = bookingDetails[booking.id] || booking;
            const isSiteVisit = isSiteVisitBooking(booking);

            return (
              <AccordionItem key={booking.id} value={booking.id} className="border rounded-lg mb-2">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">
                        {details.profiles?.full_name || details.profiles?.email || "Unknown User"}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{details.properties?.title || "Property"}</span>
                        <span>•</span>
                        <span>{details.visit_date ? format(new Date(details.visit_date), "MMM d, yyyy") : "N/A"}</span>
                        {isSiteVisit && <Badge className="ml-2">Site Visit</Badge>}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {loadingDetails[booking.id] ? (
                    <div className="py-4 text-center text-muted-foreground">Loading booking details...</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* User Information Card */}
                      <div className="lg:col-span-1 space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <User className="h-4 w-4" /> User Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p><span className="font-medium">Full Name:</span> {details.profiles?.full_name || "N/A"}</p>
                              <p><span className="font-medium">Email:</span> {details.profiles?.email || "N/A"}</p>
                              <p><span className="font-medium">Phone:</span> {details.profiles?.phone || "N/A"}</p>
                              <p><span className="font-medium">Booking ID:</span> {details.id}</p>
                              <p><span className="font-medium">Created:</span> {details.created_at ? format(new Date(details.created_at), "MMM d, yyyy h:mm a") : "N/A"}</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <DollarSign className="h-4 w-4" /> Payment Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p><span className="font-medium">Site Visit Fee:</span> {details.site_visit_fee ? formatPrice(details.site_visit_fee) : "N/A"}</p>
                              <p><span className="font-medium">Payment Status:</span> {getPaymentStatusBadge(details.site_visit_paid)}</p>
                              <p><span className="font-medium">Total Amount:</span> {details.total_price_ugx ? formatPrice(details.total_price_ugx) : "N/A"}</p>
                              <p><span className="font-medium">Payment Method:</span> {details.payment_method || "N/A"}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Booking Details Card */}
                      <div className="lg:col-span-2 space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Home className="h-4 w-4" /> Property & Booking Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Property Information</h4>
                                <p><span className="font-medium">Title:</span> {details.properties?.title || "N/A"}</p>
                                <p><span className="font-medium">Location:</span> {details.properties?.location || "N/A"}</p>
                                <p><span className="font-medium">Description:</span> {details.properties?.description || "N/A"}</p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Booking Information</h4>
                                <p><span className="font-medium">Status:</span> {getStatusBadge(details.status)}</p>
                                <p><span className="font-medium">Visit Date:</span> {details.visit_date ? format(new Date(details.visit_date), "MMM d, yyyy") : "N/A"}</p>
                                <p><span className="font-medium">Visit Time:</span> {details.visit_time || "N/A"}</p>
                                <p><span className="font-medium">Visit Status:</span> {details.visit_date ? getVisitStatusBadge(details.visit_date) : "N/A"}</p>
                              </div>
                              
                              <div className="md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-medium mb-2">Additional Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-muted/30 p-3 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Check-in</p>
                                    <p className="text-lg font-bold">{details.check_in ? format(new Date(details.check_in), "MMM d, yyyy") : "N/A"}</p>
                                  </div>
                                  <div className="bg-muted/30 p-3 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Check-out</p>
                                    <p className="text-lg font-bold">{details.check_out ? format(new Date(details.check_out), "MMM d, yyyy") : "N/A"}</p>
                                  </div>
                                  <div className="bg-muted/30 p-3 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Duration</p>
                                    <p className="text-lg font-bold">
                                      {details.check_in && details.check_out 
                                        ? `${Math.ceil((new Date(details.check_out).getTime() - new Date(details.check_in).getTime()) / (1000 * 60 * 60 * 24))} days` 
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Site Visit Notes */}
                        {details.visit_notes && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Eye className="h-4 w-4" /> Visit Notes
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{details.visit_notes}</p>
                            </CardContent>
                          </Card>
                        )}

                        {/* Actions */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <MoreHorizontal className="h-4 w-4" /> Actions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                variant={details.status === "confirmed" ? "default" : "outline"} 
                                onClick={() => updateBookingStatus(details.id, "confirmed")}
                              >
                                Confirm
                              </Button>
                              <Button 
                                variant={details.status === "cancelled" ? "destructive" : "outline"} 
                                onClick={() => updateBookingStatus(details.id, "cancelled")}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant={details.site_visit_paid ? "outline" : "default"} 
                                onClick={() => updatePaymentStatus(details.id, !details.site_visit_paid)}
                              >
                                Mark {details.site_visit_paid ? "Unpaid" : "Paid"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}