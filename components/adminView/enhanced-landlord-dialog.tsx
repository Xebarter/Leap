"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface LandlordProfile {
  id: string
  user_id: string
  email?: string
  full_name?: string
  phone?: string
  national_id?: string
  address?: string
  city?: string
  country?: string
  bank_name?: string
  bank_account_number?: string
  bank_account_name?: string
  mobile_money_number?: string
  mobile_money_provider?: string
  tax_id?: string
  business_registration_number?: string
  commission_rate?: number
  payment_terms?: string
  status?: string
  created_at?: string
}

interface EnhancedLandlordDialogProps {
  initialActiveTab?: 'basic' | 'business' | 'banking' | 'settings' | 'assignments'
  onCreated?: (id: string) => void
  landlord: LandlordProfile | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function AssignmentsEditor({ landlordId }: { landlordId: string }) {
  const supabase = createClient()
  const [scope, setScope] = useState<'building' | 'unit_type' | 'unit'>('building')
  const [blocks, setBlocks] = useState<any[]>([])
  const [blockId, setBlockId] = useState<string>('')
  const [unitTypes, setUnitTypes] = useState<string[]>([])
  const [unitType, setUnitType] = useState<string>('')
  const [units, setUnits] = useState<any[]>([])
  const [unitId, setUnitId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<{properties:number; units:number}>({properties:0, units:0})

  useEffect(() => {
    const fetchBlocks = async () => {
      const { data } = await supabase.from('property_blocks').select('id,name,location').order('name')
      setBlocks(data || [])
    }
    fetchBlocks()
  }, [])

  useEffect(() => {
    const fetchUnitTypesAndUnits = async () => {
      if (!blockId) {
        setUnitTypes([])
        setUnits([])
        setUnitType('')
        setUnitId('')
        return
      }
      const { data: unitRows } = await supabase
        .from('property_units')
        .select('id, unit_type, unit_number')
        .eq('block_id', blockId)
        .order('unit_type')
      const types = Array.from(new Set((unitRows || []).map((u: any) => u.unit_type).filter(Boolean))) as string[]
      setUnitTypes(types)
      setUnits(unitRows || [])
      if (!types.includes(unitType)) setUnitType('')
      if (!unitRows?.find(u => u.id === unitId)) setUnitId('')
    }
    fetchUnitTypesAndUnits()
  }, [blockId])

  useEffect(() => {
    const loadSummary = async () => {
      const [{ count: propCount }, { count: unitCount }] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('landlord_id', landlordId),
        supabase.from('property_units').select('id', { count: 'exact', head: true }).eq('landlord_id', landlordId),
      ])
      setSummary({ properties: propCount || 0, units: unitCount || 0 })
    }
    loadSummary()
  }, [landlordId])

