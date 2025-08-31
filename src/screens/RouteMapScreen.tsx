// src/screens/RouteMapScreen.tsx
import React from 'react';
import RouteMap, { Customer, SalesRep as MapSalesRep } from '../RouteMap';

type Props = {
  customers: Customer[];
  salesRep: MapSalesRep;
};

const RouteMapScreen: React.FC<Props> = ({ customers, salesRep }) => {
  return (
    <div className="p-6">
      <RouteMap customers={customers} salesRep={salesRep as any} />
    </div>
  );
};

export default RouteMapScreen;
