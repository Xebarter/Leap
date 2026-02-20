import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || profile?.role === 'admin'
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { landlordId, scope, blockId, unitType, unitId, validateOnly } = body as {
      landlordId: string | null,
      scope: 'building' | 'unit_type' | 'unit',
      blockId?: string,
      unitType?: string,
      unitId?: string,
      validateOnly?: boolean
    }

    if (!scope) return NextResponse.json({ error: 'scope is required' }, { status: 400 })

    if (landlordId) {
      const { data: lp, error: lpErr } = await supabase
        .from('landlord_profiles')
        .select('id')
        .eq('id', landlordId)
        .single()
      if (lpErr || !lp) return NextResponse.json({ error: 'Invalid landlordId' }, { status: 400 })
    }

    if (scope === 'building') {
      if (!blockId) return NextResponse.json({ error: 'blockId is required' }, { status: 400 })
      // Conflict check: any properties/units in this block already assigned to a different landlord?
      if (landlordId) {
        const [{ data: propConflicts }, { data: unitConflicts }] = await Promise.all([
          supabase.from('properties').select('id, landlord_id').eq('block_id', blockId).not('landlord_id', 'is', null).neq('landlord_id', landlordId),
          supabase.from('property_units').select('id, landlord_id').eq('block_id', blockId).not('landlord_id', 'is', null).neq('landlord_id', landlordId),
        ])
        const conflicts = [ ...(propConflicts || []), ...(unitConflicts || []) ]
        if ((conflicts?.length || 0) > 0) {
          return NextResponse.json({ error: 'Conflict: some items already assigned to another landlord', conflictsCount: conflicts.length }, { status: 409 })
        }
      }
      if (validateOnly) {
        return NextResponse.json({ ok: true, conflictsCount: 0 })
      }
      const { data, error } = await supabase
        .from('properties')
        .update({ landlord_id: landlordId })
        .eq('block_id', blockId)
        .select('id')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      await supabase
        .from('property_units')
        .update({ landlord_id: landlordId })
        .eq('block_id', blockId)
      return NextResponse.json({ success: true, updatedCount: data?.length ?? 0 })
    }

    if (scope === 'unit_type') {
      if (!blockId || !unitType) {
        return NextResponse.json({ error: 'blockId and unitType are required' }, { status: 400 })
      }
      if (landlordId) {
        const { data: unitConflicts } = await supabase
          .from('property_units')
          .select('id, landlord_id')
          .eq('block_id', blockId)
          .eq('unit_type', unitType)
          .not('landlord_id', 'is', null)
          .neq('landlord_id', landlordId)
        if ((unitConflicts?.length || 0) > 0) {
          return NextResponse.json({ error: 'Conflict: some units already assigned to another landlord', conflictsCount: unitConflicts.length }, { status: 409 })
        }
      }
      if (validateOnly) {
        return NextResponse.json({ ok: true, conflictsCount: 0 })
      }
      const { data, error } = await supabase
        .from('property_units')
        .update({ landlord_id: landlordId })
        .eq('block_id', blockId)
        .eq('unit_type', unitType)
        .select('id')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, updatedCount: data?.length ?? 0 })
    }

    if (scope === 'unit') {
      if (!unitId) return NextResponse.json({ error: 'unitId is required' }, { status: 400 })
      if (landlordId) {
        const { data: unit } = await supabase
          .from('property_units')
          .select('id, landlord_id')
          .eq('id', unitId)
          .maybeSingle()
        if (unit && unit.landlord_id && unit.landlord_id !== landlordId) {
          return NextResponse.json({ error: 'Conflict: unit already assigned to another landlord' }, { status: 409 })
        }
      }
      if (validateOnly) {
        return NextResponse.json({ ok: true, conflictsCount: 0 })
      }
      const { data, error } = await supabase
        .from('property_units')
        .update({ landlord_id: landlordId })
        .eq('id', unitId)
        .select('id')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, updatedCount: data?.length ?? 0 })
    }

    return NextResponse.json({ error: 'Unsupported scope' }, { status: 400 })
  } catch (err: any) {
    console.error('Error in /api/admin/landlords/assign:', err)
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 })
  }
}
