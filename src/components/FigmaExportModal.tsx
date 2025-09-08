import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Camera, 
  Trash2, 
  Eye, 
  Figma, 
  Package, 
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { figmaExporter, ScreenCapture, FigmaExportOptions } from '../utils/figmaExport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: string;
}

const FigmaExportModal: React.FC<Props> = ({ isOpen, onClose, currentScreen }) => {
  const [captures, setCaptures] = useState<ScreenCapture[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedCaptures, setSelectedCaptures] = useState<Set<string>>(new Set());
  const [exportOptions, setExportOptions] = useState<FigmaExportOptions>({
    format: 'png',
    quality: 0.95,
    scale: 2,
    includeInteractions: false
  });
  const [previewCapture, setPreviewCapture] = useState<ScreenCapture | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setCaptures(figmaExporter.getAllCaptures());
    }
  }, [isOpen]);

  const handleCaptureCurrentScreen = async () => {
    setIsCapturing(true);
    try {
      // Capture the main content area
      const capture = await figmaExporter.captureScreen(
        'main', 
        getScreenDisplayName(currentScreen),
        `${getScreenDisplayName(currentScreen)} ekranının otomatik yakalama`
      );
      setCaptures(figmaExporter.getAllCaptures());
      setSelectedCaptures(new Set([capture.id]));
    } catch (error) {
      console.error('Screen capture failed:', error);
      alert('Ekran yakalama başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDeleteCapture = (id: string) => {
    figmaExporter.removeCapture(id);
    setCaptures(figmaExporter.getAllCaptures());
    setSelectedCaptures(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleToggleSelection = (id: string) => {
    setSelectedCaptures(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedCaptures(new Set(captures.map(c => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedCaptures(new Set());
  };

  const handleExportToFigma = async () => {
    if (selectedCaptures.size === 0) {
      alert('Lütfen en az bir ekran seçin.');
      return;
    }

    setExportStatus('exporting');
    try {
      const selectedCaptureData = captures.filter(c => selectedCaptures.has(c.id));
      const exportBlob = await figmaExporter.exportToFigma(selectedCaptureData, exportOptions);
      
      // Download the export package
      const link = document.createElement('a');
      link.href = URL.createObjectURL(exportBlob);
      link.download = `d2d_screens_figma_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      // Also download individual images
      figmaExporter.downloadAllAsZip(selectedCaptureData);
      
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const getScreenDisplayName = (screen: string): string => {
    const screenNames: Record<string, string> = {
      'dashboard': 'Dashboard',
      'route': 'Rota Haritası',
      'visits': 'Ziyaret Listesi',
      'visitDetail': 'Ziyaret Detayı',
      'visitFlow': 'Ziyaret Akışı',
      'reports': 'Raporlar',
      'assignments': 'Görev Atama',
      'assignmentMap': 'Atama Haritası',
      'team': 'Ekip Haritası',
      'messages': 'Mesajlar',
      'profile': 'Profil',
      'invoiceOcr': 'Fatura OCR',
      'userManagement': 'Kullanıcı Yönetimi',
      'systemManagement': 'Sistem Yönetimi',
      'systemReports': 'Sistem Raporları',
      'tariffs': 'Tarifeler',
      'fieldOpsMap': 'Saha Haritası'
    };
    return screenNames[screen] || screen;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Figma className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Figma'ya Aktar</h2>
              <p className="text-sm text-gray-600">Ekranları yakala ve Figma için hazırla</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Captures */}
          <div className="w-2/3 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Yakalanan Ekranlar</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCaptureCurrentScreen}
                  disabled={isCapturing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCapturing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {isCapturing ? 'Yakalıyor...' : 'Mevcut Ekranı Yakala'}
                </button>
              </div>
            </div>

            {captures.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Henüz ekran yakalanmadı</p>
                <p className="text-sm">Mevcut ekranı yakalamak için yukarıdaki butona tıklayın</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selection Controls */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    {selectedCaptures.size} / {captures.length} ekran seçili
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Seçimi Temizle
                    </button>
                  </div>
                </div>

                {/* Captures Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {captures.map((capture) => (
                    <div
                      key={capture.id}
                      className={`border-2 rounded-xl overflow-hidden transition-all ${
                        selectedCaptures.has(capture.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={capture.dataUrl}
                          alt={capture.name}
                          className="w-full h-32 object-cover cursor-pointer"
                          onClick={() => setPreviewCapture(capture)}
                        />
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={selectedCaptures.has(capture.id)}
                            onChange={() => handleToggleSelection(capture.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => setPreviewCapture(capture)}
                            className="p-1 rounded bg-black/50 text-white hover:bg-black/70"
                            title="Önizle"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCapture(capture.id)}
                            className="p-1 rounded bg-black/50 text-white hover:bg-black/70"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900 truncate">{capture.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {capture.dimensions.width} × {capture.dimensions.height}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(capture.timestamp).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Export Options */}
          <div className="w-1/3 border-l bg-gray-50 p-6">
            <h3 className="text-lg font-semibold mb-4">Dışa Aktarma Ayarları</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                  className="w-full rounded-lg border-gray-300"
                >
                  <option value="png">PNG (Önerilen)</option>
                  <option value="svg">SVG</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kalite ({Math.round(exportOptions.quality * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={exportOptions.quality}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ölçek ({exportOptions.scale}x)
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.5"
                  value={exportOptions.scale}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeInteractions}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeInteractions: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Etkileşim notları dahil et</span>
                </label>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t space-y-3">
              <button
                onClick={handleExportToFigma}
                disabled={selectedCaptures.size === 0 || exportStatus === 'exporting'}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportStatus === 'exporting' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Package className="w-5 h-5" />
                )}
                {exportStatus === 'exporting' ? 'Dışa Aktarılıyor...' : 'Figma Paketi İndir'}
              </button>

              {exportStatus === 'success' && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  Başarıyla dışa aktarıldı!
                </div>
              )}

              {exportStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  Dışa aktarma başarısız oldu.
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>• JSON metadata dosyası indirilecek</p>
                <p>• PNG dosyaları ayrı ayrı indirilecek</p>
                <p>• Figma'da File {'>'} Import ile kullanın</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewCapture && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold">{previewCapture.name}</h3>
                <p className="text-sm text-gray-500">
                  {previewCapture.dimensions.width} × {previewCapture.dimensions.height} • 
                  {new Date(previewCapture.timestamp).toLocaleString('tr-TR')}
                </p>
              </div>
              <button
                onClick={() => setPreviewCapture(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewCapture.dataUrl}
                alt={previewCapture.name}
                className="max-w-full h-auto rounded-lg border"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getScreenDisplayName = (screen: string): string => {
  const screenNames: Record<string, string> = {
    'dashboard': 'Dashboard',
    'route': 'Rota Haritası',
    'visits': 'Ziyaret Listesi',
    'visitDetail': 'Ziyaret Detayı',
    'visitFlow': 'Ziyaret Akışı',
    'reports': 'Raporlar',
    'assignments': 'Görev Atama',
    'assignmentMap': 'Atama Haritası',
    'team': 'Ekip Haritası',
    'messages': 'Mesajlar',
    'profile': 'Profil',
    'invoiceOcr': 'Fatura OCR',
    'userManagement': 'Kullanıcı Yönetimi',
    'systemManagement': 'Sistem Yönetimi',
    'systemReports': 'Sistem Raporları',
    'tariffs': 'Tarifeler',
    'fieldOpsMap': 'Saha Haritası'
  };
  return screenNames[screen] || screen;
};

export default FigmaExportModal;