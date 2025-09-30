import React from 'react';

type Props = {
  agentName: string;
  headerMessage: string;
  currentTime: string;
};

const DashboardHeader: React.FC<Props> = ({ agentName, headerMessage, currentTime }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Merhaba, {agentName}!
          </h1>
          <p className="text-gray-600 mt-1">{headerMessage}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Şu an</div>
          <div className="text-lg font-semibold text-gray-900">{currentTime}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;