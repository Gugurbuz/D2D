# Quick Start Guide - Contract Approval Enhancements

## 🚀 Getting Started in 5 Minutes

### Step 1: Database Setup

Run the migration to create new tables:

```bash
# The migration file is already created at:
# supabase/migrations/20250906220000_contract_management_system.sql

# It will be applied automatically when you connect to Supabase
```

**Tables Created:**
- `contract_drafts` - Auto-save storage
- `contract_audit_log` - Compliance tracking
- `offline_sync_queue` - Offline operations
- `contract_signatures` - Signature storage

### Step 2: Use the Enhanced Component

Replace the existing `ContractStep` with `EnhancedContractStep`:

```tsx
// Before:
<ContractStep state={state} dispatch={dispatch} customer={customer} />

// After:
import EnhancedContractStep from './components/EnhancedContractStep';

<EnhancedContractStep
  customer={customer}
  visitId="visit-123"
  salesRepId="rep-456"
  contractAccepted={state.contractAccepted}
  smsSent={state.smsSent}
  signatureDataUrl={state.idPhoto}
  onContractAcceptChange={(accepted) =>
    dispatch({ type: 'SET_CONTRACT_ACCEPTED', payload: accepted })
  }
  onSmsSentChange={(sent) =>
    dispatch({ type: 'SET_SMS_SENT', payload: sent })
  }
  onSignatureChange={(dataUrl) =>
    dispatch({ type: 'SET_ID_PHOTO', payload: dataUrl })
  }
  onBack={() => dispatch({ type: 'SET_STEP', payload: 2 })}
  onContinue={() => dispatch({ type: 'SET_STEP', payload: 4 })}
  onOpenSignaturePad={() => setSigOpen(true)}
  onOpenContractModal={() => setContractOpen(true)}
/>
```

### Step 3: Verify Environment Variables

Ensure your `.env` file has Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 4: Test the Features

1. **Progress Indicator**: Complete each step and watch the percentage increase
2. **Smart Highlighting**: Notice the blue border guiding you
3. **Auto-Save**: Make changes and see "Kaydedildi ✓" appear
4. **Offline Mode**: Turn off WiFi and see the yellow banner
5. **Quick Actions**: Click the blue button in bottom-right corner

---

## 📦 Component Usage Examples

### 1. Progress Indicator Only

```tsx
import ContractProgressIndicator from './components/ContractProgressIndicator';

<ContractProgressIndicator
  progress={{
    contractAccepted: true,
    signatureCaptured: false,
    smsSent: false,
    otpVerified: false
  }}
/>
```

### 2. Smart Field Wrapper

```tsx
import SmartFieldWrapper from './components/SmartFieldWrapper';
import { useFieldSequence } from './hooks/useSmartFieldFocus';

const fields = ['field1', 'field2', 'field3'];
const sequence = useFieldSequence(fields);

<SmartFieldWrapper
  fieldId="field1"
  label="Contract Acceptance"
  isActive={sequence.isFieldActive('field1')}
  isComplete={sequence.isFieldComplete('field1')}
  tooltip="Read and accept the contract terms"
>
  <input type="checkbox" />
</SmartFieldWrapper>
```

### 3. Auto-Save Hook

```tsx
import { useContractAutoSave } from './hooks/useContractAutoSave';
import AutoSaveIndicator from './components/AutoSaveIndicator';

const contractData = {
  visitId: 'visit-123',
  customerId: 'customer-456',
  salesRepId: 'rep-789',
  contractAccepted: true,
  signatureDataUrl: 'data:image/png;base64,...',
  smsPhone: '05551234567',
  smsSent: true,
  otpCode: '1234',
  otpVerified: false
};

const { saveStatus, lastSavedAt, manualSave } = useContractAutoSave(contractData);

<AutoSaveIndicator
  status={saveStatus}
  lastSavedAt={lastSavedAt}
  onRetry={manualSave}
/>
```

### 4. Offline Sync Hook

```tsx
import { useOfflineSync } from './hooks/useOfflineSync';
import OfflineBanner from './components/OfflineBanner';

const {
  connectionStatus,
  queuedOperations,
  isSyncing,
  syncProgress,
  manualSync,
  addToQueue
} = useOfflineSync('sales-rep-id');

// Queue an operation when offline
addToQueue('signature_captured', { signatureUrl: '...' });

<OfflineBanner
  connectionStatus={connectionStatus}
  queueCount={queuedOperations.length}
  isSyncing={isSyncing}
  syncProgress={syncProgress}
  onManualSync={manualSync}
/>
```

### 5. Quick Actions Toolbar

```tsx
import QuickActionsToolbar, { QuickAction } from './components/QuickActionsToolbar';

const actions: QuickAction[] = [
  {
    id: 'preview',
    label: 'Preview Contract',
    icon: <FileIcon />,
    onClick: () => openModal(),
    shortcut: 'p',
    variant: 'secondary'
  },
  {
    id: 'save',
    label: 'Save & Exit',
    icon: <SaveIcon />,
    onClick: () => save(),
    shortcut: 'q',
    variant: 'primary'
  }
];

<QuickActionsToolbar
  actions={actions}
  position="bottom-right"
/>
```

---

## 🎯 Key Features at a Glance

