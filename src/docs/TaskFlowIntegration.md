# TaskFlow v2 Integration Guide

## Overview

TaskFlow v2 is a unified state management system for visit flows that standardizes both in-region and out-of-region visit workflows.

## Core Components

### 1. TaskFlow Store (`src/store/taskFlowStore.ts`)

Central state manager using Zustand with:
- **Events**: `START_VISIT`, `SET_CUSTOMER`, `KYC_OK`, `CONTRACT_ACCEPTED`, `SET_RESULT`, `OOR_DETECTED`, `OOR_APPROVAL_REQUESTED`, `OOR_APPROVED`, `SAVE_DRAFT`, `FINALIZE`
- **States**: `SETUP` → `CUSTOMER` → `KYC` → `CONTRACT` → `RESULT` → `DONE`
- **Guards**: `canNextFromKYC()`, `requiresOOR()`, `canFinalize()`

### 2. Status Standardization

All visit statuses now use DB enums directly:
```typescript
import type { VisitStatus } from '../types';

// Old → New mapping:
// Pending → planned
// InProgress → in_progress
// Completed → completed
// Rejected → rejected
// Unreachable → no_answer
// Postponed → cancelled
```

### 3. Region Check & OOR Flow

#### Region Check
```typescript
import { checkRegion } from '../utils/regionCheck';

const result = await checkRegion(
  customer.district, // or { lat, lng }
  salesRepId
);

if (result.isOutOfRegion && result.requiresApproval) {
  // Show OOR banner and request approval
}
```

#### Request Approval
```typescript
import { requestOORApproval } from '../utils/regionCheck';

await requestOORApproval({
  visitId: visit.id,
  customerId: customer.id,
  salesRepId: rep.id,
  reason: 'High-value opportunity',
  estimatedRevenue: 50000,
  customerName: customer.name,
  customerDistrict: customer.district,
});
```

### 4. UI Components

#### FlowStepper
```typescript
import { FlowStepper } from '../components/FlowStepper';

<FlowStepper
  steps={[
    { key: 'CUSTOMER', label: 'Müşteri' },
    { key: 'KYC', label: 'Doğrulama' },
    { key: 'CONTRACT', label: 'Sözleşme' },
    { key: 'RESULT', label: 'Sonuç' },
  ]}
  currentStepKey={currentStep}
  completedSteps={['CUSTOMER']}
/>
```

#### OOR Banner
```typescript
import { OORBanner } from '../components/OORBanner';

<OORBanner
  customerName={customer.name}
  customerDistrict={customer.district}
  repRegion={rep.region}
  approvalRequested={oorData.approvalRequested}
  approvalGranted={oorData.approvalGranted}
  onRequestApproval={handleRequestApproval}
/>
```

## Integration Pattern

### VisitFlowScreen (In-Region)

```typescript
import { useTaskFlowStore } from '../store/taskFlowStore';
import { FlowStepper } from '../components/FlowStepper';
import { visitService } from '../services/visitService';

const VisitFlow: React.FC = () => {
  const { currentStep, dispatch, canNextFromKYC } = useTaskFlowStore();

  // Auto-save on step transition
  useEffect(() => {
    const saveDraft = async () => {
      await visitService.upsertVisitDraft({
        id: visitId,
        customer_id: customerId,
        sales_rep_id: repId,
        status: 'in_progress',
        visit_date: new Date().toISOString(),
      });
      dispatch('SAVE_DRAFT');
    };

    saveDraft();
  }, [currentStep]);

  const handleKYCComplete = () => {
    if (canNextFromKYC()) {
      dispatch('KYC_OK', { kvkkAccepted: true, smsVerified: true });
    }
  };

  return (
    <div>
      <FlowStepper ... />
      {/* Step content based on currentStep */}
    </div>
  );
};
```

### OutOfRegionVisitWizard Integration

The OutOfRegionWizard steps should be integrated into TaskFlow:

1. **POD Check** → Part of `CUSTOMER` step
2. **Customer Details** → `CUSTOMER` step with OOR detection
3. **Competitor Info** → Additional data in `CUSTOMER` step
4. **Summary** → Transition to `KYC` after OOR approval

```typescript
const handleCustomerSet = async (customerData) => {
  dispatch('SET_CUSTOMER', customerData);

  // Check region
  const regionCheck = await checkRegion(
    customerData.district,
    repId
  );

  if (regionCheck.isOutOfRegion) {
    dispatch('OOR_DETECTED', {
      customerDistrict: regionCheck.customerDistrict,
      repRegion: regionCheck.repRegion,
    });

    // Request approval
    await requestOORApproval({
      customerId: customerData.id,
      salesRepId: repId,
      reason: 'Out of assigned region',
      estimatedRevenue: customerData.estimatedRevenue,
    });

    dispatch('OOR_APPROVAL_REQUESTED', {
      requestedBy: repId,
    });
  }
};
```

## Draft & Planning

### Save Draft
```typescript
// Auto-save every step transition
dispatch('SAVE_DRAFT');
await visitService.upsertVisitDraft({...});
```

### Save and Plan
```typescript
// When user clicks "Kaydet ve Planla"
await visitService.upsertVisitDraft({
  status: 'planned',
  planned_time: selectedTime,
  // ... other fields
});

// If OOR, notify manager
if (oorData.isOutOfRegion) {
  await requestOORApproval({...});
}
```

## Guards & Validation

### canNextFromKYC
```typescript
// For residential customers
kvkkAccepted && smsVerified

// For commercial customers
representativeName && representativePhone && representativeConsent
```

### requiresOOR
```typescript
repRegion.toLowerCase() !== customerDistrict.toLowerCase()
```

### canFinalize
```typescript
// All conditions must be met:
contractAccepted && smsVerified && resultStatus && (!oorData.isOutOfRegion || oorData.approvalGranted)
```

## CTA Standards

- **Devam**: Enabled when current step guards pass
- **Kaydet**: Save draft to DB
- **Kaydet ve Planla**: Save as `planned` status
- **Ziyareti Bitir**: Save as `completed/rejected/no_answer`

## Notifications

OOR approvals automatically create notifications for managers:
```typescript
{
  type: 'visit',
  title: 'Bölge Dışı Ziyaret Onay Talebi',
  data: {
    visitId,
    customerId,
    salesRepId,
    type: 'oor_approval',
  }
}
```

## Migration Checklist

- [x] Create TaskFlow store with events and guards
- [x] Standardize status types to DB enums
- [x] Implement region check utilities
- [x] Create unified Stepper component
- [x] Create OOR Banner component
- [x] Add draft auto-save to visitService
- [ ] Refactor VisitFlowScreen to use TaskFlow
- [ ] Integrate OutOfRegionWizard into TaskFlow
- [ ] Update all status references
- [ ] Test end-to-end flows
