// src/screens/VisitFlowScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  IdCard, Camera, Smartphone, FileText, PenLine, Send,
  ChevronRight, ShieldCheck, CheckCircle
} from 'lucide-react';
import { Customer } from '../RouteMap';

type Props = {
  customer: Customer;
  onCloseToList: () => void;
  onCompleteVisit: (updated: Customer) => void;
};

const VisitFlowScreen: React.FC<Props> = ({ customer, onCloseToList, onCompleteVisit }) => {
  const [flowStep, setFlowStep] = useState(1);
  const [flowSmsPhone, setFlowSmsPhone] = useState(customer.phone || '');
  const [flowSmsSent, setFlowSmsSent] = useState(false);
  const [flowContractAccepted, setFlowContractAccepted] = useState(false);

  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Kamera state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [nfcChecked, setNfcChecked] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [usingBack, setUsingBack] = useState(true);

  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  const isSecure = window.isSecureContext || window.location.protocol === 'https:' || isLocalhost;

  // --- İMZA CANVAS ---
  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let drawing = false;

    const getPos = (e: any, c: HTMLCanvasElement) => {
      const rect = c.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };
    const start = (e: MouseEvent | TouchEvent) => { drawing = true; const { x, y } = getPos(e, canvas); ctx.beginPath(); ctx.moveTo(x, y); };
    const move = (e: MouseEvent | TouchEvent) => { if (!drawing) return; const { x, y } = getPos(e, canvas); ctx.lineTo(x, y); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke(); };
    const end = () => { drawing = false; };
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start); canvas.addEventListener('touchmove', move); window.addEventListener('touchend', end);
    return () => {
      canvas.removeEventListener('mousedown', start); canvas.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start); canvas.removeEventListener('touchmove', move); window.removeEventListener('touchend', end);
    };
  }, [flowStep]);

  // --- KAMERA: Başlat / Durdur ---
  const startCamera = async (back = true) => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: back ? { ideal: 'environment' } : { ideal: 'user' }
        },
        audio: false
      } as any;
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      setUsingBack(back);
    } catch (err: any) {
      setCameraError(`${err?.name || 'Hata'}: ${err?.message || 'Kamera başlatılamadı'}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  // stream'i <video>'ya bağla
  useEffect(() => {
    const v = videoRef.current;
    if (v && stream) {
      v.srcObject = stream as any;
      // iOS Safari için: muted + playsInline + autoplay
      v.muted = true;
      v.playsInline = true;
      // play() user gesture gerektirebilir ama muted+playsInline genelde yeterli
      v.play().catch(() => {/* sessizce yut */});
    }
  }, [stream]);

  // Adımdan çıkarken kamerayı kapat
  useEffect(() => {
    if (flowStep !== 2) stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowStep]);

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-4">
      {[1,2,3,4].map(n => (
        <div key={n} className={`h-2 rounded-full ${flowStep >= n ? 'bg-[#0099CB]' : 'bg-gray-200'}`} style={{ width: 56 }} />
      ))}
    </div>
  );

  const complete = () => {
    onCompleteVisit({ ...customer, status: 'Tamamlandı' as const });
    onCloseToList();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Ziyaret Akışı</h1>
        <button onClick={onCloseToList} className="text-gray-600 hover:text-gray-900">← Listeye Dön</button>
      </div>
      <StepIndicator />

      {/* ADIM 1 */}
      {flowStep === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <IdCard className="w-5 h-5 text-[#0099CB]" />
            <h3 className="text-lg font-semibold">Müşteri Bilgileri</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600">Ad Soyad</label><input defaultValue={customer.name} className="w-full mt-1 p-2 border rounded-lg" /></div>
            <div><label className="text-sm text-gray-600">Telefon</label><input defaultValue={customer.phone} className="w-full mt-1 p-2 border rounded-lg" /></div>
            <div className="md:col-span-2"><label className="text-sm text-gray-600">Adres</label><input defaultValue={`${customer.address}, ${customer.district}`} className="w-full mt-1 p-2 border rounded-lg" /></div>
            <div><label className="text-sm text-gray-600">Sayaç No</label><input defaultValue={customer.meterNumber} className="w-full mt-1 p-2 border rounded-lg" /></div>
            <div><label className="text-sm text-gray-600">Tarife</label><input defaultValue={customer.tariff} className="w-full mt-1 p-2 border rounded-lg" /></div>
          </div>
          <div className="mt-6 text-right">
            <button onClick={() => setFlowStep(2)} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
              Devam <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ADIM 2: Kimlik Doğrulama */}
      {flowStep === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          {!isSecure && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
              Mobilde kamerayı açmak için HTTPS gerekir. Hızlı çözüm:
              <b> ngrok</b>/<b>Cloudflare Tunnel</b> ile 5173 portunu tünelleyin veya
              Vite’i HTTPS ile çalıştırın (örn. <code>vite --https --host</code> ve yerel sertifika).
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <Camera className="w-5 h-5 text-[#0099CB]" />
            <h3 className="text-lg font-semibold">Kimlik Doğrulama</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Kamera */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Kamera Önizleme</p>
              <div className="aspect-video bg-black/5 rounded-lg overflow-hidden flex items-center justify-center">
                {stream ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    controls={false}
                    // iOS PIP engelle:
                    disablePictureInPicture
                  />
                ) : (
                  <div className="text-gray-500 text-sm p-6 text-center">
                    Kamera başlatılmadı.
                    <div className="mt-2">
                      <button
                        onClick={() => startCamera(true)}
                        className="px-4 py-2 bg-[#0099CB] text-white rounded-lg"
                      >
                        Kamerayı Başlat (Arka)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => (stream ? stopCamera() : startCamera(usingBack))}
                  className="px-4 py-2 bg-white border rounded-lg"
                >
                  {stream ? 'Kamerayı Durdur' : 'Kamerayı Başlat'}
                </button>
                <button
                  onClick={() => { stopCamera(); startCamera(!usingBack); }}
                  className="px-4 py-2 bg-white border rounded-lg"
                >
                  Ön/Arka Değiştir
                </button>
                <button onClick={() => alert('Fotoğraf çekildi (simülasyon).')} className="px-4 py-2 bg-[#0099CB] text-white rounded-lg">
                  Fotoğraf Çek
                </button>
                <button onClick={() => alert('Kimlik OCR işlendi (simülasyon).')} className="px-4 py-2 bg-white border rounded-lg">
                  OCR İşle
                </button>
              </div>

              {cameraError && (
                <div className="mt-2 text-sm text-red-600">
                  {cameraError}
                  {cameraError.includes('NotAllowedError') && ' — Tarayıcı izinlerini kontrol edin.'}
                </div>
              )}
            </div>

            {/* NFC */}
            <div>
              <p className="text-sm text-gray-600 mb-2">NFC Kimlik Okuma</p>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-[#0099CB]" />
                  <span>Telefonu kimliğe yaklaştırın</span>
                </div>
                <button
                  onClick={() => setNfcChecked(true)}
                  className={`px-4 py-2 rounded-lg ${nfcChecked ? 'bg-green-600 text-white' : 'bg-[#F9C800] text-gray-900'}`}
                >
                  {nfcChecked ? 'NFC Başarılı' : 'NFC Okut'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Not: Tarayıcı NFC API desteklemiyorsa bu adım simüle edilir.
                </p>
              </div>

              <div className="mt-4">
                <label className="text-sm text-gray-600">Doğrulama Notu</label>
                <textarea className="w-full mt-1 p-2 border rounded-lg" rows={3} placeholder="Kimlik bilgileri kontrol notları..." />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={() => setFlowStep(1)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
            <button
              onClick={() => setFlowStep(3)}
              disabled={!nfcChecked}
              className={`px-6 py-3 rounded-lg ${nfcChecked ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-600'}`}
            >
              Devam
            </button>
          </div>
        </div>
      )}

      {/* ADIM 3 */}
      {flowStep === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-[#0099CB]" />
            <h3 className="text-lg font-semibold">Sözleşme Onayı</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Sözleşme Önizleme</p>
              <div className="h-64 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <div className="text-center text-gray-500 text-sm">Sözleşme PDF önizlemesi (placeholder)</div>
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={flowContractAccepted} onChange={(e) => setFlowContractAccepted(e.target.checked)} />
                Koşulları okudum, onaylıyorum.
              </label>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2"><PenLine className="w-4 h-4" /> Islak/Dijital İmza</p>
              <div className="border rounded-lg p-2">
                <canvas ref={signatureCanvasRef} width={520} height={180} className="w-full h-[180px] bg-white rounded" />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      const c = signatureCanvasRef.current; if (!c) return;
                      const ctx = c.getContext('2d'); if (!ctx) return;
                      ctx.clearRect(0, 0, c.width, c.height);
                    }}
                    className="px-3 py-2 bg-white border rounded-lg"
                  >
                    Temizle
                  </button>
                  <button onClick={() => alert('İmza kaydedildi (simülasyon).')} className="px-3 py-2 bg-[#0099CB] text-white rounded-lg">
                    İmzayı Kaydet
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-2"><Send className="w-4 h-4" /> SMS ile Onay</p>
                <div className="flex gap-2">
                  <input value={flowSmsPhone} onChange={(e)=>setFlowSmsPhone(e.target.value)} className="flex-1 p-2 border rounded-lg" placeholder="5XX XXX XX XX" />
                  <button onClick={() => setFlowSmsSent(true)} className="px-4 py-2 bg-[#F9C800] rounded-lg">SMS Gönder</button>
                </div>
                {flowSmsSent && <div className="mt-2 flex items-center gap-2 text-green-700 text-sm"><ShieldCheck className="w-4 h-4" />Doğrulama SMS’i gönderildi (simülasyon).</div>}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={() => setFlowStep(2)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
            <button
              onClick={() => setFlowStep(4)}
              disabled={!flowContractAccepted}
              className={`px-6 py-3 rounded-lg ${flowContractAccepted ? 'bg-[#0099CB] text-white' : 'bg-gray-300 text-gray-600'}`}
            >
              Devam
            </button>
          </div>
        </div>
      )}

      {/* ADIM 4 */}
      {flowStep === 4 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-[#0099CB]" />
            <h3 className="text-lg font-semibold">Satışı Tamamla</h3>
          </div>
          <div className="p-4 border rounded-lg bg-gray-50">
            <p className="text-gray-800"><b>Müşteri:</b> {customer.name}</p>
            <p className="text-gray-800"><b>Adres:</b> {customer.address}, {customer.district}</p>
            <p className="text-gray-800"><b>Tarife:</b> {customer.tariff}</p>
            <p className="text-gray-800"><b>Telefon:</b> {customer.phone}</p>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setFlowStep(3)} className="px-4 py-2 rounded-lg bg-white border">Geri</button>
            <button onClick={complete} className="px-6 py-3 rounded-lg bg-green-600 text-white">Satışı Kaydet</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitFlowScreen;
