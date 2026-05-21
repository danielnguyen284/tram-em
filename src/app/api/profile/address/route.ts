import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null);

  const [ { data: shipping }, { data: profile } ] = await Promise.all([
    supabase
      .from('shipping_addresses')
      .select('shipping_name, shipping_phone, shipping_address')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('display_name, phone, address')
      .eq('id', user.id)
      .maybeSingle()
  ]);

  if (shipping) {
    return NextResponse.json(shipping);
  }

  if (profile) {
    return NextResponse.json({
      shipping_name: profile.display_name || '',
      shipping_phone: profile.phone || '',
      shipping_address: profile.address || ''
    });
  }

  return NextResponse.json(null);
}
