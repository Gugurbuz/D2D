import React from 'react';

export const RouteMapScreen = ({ customers, salesRep }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Rota Haritası</h1></div>
);

export const VisitListScreen = ({ customers, assignments, allReps, setCurrentScreen, onSelectCustomer }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Ziyaret Listesi</h1></div>
);

export const VisitDetailScreen = ({ customer, onBack, onStartVisit }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Ziyaret Detayı</h1></div>
);

export const VisitFlowScreen = ({ customer, onCloseToList, onCompleteVisit }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Ziyaret Akışı</h1></div>
);

export const ReportsScreen = ({ customers }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Raporlar</h1></div>
);

export const AssignmentScreen = ({ customers, assignments, setAssignments, allReps, setCurrentScreen }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Atamalar</h1></div>
);

export const AssignmentMapScreen = ({ customers, assignments, setAssignments, allReps, onBack }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Atama Haritası</h1></div>
);

export const TeamMapScreen = ({ reps }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Takım Haritası</h1></div>
);

export const MessagesScreen = () => (
  <div className="p-6"><h1 className="text-2xl font-bold">Mesajlar</h1></div>
);

export const ProfileScreens = ({ role }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Profil</h1></div>
);

export const InvoiceOcrPage = ({ onContinue }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Fatura OCR</h1></div>
);

export const UserManagementScreen = () => (
  <div className="p-6"><h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1></div>
);

export const SystemManagementScreen = () => (
  <div className="p-6"><h1 className="text-2xl font-bold">Sistem Yönetimi</h1></div>
);

export const TariffsScreen = () => (
  <div className="p-6"><h1 className="text-2xl font-bold">Tarifeler</h1></div>
);

export const FieldOpsMapScreen = () => (
  <div className="p-6"><h1 className="text-2xl font-bold">Saha Operasyonları</h1></div>
);

export const SystemReportsScreen = () => (
  <div className="p-6"><h1 className="text-2xl font-bold">Sistem Raporları</h1></div>
);

export const OutOfRegionVisitWizard = ({ onBack, onFinish }: any) => (
  <div className="p-6"><h1 className="text-2xl font-bold">Bölge Dışı Ziyaret</h1></div>
);
