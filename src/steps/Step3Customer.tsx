// src/steps/Step3Customer.tsx
import React, { useState } from "react";
import { ShieldCheck, Phone, Check, Loader2 } from "lucide-react";

export type CustomerType = "Kurumsal" | "Bireysel";

export type Step3Data =
  | { type: "Kurumsal"; authorized: { name: string; surname: string; phone: string; email: string } }
  | { type: "Bireysel"; consents: { kvkk: boolean; marketing: boolean }; phone: string; smsVerified: boolean };

export default function Step3Customer({
  customerType,
  onBack,
  onNext
}: {
  customerType: CustomerType;
  onBack: () => void;
  onNext: (data: Step3Data) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {customerType === "Kurumsal" ? <Corporate onBack={onBack} onNext={onNext}/> : <Individual onBack={onBack} onNext={onNext}/>}
    </div>
  );
}

function Corporate({ onBack, onNext }:{
  onBack: ()=>void; onNext:(d: Step3Data)=>void
}) {
  const [f, setF] = useState({ name:"", surname:"", phone:"", email:"" });
  const canNext = f.name && f.surname && /^\+?\d{10,14}$/.test(f.phone);

  return (
    <>
      <h3 className="text-lg font-semibold">Yetkili Kişi Bilgileri</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <Input label="Ad"   value={f.name}    onChange={v=>setF({...f,name:v})}/>
        <Input label="Soyad" value={f.surname} onChange={v=>setF({...f,surname:v})}/>
        <Input label="Telefon (+90...)" value={f.phone} onChange={v=>setF({...f,phone:v})}/>
        <Input label="E-posta" value={f.email} onChange={v=>setF({...f,email:v})}/>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onBack} className="px-4 py-2 rounded-lg border">Geri</button>
        <button
          disabled={!canNext}
          onClick={()=>onNext({type:"Kurumsal", authorized:f})}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:bg-gray-300">
          İleri
        </button>
      </div>
    </>
  );
}

function Individual({ onBack, onNext }:{
  onBack: ()=>void; onNext:(d: Step3Data)=>void
}) {
  const [phone, setPhone] = useState("");
  const [consents, setConsents] = useState({ kvkk:false, marketing:false });
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  async function sendSms(to: string) {
    // TODO: SMS sağlayıcı entegrasyonu
    await new Promise(r=>setTimeout(r,500));
    setCodeSent(true);
  }
  async function verifySms() {
    setVerifying(true);
    await new Promise(r=>setTimeout(r,500));
    setVerified(code === "1234"); // DEMO
    setVerifying(false);
  }
  const canNext = consents.kvkk && verified;

  return (
    <>
      <h3 className="text-lg font-semibold">İzinler ve Doğrulama</h3>
      <div className="space-y-3">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={consents.kvkk} onChange={e=>setConsents({...consents, kvkk:e.target.checked})}/>
          <ShieldCheck className="w-4 h-4"/> KVKK Aydınlatma ve Açık Rıza
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={consents.marketing} onChange={e=>setConsents({...consents, marketing:e.target.checked})}/>
          Pazarlama ileti izinleri
        </label>

        <div className="grid md:grid-cols-[2fr_1fr] gap-2 items-end">
          <Input label="Telefon (+90...)" value={phone} onChange={setPhone}/>
          <button
            disabled={!/^\+?\d{10,14}$/.test(phone) || codeSent}
            onClick={()=>sendSms(phone)}
            className="px-4 py-2 rounded-lg border inline-flex items-center gap-2">
            <Phone className="w-4 h-4"/> Kod Gönder
          </button>
        </div>

        {codeSent && (
          <div className="grid md:grid-cols-[2fr_1fr] gap-2 items-end">
            <Input label="SMS Kodu" value={code} onChange={setCode}/>
            <button onClick={verifySms} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
              Doğrula
            </button>
          </div>
        )}

        {verified && <div className="text-sm text-emerald-700">Telefon doğrulandı.</div>}
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onBack} className="px-4 py-2 rounded-lg border">Geri</button>
        <button
          disabled={!canNext}
          onClick={()=>onNext({type:"Bireysel", consents, phone, smsVerified:true})}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:bg-gray-300">
          İleri
        </button>
      </div>
    </>
  );
}

function Input({label, value, onChange}:{label:string; value:string; onChange:(v:string)=>void}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2"/>
    </div>
  );
}