  const handleAssign = async (assignToNull = false) => {
    try {
      setLoading(true)
      const body: any = {
        landlordId: assignToNull ? null : landlordId,
        scope,
      }
      if (scope === 'building') {
        if (!blockId) return toast({ title: 'Select a building', variant: 'destructive' })
        body.blockId = blockId
      } else if (scope === 'unit_type') {
        if (!blockId || !unitType) return toast({ title: 'Select building and unit type', variant: 'destructive' })
        body.blockId = blockId
        body.unitType = unitType
      } else if (scope === 'unit') {
        if (!unitId) return toast({ title: 'Select a unit', variant: 'destructive' })
        body.unitId = unitId
      }
      // Preflight: validate conflicts first
      const pre = await fetch('/api/admin/landlords/assign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, validateOnly: true })
      })
      if (!pre.ok) {
        const pj = await pre.json().catch(() => ({}))
        throw new Error(pj?.error || 'Cannot assign due to conflicts')
      }
      const res = await fetch('/api/admin/landlords/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(json?.error || 'Conflict: already assigned to another landlord')
        }
        throw new Error(json?.error || 'Failed to assign')
      }
      toast({ title: 'Assignment updated' })
      // Refresh summary after change
      const [{ count: propCount }, { count: unitCount }] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('landlord_id', landlordId),
        supabase.from('property_units').select('id', { count: 'exact', head: true }).eq('landlord_id', landlordId),
      ])
      setSummary({ properties: propCount || 0, units: unitCount || 0 })
    } catch (e: any) {
      toast({ title: e?.message || 'Failed to assign', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Currently assigned: <span className="font-medium text-foreground">{summary.properties}</span> properties • <span className="font-medium text-foreground">{summary.units}</span> units</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label>Scope</Label>
          <Select value={scope} onValueChange={(v: any) => setScope(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="building">Building</SelectItem>
              <SelectItem value="unit_type">Unit Type</SelectItem>
              <SelectItem value="unit">Single Unit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Building</Label>
          <Select value={blockId} onValueChange={(v) => setBlockId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select building" />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name || 'Block'}{b.location ? ` • ${b.location}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {scope !== 'building' && (
          <div className="space-y-1">
            <Label>{scope === 'unit_type' ? 'Unit Type' : 'Unit'}</Label>
            {scope === 'unit_type' ? (
              <Select value={unitType} onValueChange={(v) => setUnitType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {unitTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={unitId} onValueChange={(v) => setUnitId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.unit_number} • {u.unit_type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => handleAssign(false)} disabled={loading}>
          Assign
        </Button>
        <Button type="button" variant="outline" onClick={() => handleAssign(true)} disabled={loading}>
          Remove Assignment
        </Button>
      </div>
    </div>
  )
}

export function EnhancedLandlordDialog({ 
  landlord, 
  isOpen, 
  onClose, 
  onSave,
  initialActiveTab 
}: EnhancedLandlordDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => { if (initialActiveTab) setActiveTab(initialActiveTab) }, [initialActiveTab])
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState(initialActiveTab ?? "basic")
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  
  const [formData, setFormData] = useState<any>({
    // Auth fields (only for new landlords)
    email: landlord?.email || "",
    password: "",
    full_name: landlord?.full_name || "",
    
    // Profile fields
    phone: landlord?.phone || "",
    national_id: landlord?.national_id || "",
    address: landlord?.address || "",
    city: landlord?.city || "",
    country: landlord?.country || "Uganda",
    
    // Banking fields
    bank_name: landlord?.bank_name || "",
    bank_account_number: landlord?.bank_account_number || "",
    bank_account_name: landlord?.bank_account_name || "",
    mobile_money_number: landlord?.mobile_money_number || "",
    mobile_money_provider: landlord?.mobile_money_provider || "MTN",
    
    // Business fields
    tax_id: landlord?.tax_id || "",
    business_registration_number: landlord?.business_registration_number || "",
    
    // Settings
    commission_rate: landlord?.commission_rate || 10,
    payment_terms: landlord?.payment_terms || "monthly",
    status: landlord?.status || "active",
  })

  // Validation helper
  const validateField = (name: string, value: any): string => {
    if (!landlord) {
      // New landlord validations
      if (name === "email" && !value) return "Email is required"
      if (name === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Please enter a valid email address"
      }
      if (name === "password" && !value) return "Password is required"
      if (name === "password" && value && value.length < 6) {
        return "Password must be at least 6 characters"
      }
      if (name === "full_name" && !value) return "Full name is required"
    }
    
    if (name === "phone" && value && !/^\+?[0-9]{10,15}$/.test(value.replace(/\s/g, ""))) {
      return "Please enter a valid phone number"
    }
    
    if (name === "commission_rate" && (value < 0 || value > 100)) {
      return "Commission rate must be between 0 and 100"
    }
    
    return ""
  }

  const handleInputChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value })
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
    
    // Reset email availability check when email changes
    if (name === "email") {
      setEmailAvailable(null)
    }
  }

  const handleInputBlur = async (name: string) => {
    const error = validateField(name, formData[name])
    if (error) {
      setErrors({ ...errors, [name]: error })
      return
    }
    
    // Check email availability for new landlords
    if (name === "email" && !landlord && formData[name]) {
      setCheckingEmail(true)
      try {
        const response = await fetch(`/api/admin/landlords/check-email?email=${encodeURIComponent(formData[name])}`)
        const data = await response.json()
        setEmailAvailable(data.available)
        
        if (!data.available) {
          setErrors({ ...errors, email: "This email is already registered in the system" })
        }
      } catch (e) {
        console.error("Error checking email:", e)
      } finally {
        setCheckingEmail(false)
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!landlord) {
      // Validate new landlord creation
      const emailError = validateField("email", formData.email)
      if (emailError) newErrors.email = emailError
      
      const passwordError = validateField("password", formData.password)
      if (passwordError) newErrors.password = passwordError
      
      const nameError = validateField("full_name", formData.full_name)
      if (nameError) newErrors.full_name = nameError
    }
    
    // Validate phone if provided
    if (formData.phone) {
      const phoneError = validateField("phone", formData.phone)
      if (phoneError) newErrors.phone = phoneError
    }
    
    // Validate commission rate
    const commissionError = validateField("commission_rate", formData.commission_rate)
    if (commissionError) newErrors.commission_rate = commissionError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      })
      // Switch to first tab with error
      if (errors.email || errors.password || errors.full_name || errors.phone) {
        setActiveTab("basic")
      } else if (errors.commission_rate) {
        setActiveTab("settings")
      }
      return
    }
    
    setIsLoading(true)

    try {
      if (landlord) {
        // Update existing landlord
        const supabase = createClient()
        const { error } = await supabase
          .from("landlord_profiles")
          .update({
            phone_number: formData.phone,
            business_address: formData.address,
            city: formData.city,
            bank_name: formData.bank_name,
            bank_account_number: formData.bank_account_number,
            bank_account_name: formData.bank_account_name,
            mobile_money_number: formData.mobile_money_number,
            mobile_money_provider: formData.mobile_money_provider,
            business_registration_number: formData.business_registration_number,
            commission_rate: formData.commission_rate,
            payment_schedule: formData.payment_terms,
            status: formData.status,
          })
          .eq("id", landlord.id)

        if (error) {
          throw new Error(error.message || "Failed to update landlord")
        }
        
        toast({
          title: "Success!",
          description: "Landlord profile updated successfully",
        })
      } else {
        // Create new landlord via API
        const response = await fetch("/api/admin/landlords/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

       if (!response.ok) {
         // Handle specific error cases
         if (response.status === 409) {
           // Conflict - duplicate email or user
           throw new Error(data.error || "This email is already registered. Please use a different email address.")
         }
         throw new Error(data.error || "Failed to create landlord")
       }

       // Notify parent so it can reopen Assignments
       if (data?.landlord?.id && onCreated) {
         onCreated(data.landlord.id)
       }

       toast({
         title: "Success!",
         description: "Landlord account created successfully. They can now sign in.",
       })
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Error saving landlord:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save landlord",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTabStatus = (tab: string): "error" | "complete" | "none" => {
    if (tab === "basic") {
      if (errors.email || errors.password || errors.full_name || errors.phone) return "error"
      if (!landlord) {
        if (formData.email && formData.password && formData.full_name) return "complete"
      } else {
        if (formData.full_name) return "complete"
      }
    }
    if (tab === "business") {
      if (formData.tax_id || formData.business_registration_number) return "complete"
    }
    if (tab === "banking") {
      if (formData.bank_account_number || formData.mobile_money_number) return "complete"
    }
    if (tab === "settings") {
      if (errors.commission_rate) return "error"
      if (formData.commission_rate !== undefined) return "complete"
    }
    return "none"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {landlord ? "Edit Landlord Profile" : "Add New Landlord"}
          </DialogTitle>
          <DialogDescription>
            {landlord 
              ? "Update landlord information and settings" 
              : "Create a new landlord account with login credentials"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!landlord && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Use a unique email address that doesn't already exist in the system. 
                The landlord will receive an email verification link and can sign in immediately after creation.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="basic" className="flex items-center gap-2 py-3">
                <span>Basic Info</span>
                {getTabStatus("basic") === "error" && (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                )}
                {getTabStatus("basic") === "complete" && (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                )}
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2 py-3">
                <span>Business</span>
                {getTabStatus("business") === "complete" && (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                )}
              </TabsTrigger>
              <TabsTrigger value="banking" className="flex items-center gap-2 py-3">
                <span>Banking</span>
                {getTabStatus("banking") === "complete" && (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 py-3">
                <span>Settings</span>
                {getTabStatus("settings") === "error" && (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                )}
                {getTabStatus("settings") === "complete" && (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                )}
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2 py-3">
                <span>Assignments</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-5 mt-6">
              {!landlord && (
                <div className="bg-muted/50 p-4 rounded-lg border space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Login Credentials
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-1">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          onBlur={() => handleInputBlur("email")}
                          placeholder="landlord@example.com"
                          className={errors.email ? "border-destructive" : emailAvailable === true ? "border-green-500" : ""}
                        />
                        {checkingEmail && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {errors.email && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.email}
                        </p>
                      )}
                      {!errors.email && emailAvailable === true && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Email is available - ready to create account
                        </p>
                      )}
                      {!errors.email && !emailAvailable && formData.email && !checkingEmail && (
                        <p className="text-xs text-muted-foreground">
                          ✓ This will be used for login
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-1">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          onBlur={() => handleInputBlur("password")}
                          placeholder="Min. 6 characters"
                          className={errors.password ? "border-destructive pr-10" : "pr-10"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.password}
                        </p>
                      )}
                      {!errors.password && formData.password && (
                        <p className="text-xs text-muted-foreground">
                          ✓ Strong password set
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Personal Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-1">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    onBlur={() => handleInputBlur("full_name")}
                    placeholder="John Doe"
                    disabled={!!landlord}
                    className={errors.full_name ? "border-destructive" : ""}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.full_name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      onBlur={() => handleInputBlur("phone")}
                      placeholder="+256700000000"
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="national_id">National ID</Label>
                    <Input
                      id="national_id"
                      value={formData.national_id}
                      onChange={(e) => handleInputChange("national_id", e.target.value)}
                      placeholder="CM12345678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Street address, building name, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Kampala"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      placeholder="Uganda"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Business Information Tab */}
            <TabsContent value="business" className="space-y-5 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Business Registration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID (TIN)</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => handleInputChange("tax_id", e.target.value)}
                      placeholder="TIN123456789"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tax Identification Number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_registration_number">Business Registration Number</Label>
                    <Input
                      id="business_registration_number"
                      value={formData.business_registration_number}
                      onChange={(e) => handleInputChange("business_registration_number", e.target.value)}
                      placeholder="BRN123456"
                    />
                    <p className="text-xs text-muted-foreground">
                      Official business registration ID
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Account Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-gray-500" />
                          Inactive
                        </div>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Suspended
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Control landlord access to the platform
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Banking Information Tab */}
            <TabsContent value="banking" className="space-y-5 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Bank Account Details
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange("bank_name", e.target.value)}
                    placeholder="Stanbic Bank Uganda"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_number">Account Number</Label>
                    <Input
                      id="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={(e) => handleInputChange("bank_account_number", e.target.value)}
                      placeholder="1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_account_name">Account Name</Label>
                    <Input
                      id="bank_account_name"
                      value={formData.bank_account_name}
                      onChange={(e) => handleInputChange("bank_account_name", e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Mobile Money Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile_money_provider">Provider</Label>
                    <Select
                      value={formData.mobile_money_provider}
                      onValueChange={(value) => handleInputChange("mobile_money_provider", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                        <SelectItem value="Airtel">Airtel Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_money_number">Mobile Money Number</Label>
                    <Input
                      id="mobile_money_number"
                      value={formData.mobile_money_number}
                      onChange={(e) => handleInputChange("mobile_money_number", e.target.value)}
                      placeholder="+256700000000"
                    />
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Payment details are used for commission payouts and rent collection
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-5 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Platform Commission
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.commission_rate || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                      handleInputChange("commission_rate", isNaN(value) ? 0 : value)
                    }}
                    onBlur={() => handleInputBlur("commission_rate")}
                    placeholder="10.00"
                    className={errors.commission_rate ? "border-destructive" : ""}
                  />
                  {errors.commission_rate && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.commission_rate}
                    </p>
                  )}
                  {!errors.commission_rate && (
                    <p className="text-xs text-muted-foreground">
                      Platform commission on rental income (e.g., 10 for 10%)
                    </p>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Example: </span>
                    If rent is UGX 500,000 and commission is {formData.commission_rate}%, 
                    the platform receives <span className="font-semibold">UGX {(500000 * (formData.commission_rate / 100)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Payment Schedule
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Select
                    value={formData.payment_terms}
                    onValueChange={(value) => handleInputChange("payment_terms", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly - Every 7 days</SelectItem>
                      <SelectItem value="monthly">Monthly - Every 30 days</SelectItem>
                      <SelectItem value="quarterly">Quarterly - Every 90 days</SelectItem>
                      <SelectItem value="annually">Annually - Every 365 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How often commission payments are processed to the landlord
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-5 mt-6">
              {landlord ? (
                <AssignmentsEditor landlordId={landlord.id} />
              ) : (
                <div className="p-4 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                  Create the landlord first to enable assignments.
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {landlord ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {landlord ? "Update Landlord" : "Create Landlord"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
