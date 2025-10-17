import React from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { BRAND_COLORS } from '../styles/theme';

interface OORBannerProps {
  customerName?: string;
  customerDistrict?: string;
  repRegion?: string;
  approvalRequested: boolean;
  approvalGranted: boolean;
  onRequestApproval: () => void;
}

export const OORBanner: React.FC<OORBannerProps> = ({
  customerName,
  customerDistrict,
  repRegion,
  approvalRequested,
  approvalGranted,
  onRequestApproval,
}) => {
  if (!customerDistrict || !repRegion) return null;

  const isOutOfRegion = repRegion.toLowerCase() !== customerDistrict.toLowerCase();

  if (!isOutOfRegion) return null;

  return (
    <div
      className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
        approvalGranted
          ? 'bg-green-50 border-green-300'
          : approvalRequested
          ? 'bg-blue-50 border-blue-300'
          : 'bg-yellow-50 border-yellow-300'
      }`}
    >
      <AlertTriangle
        className={`w-6 h-6 flex-shrink-0 ${
          approvalGranted
            ? 'text-green-600'
            : approvalRequested
            ? 'text-blue-600'
            : 'text-yellow-600'
        }`}
      />
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 mb-1">
          {approvalGranted
            ? 'Bölge Dışı Ziyaret Onaylandı'
            : approvalRequested
            ? 'Onay Bekleniyor'
            : 'Bölge Dışı Ziyaret'}
        </h4>
        <p className="text-sm text-gray-700">
          {approvalGranted ? (
            <>
              Bu ziyaret için bölge dışı onay alındı. Ziyarete devam edebilirsiniz.
            </>
          ) : approvalRequested ? (
            <>
              Yöneticiniz onay talebinizi inceliyor. Onaylandığında bildirim alacaksınız.
            </>
          ) : (
            <>
              <strong>{customerName || 'Müşteri'}</strong>, sizin bölgenizin ({repRegion}) dışında (
              {customerDistrict}). Bu ziyaret için yönetici onayı gerekiyor.
            </>
          )}
        </p>
        {!approvalRequested && !approvalGranted && (
          <button
            onClick={onRequestApproval}
            className="mt-3 px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            <Send className="w-4 h-4" />
            Onay Talep Et
          </button>
        )}
      </div>
    </div>
  );
};
