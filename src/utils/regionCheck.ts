import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notificationService';

export interface RegionCheckResult {
  isOutOfRegion: boolean;
  customerDistrict?: string;
  repRegion?: string;
  requiresApproval: boolean;
}

export async function checkRegion(
  customerLocation: { lat: number; lng: number } | string,
  salesRepId: string
): Promise<RegionCheckResult> {
  try {
    const { data: rep, error: repError } = await supabase
      .from('sales_reps')
      .select('region, district')
      .eq('id', salesRepId)
      .maybeSingle();

    if (repError || !rep) {
      return {
        isOutOfRegion: false,
        requiresApproval: false,
      };
    }

    let customerDistrict: string | undefined;

    if (typeof customerLocation === 'string') {
      customerDistrict = customerLocation;
    } else {
      customerDistrict = rep.district;
    }

    const isOutOfRegion = rep.region?.toLowerCase() !== customerDistrict?.toLowerCase();

    return {
      isOutOfRegion,
      customerDistrict,
      repRegion: rep.region || undefined,
      requiresApproval: isOutOfRegion,
    };
  } catch (error) {
    console.error('Region check failed:', error);
    return {
      isOutOfRegion: false,
      requiresApproval: false,
    };
  }
}

export async function requestOORApproval(payload: {
  visitId?: string;
  customerId: string;
  salesRepId: string;
  reason?: string;
  estimatedRevenue?: number;
  customerName?: string;
  customerDistrict?: string;
}): Promise<{ success: boolean; notificationId?: string }> {
  try {
    const { data: managers, error: managersError } = await supabase
      .from('sales_reps')
      .select('id, name')
      .eq('role', 'manager')
      .eq('is_active', true);

    if (managersError || !managers || managers.length === 0) {
      console.error('No managers found for OOR approval');
      return { success: false };
    }

    const managerUserId = managers[0].id;

    const notification = await notificationService.createNotification({
      user_id: managerUserId,
      title: 'Bölge Dışı Ziyaret Onay Talebi',
      description: `${payload.customerName || 'Müşteri'} (${payload.customerDistrict || 'Bilinmeyen bölge'}) için bölge dışı ziyaret onayı gerekiyor. Sebep: ${payload.reason || 'Belirtilmedi'}. Tahmini gelir: ${payload.estimatedRevenue ? `${payload.estimatedRevenue} TL` : 'Belirtilmedi'}.`,
      type: 'visit',
      data: {
        visitId: payload.visitId,
        customerId: payload.customerId,
        salesRepId: payload.salesRepId,
        type: 'oor_approval',
        reason: payload.reason,
        estimatedRevenue: payload.estimatedRevenue,
      },
    });

    if (notification) {
      return { success: true, notificationId: notification.id };
    }

    return { success: false };
  } catch (error) {
    console.error('OOR approval request failed:', error);
    return { success: false };
  }
}
