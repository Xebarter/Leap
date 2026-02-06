import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_admin || profile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { blockId, landlordId } = body;

    if (!blockId) {
      return NextResponse.json(
        { error: 'Block ID is required' },
        { status: 400 }
      );
    }

    // If landlordId is null, we're removing the landlord assignment
    // If landlordId is provided, verify it exists
    if (landlordId) {
      const { data: landlordExists, error: landlordError } = await supabase
        .from('landlord_profiles')
        .select('id')
        .eq('id', landlordId)
        .single();

      if (landlordError || !landlordExists) {
        return NextResponse.json(
          { error: 'Invalid landlord ID' },
          { status: 400 }
        );
      }
    }

    // Update all properties in this block to have the specified landlord
    const { data, error } = await supabase
      .from('properties')
      .update({ landlord_id: landlordId })
      .eq('block_id', blockId)
      .select();

    if (error) {
      console.error('Error assigning landlord to building:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const action = landlordId ? 'assigned to' : 'removed from';
    console.log(`Landlord ${action} ${data.length} properties in block ${blockId}`);

    return NextResponse.json({
      success: true,
      message: `Landlord ${action} ${data.length} properties in this building`,
      updatedCount: data.length
    });

  } catch (error: any) {
    console.error('Error in assign-landlord API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
