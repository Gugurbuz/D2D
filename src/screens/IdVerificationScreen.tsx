import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

interface IdVerificationScreenProps {
  onVerified: () => void;
  onSkip?: () => void;
  bypassEnabled?: boolean;
}

const IdVerificationScreen: React.FC<IdVerificationScreenProps> = ({
  onVerified,
  onSkip,
  bypassEnabled = true,
}) => {
  const [step, setStep] = useState<'capture' | 'preview' | 'verifying' | 'success' | 'error'>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setUseCamera(true);
      }
    } catch (err) {
      console.error('Kamera erişim hatası:', err);
      setErrorMessage('Kameraya erişim sağlanamadı. Lütfen dosya yükleme seçeneğini kullanın.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        setStep('preview');
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
        setStep('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setStep('capture');
    setErrorMessage(null);
  };

  const verifyId = async () => {
    setStep('verifying');
    setErrorMessage(null);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const randomSuccess = Math.random() > 0.2;

    if (randomSuccess) {
      setStep('success');
      setTimeout(() => {
        onVerified();
      }, 1500);
    } else {
      setStep('error');
      setErrorMessage('Kimlik doğrulaması başarısız oldu. Lütfen kimliğinizin net ve tüm bilgilerin görünür olduğundan emin olun.');
    }
  };

  const handleBypassSkip = () => {
    if (bypassEnabled && onSkip) {
      onSkip();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="bg-gradient-to-r from-[#0099CB] to-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Kimlik Doğrulama</h1>
          <p className="text-blue-100">
            Devam etmek için lütfen kimlik belgenizi doğrulayın
          </p>
        </div>

        <div className="p-8">
          {step === 'capture' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Kimlik doğrulama talimatları:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Kimliğinizin tüm bilgileri net görünmeli</li>
                      <li>Fotoğraf iyi aydınlatılmış olmalı</li>
                      <li>T.C. Kimlik Kartı veya Ehliyet kullanabilirsiniz</li>
                    </ul>
                  </div>
                </div>
              </div>

              {useCamera ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0088B8] transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Fotoğraf Çek
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0099CB] hover:bg-blue-50 transition-all group"
                  >
                    <Camera className="w-12 h-12 text-gray-400 group-hover:text-[#0099CB] transition-colors" />
                    <span className="font-medium text-gray-700 group-hover:text-[#0099CB]">
                      Kamera ile Çek
                    </span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0099CB] hover:bg-blue-50 transition-all group"
                  >
                    <Upload className="w-12 h-12 text-gray-400 group-hover:text-[#0099CB] transition-colors" />
                    <span className="font-medium text-gray-700 group-hover:text-[#0099CB]">
                      Dosya Yükle
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              {bypassEnabled && onSkip && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleBypassSkip}
                    className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                  >
                    Şimdilik Atla
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && capturedImage && (
            <div className="space-y-6">
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                <img src={capturedImage} alt="Kimlik Önizleme" className="w-full" />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={retakePhoto}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Tekrar Çek
                </button>
                <button
                  onClick={verifyId}
                  className="flex-1 bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0088B8] transition-colors"
                >
                  Doğrula
                </button>
              </div>
            </div>
          )}

          {step === 'verifying' && (
            <div className="py-12 text-center">
              <Loader2 className="w-16 h-16 text-[#0099CB] animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Kimlik Doğrulanıyor
              </h3>
              <p className="text-gray-600">
                Lütfen bekleyin, kimliğiniz kontrol ediliyor...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Doğrulama Başarılı!
              </h3>
              <p className="text-gray-600">
                Kimliğiniz başarıyla doğrulandı. Yönlendiriliyorsunuz...
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-6">
              <div className="py-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Doğrulama Başarısız
                </h3>
                {errorMessage && (
                  <p className="text-gray-600 mb-4">{errorMessage}</p>
                )}
              </div>

              <button
                onClick={retakePhoto}
                className="w-full bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0088B8] transition-colors"
              >
                Tekrar Dene
              </button>

              {bypassEnabled && onSkip && (
                <button
                  onClick={handleBypassSkip}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                >
                  Şimdilik Atla
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default IdVerificationScreen;
