import React, { useEffect, useState } from 'react';
import { useTaskFlowStore } from '../store/taskFlowStore';
import { FlowStepper } from '../components/FlowStepper';
import { OORBanner } from '../components/OORBanner';
import { checkRegion, requestOORApproval } from '../utils/regionCheck';
import { visitService } from '../services/visitService';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { BRAND_COLORS } from '../styles/theme';

const TaskFlowTestScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    currentStep,
    visitStatus,
    customerData,
    kycData,
    contractData,
    oorData,
    dispatch,
    canNextFromKYC,
    canFinalize,
  } = useTaskFlowStore();

  const [testCustomer, setTestCustomer] = useState({
    name: 'Test Müşteri',
    district: 'Ankara',
    customerType: 'residential' as const,
  });

  const [testRep, setTestRep] = useState({
    id: 'test-rep-1',
    region: 'Istanbul',
  });

  const steps = [
    { key: 'SETUP', label: 'Başlangıç' },
    { key: 'CUSTOMER', label: 'Müşteri' },
    { key: 'KYC', label: 'Doğrulama' },
    { key: 'CONTRACT', label: 'Sözleşme' },
    { key: 'RESULT', label: 'Sonuç' },
    { key: 'DONE', label: 'Tamamlandı' },
  ];

  const completedSteps = steps
    .filter((s) => steps.findIndex((x) => x.key === currentStep) > steps.findIndex((x) => x.key === s.key))
    .map((s) => s.key);

  const handleStartVisit = () => {
    dispatch('START_VISIT', { visitId: 'test-visit-1' });
  };

  const handleSetCustomer = async () => {
    dispatch('SET_CUSTOMER', {
      name: testCustomer.name,
      district: testCustomer.district,
      customerType: testCustomer.customerType,
    });

    const regionCheck = await checkRegion(testCustomer.district, testRep.id);

    if (regionCheck.isOutOfRegion) {
      dispatch('OOR_DETECTED', {
        customerDistrict: regionCheck.customerDistrict,
        repRegion: regionCheck.repRegion,
      });
    }
  };

  const handleRequestOORApproval = async () => {
    const result = await requestOORApproval({
      customerId: 'test-customer-1',
      salesRepId: testRep.id,
      customerName: testCustomer.name,
      customerDistrict: testCustomer.district,
      reason: 'Test approval request',
      estimatedRevenue: 10000,
    });

    if (result.success) {
      dispatch('OOR_APPROVAL_REQUESTED', {
        requestedBy: testRep.id,
      });
      alert('Onay talebi gönderildi! (Test modunda)');
    }
  };

  const handleOORApprove = () => {
    dispatch('OOR_APPROVED');
  };

  const handleKYCComplete = () => {
    if (testCustomer.customerType === 'residential') {
      dispatch('KYC_OK', {
        kvkkAccepted: true,
        smsVerified: true,
      });
    } else {
      dispatch('KYC_OK', {
        representativeName: 'Test Yetkili',
        representativePhone: '05001234567',
        representativeConsent: true,
      });
    }
  };

  const handleContractAccept = () => {
    dispatch('CONTRACT_ACCEPTED', {
      contractAccepted: true,
      signatureDataUrl: 'test-signature',
      smsVerified: true,
    });
  };

  const handleSetResult = (status: 'completed' | 'rejected' | 'no_answer' | 'cancelled') => {
    dispatch('SET_RESULT', {
      status,
      notes: 'Test notes',
      revenueAmount: status === 'completed' ? 5000 : 0,
    });
  };

  const handleFinalize = () => {
    dispatch('FINALIZE');
  };

  const handleSaveDraft = async () => {
    await visitService.upsertVisitDraft({
      id: 'test-visit-1',
      customer_id: 'test-customer-1',
      sales_rep_id: testRep.id,
      status: visitStatus,
      visit_date: new Date().toISOString().split('T')[0],
    });

    dispatch('SAVE_DRAFT');
    alert('Taslak kaydedildi!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">TaskFlow v2 Test Ekranı</h1>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Verileri</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Müşteri Adı</label>
            <input
              value={testCustomer.name}
              onChange={(e) => setTestCustomer({ ...testCustomer, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Müşteri Bölgesi</label>
            <input
              value={testCustomer.district}
              onChange={(e) => setTestCustomer({ ...testCustomer, district: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Temsilci Bölgesi</label>
            <input
              value={testRep.region}
              onChange={(e) => setTestRep({ ...testRep, region: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Müşteri Tipi</label>
            <select
              value={testCustomer.customerType}
              onChange={(e) =>
                setTestCustomer({
                  ...testCustomer,
                  customerType: e.target.value as 'residential' | 'commercial',
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="residential">Bireysel</option>
              <option value="commercial">Kurumsal</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
          >
            <Save className="w-4 h-4" />
            Taslak Kaydet
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <FlowStepper steps={steps} currentStepKey={currentStep} completedSteps={completedSteps} />

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm">
            <p>
              <strong>Durum:</strong> {visitStatus}
            </p>
            <p>
              <strong>Adım:</strong> {currentStep}
            </p>
            <p>
              <strong>Bölge Dışı:</strong> {oorData.isOutOfRegion ? 'Evet' : 'Hayır'}
            </p>
            {oorData.isOutOfRegion && (
              <>
                <p>
                  <strong>Onay Talep Edildi:</strong> {oorData.approvalRequested ? 'Evet' : 'Hayır'}
                </p>
                <p>
                  <strong>Onay Verildi:</strong> {oorData.approvalGranted ? 'Evet' : 'Hayır'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {oorData.isOutOfRegion && (
        <OORBanner
          customerName={customerData.name}
          customerDistrict={customerData.district}
          repRegion={oorData.repRegion}
          approvalRequested={oorData.approvalRequested}
          approvalGranted={oorData.approvalGranted}
          onRequestApproval={handleRequestOORApproval}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Akış Kontrolleri</h2>

        <div className="space-y-4">
          {currentStep === 'SETUP' && (
            <button
              onClick={handleStartVisit}
              className="w-full px-4 py-3 rounded-lg text-white font-semibold hover:opacity-90"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              Ziyareti Başlat
            </button>
          )}

          {currentStep === 'CUSTOMER' && (
            <>
              <button
                onClick={handleSetCustomer}
                className="w-full px-4 py-3 rounded-lg text-white font-semibold hover:opacity-90"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                Müşteri Bilgilerini Kaydet
              </button>
              {oorData.isOutOfRegion && !oorData.approvalGranted && (
                <button
                  onClick={handleOORApprove}
                  className="w-full px-4 py-3 rounded-lg border border-green-500 text-green-700 font-semibold hover:bg-green-50"
                >
                  [TEST] Onayı Simüle Et
                </button>
              )}
            </>
          )}

          {currentStep === 'KYC' && (
            <button
              onClick={handleKYCComplete}
              disabled={!canNextFromKYC()}
              className="w-full px-4 py-3 rounded-lg text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: canNextFromKYC() ? BRAND_COLORS.navy : undefined }}
            >
              KYC Tamamla {!canNextFromKYC() && '(Guard engelliyor)'}
            </button>
          )}

          {currentStep === 'CONTRACT' && (
            <button
              onClick={handleContractAccept}
              className="w-full px-4 py-3 rounded-lg text-white font-semibold hover:opacity-90"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              Sözleşmeyi Onayla
            </button>
          )}

          {currentStep === 'RESULT' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSetResult('completed')}
                className="px-4 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
              >
                Tamamlandı
              </button>
              <button
                onClick={() => handleSetResult('rejected')}
                className="px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Reddedildi
              </button>
              <button
                onClick={() => handleSetResult('no_answer')}
                className="px-4 py-3 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700"
              >
                Cevap Yok
              </button>
              <button
                onClick={() => handleSetResult('cancelled')}
                className="px-4 py-3 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700"
              >
                İptal
              </button>
            </div>
          )}

          {currentStep === 'RESULT' && (
            <button
              onClick={handleFinalize}
              disabled={!canFinalize()}
              className="w-full px-4 py-3 rounded-lg text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: canFinalize() ? BRAND_COLORS.navy : undefined }}
            >
              Ziyareti Tamamla {!canFinalize() && '(Guard engelliyor)'}
            </button>
          )}

          {currentStep === 'DONE' && (
            <div className="p-6 bg-green-50 rounded-lg border border-green-300 text-center">
              <p className="text-2xl font-bold text-green-700 mb-2">Ziyaret Tamamlandı!</p>
              <p className="text-green-600">
                Durum: <strong>{visitStatus}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskFlowTestScreen;