| Feature | Component | Hook | Database Table |
|---------|-----------|------|----------------|
| Progress Tracking | `ContractProgressIndicator` | - | - |
| Smart Highlighting | `SmartFieldWrapper` | `useSmartFieldFocus` | - |
| Auto-Save | `AutoSaveIndicator` | `useContractAutoSave` | `contract_drafts` |
| Offline Sync | `OfflineBanner` | `useOfflineSync` | `offline_sync_queue` |
| Quick Actions | `QuickActionsToolbar` | - | - |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Preview Contract |
| `Ctrl+D` | Clear Signature |
| `Ctrl+S` | Resend SMS |
| `Ctrl+Q` | Save & Exit |
| `Ctrl+H` | Call Support |
| `Ctrl+K` | Show All Shortcuts |

---

## 🔧 Configuration Options

### Auto-Save Configuration

```tsx
useContractAutoSave(data, {
  enabled: true,           // Enable/disable auto-save
  debounceMs: 3000,        // Delay before saving (ms)
  maxRetries: 3,           // Max retry attempts
  onSaveSuccess: (id) => { /* callback */ },
  onSaveError: (err) => { /* callback */ }
});
```

### Offline Sync Configuration

```tsx
useOfflineSync(salesRepId, {
  maxRetries: 3,           // Max retry attempts
  retryDelay: 2000,        // Delay between retries (ms)
  enableIndexedDB: true    // Use local storage
});
```

---

## 🐛 Troubleshooting

### Auto-Save Not Working

**Problem:** "Kayıt başarısız" message appears

**Solutions:**
1. Check Supabase connection in `.env`
2. Verify RLS policies allow insert/update
3. Check browser console for errors
4. Try manual save button

### Offline Sync Not Working

**Problem:** Operations not syncing when back online

**Solutions:**
1. Check connection status banner (should be green)
2. Click "Şimdi Senkronize Et" button
3. Clear browser cache and IndexedDB
4. Check Supabase offline_sync_queue table

### Smart Highlighting Stuck

**Problem:** Wrong field is highlighted

**Solutions:**
1. Refresh the page to reset state
2. Check field completion logic
3. Verify field IDs match sequence array
4. Review browser console for errors

---

## 📊 Monitoring & Debugging

### View Auto-Save Drafts

```sql
-- In Supabase SQL Editor
SELECT * FROM contract_drafts
WHERE sales_rep_id = 'your-rep-id'
ORDER BY updated_at DESC;
```

### View Audit Logs

```sql
-- See all actions for a visit
SELECT * FROM contract_audit_log
WHERE visit_id = 'visit-123'
ORDER BY action_timestamp DESC;
```

### View Offline Queue

```sql
-- Check pending operations
SELECT * FROM offline_sync_queue
WHERE status IN ('pending', 'failed')
ORDER BY priority DESC, created_at ASC;
```

### Browser DevTools

```javascript
// Check IndexedDB in browser console
indexedDB.databases().then(console.log);

// View localStorage
console.log(localStorage);

// Check session storage
console.log(sessionStorage);
```

---

## 🎨 Customization

### Change Colors

Edit `src/styles/theme.ts`:

```typescript
export const BRAND_COLORS = {
  navy: '#003B5C',    // Primary color
  yellow: '#FCD34D',  // Secondary color
  // ... add your colors
};
```

### Modify Auto-Save Interval

```tsx
// Change from 3 seconds to 5 seconds
useContractAutoSave(data, {
  debounceMs: 5000  // 5 seconds
});
```

### Add Custom Quick Action

```tsx
const customAction: QuickAction = {
  id: 'custom',
  label: 'My Action',
  icon: <MyIcon />,
  onClick: () => myFunction(),
  shortcut: 'm',
  variant: 'primary'
};

<QuickActionsToolbar
  actions={[...defaultActions, customAction]}
/>
```

---

## 📱 Mobile Considerations

### Test on Mobile Devices

1. **Chrome DevTools**: Toggle device toolbar (Ctrl+Shift+M)
2. **Real Device**: Use USB debugging
3. **Network**: Test with throttled connection
4. **Offline**: Enable airplane mode

### Mobile-Specific Features

- Touch gestures for signature pad
- Responsive layout for small screens
- Battery-efficient background sync
- Reduced animation on low-end devices

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] Database migration applied successfully
- [ ] Environment variables configured
- [ ] RLS policies tested
- [ ] Auto-save working (test with draft recovery)
- [ ] Offline mode tested (disconnect network)
- [ ] All keyboard shortcuts working
- [ ] Mobile responsive on iOS and Android
- [ ] Accessibility tested with screen reader
- [ ] Performance metrics acceptable (< 200ms queries)
- [ ] Error handling tested (network failures)
- [ ] Audit logs capturing all actions
- [ ] Documentation updated
- [ ] User training materials prepared
- [ ] Support team notified of new features

---

## 📚 Additional Resources

- **Full Documentation**: See `CONTRACT_FEATURES.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Code Examples**: Check component files
- **Database Schema**: See migration file
- **Support**: Contact dev team or check logs

---

## 🎓 Training Resources

### For Sales Reps

**Video Tutorials:** (To be created)
1. Introduction to new features (5 min)
2. Using progress indicators (3 min)
3. Working offline (4 min)
4. Keyboard shortcuts (2 min)

**Quick Reference Card:**
Print and laminate for field use with key shortcuts and tips.

### For Managers

**Dashboard Access:**
- Login to Supabase
- Navigate to contract_drafts table
- Filter by date/rep for reports

---

**Last Updated:** October 2025
**Version:** 1.0.0
**Support:** dev-team@company.com
