# Autosave System Improvements

## ✅ **FIXED: Critical Bug #1 - hasUnsavedChanges Never Set to True**

**Problem**: `hasUnsavedChanges` was only set to `false` after saving, never to `true` when user makes changes. This broke the autosave logic.

**Fix Applied**: Added `setHasUnsavedChanges(true)` to all form change handlers when `projectLoaded` is true.

---

## 🚀 **Recommended Improvements**

### **1. Retry Mechanism for Failed Autosaves**

**Current**: If autosave fails, it just logs an error and returns `false`. No retry.

**Improvement**: Add exponential backoff retry logic.

```javascript
// In draftManagement.js
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 10000]; // 2s, 5s, 10s

export const handleAutoSaveDraft = async ({ ... }, retryCount = 0) => {
  try {
    // ... existing save logic ...
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount] || 10000;
      setTimeout(() => {
        handleAutoSaveDraft({ ... }, retryCount + 1);
      }, delay);
      return false;
    }
    // Show error to user after all retries fail
    setSnackbar?.({ 
      open: true, 
      message: 'Auto-save failed. Please save manually.', 
      severity: 'warning' 
    });
    return false;
  }
};
```

---

### **2. Error Notification for Failed Autosaves**

**Current**: Errors are only logged to console. User doesn't know if autosave failed.

**Improvement**: Show subtle error indicator in FormHeader.

```javascript
// Add to state
const [autoSaveError, setAutoSaveError] = useState(null);

// In handleAutoSaveDraft catch block
catch (err) {
  setAutoSaveError('Auto-save failed. Click to retry.');
  return false;
}

// In FormHeader.jsx
{autoSaveError && (
  <span className="text-red-600 cursor-pointer" onClick={handleRetryAutosave}>
    ⚠️ {autoSaveError}
  </span>
)}
```

---

### **3. Track Unsaved Changes for All Fields**

**Current**: Only tracks form data changes, not file uploads, category changes, etc.

**Improvement**: Create a unified change tracker.

```javascript
// Create a hook: useFormChangeTracker.js
export const useFormChangeTracker = (projectLoaded, setHasUnsavedChanges) => {
  const trackChange = useCallback(() => {
    if (projectLoaded) {
      setHasUnsavedChanges(true);
    }
  }, [projectLoaded, setHasUnsavedChanges]);

  return { trackChange };
};

// Use in all handlers
const { trackChange } = useFormChangeTracker(projectLoaded, setHasUnsavedChanges);

const updateLink = (index, value) => {
  setLinks(prev => prev.map((l, i) => (i === index ? value : l)));
  trackChange(); // ← Add this
};
```

---

### **4. Save File Uploads to Storage (Not Just URLs)**

**Current**: Autosave only saves file URLs if they're already strings. New file uploads (File objects) are not saved.

**Improvement**: Upload files to storage during autosave.

```javascript
// In draftManagement.js - handleAutoSaveDraft
// Before saving draft, upload new files
if (logoFile && logoFile instanceof File) {
  const logoPath = `${user.id}/${draftId || 'temp'}-logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
  const { data: logoData, error: logoErr } = await supabase.storage
    .from('startup-media')
    .upload(logoPath, logoFile);
  
  if (!logoErr) {
    const { data: logoUrlData } = supabase.storage
      .from('startup-media')
      .getPublicUrl(logoPath);
    draftData.logo_url = logoUrlData.publicUrl;
  }
}
// Repeat for thumbnailFile and coverFiles
```

---

### **5. Conflict Detection for Multiple Tabs**

**Current**: If user opens same draft in multiple tabs, changes can conflict.

**Improvement**: Add optimistic locking with version numbers.

```javascript
// Add version field to projects table
// In draftManagement.js
const draftData = {
  // ... existing fields ...
  version: (existingDraft?.version || 0) + 1, // Increment version
};

// On update, check version
const { data: currentDraft } = await supabase
  .from('projects')
  .select('version')
  .eq('id', draftId)
  .single();

if (currentDraft?.version !== expectedVersion) {
  // Conflict detected - show merge dialog
  setSnackbar({
    open: true,
    message: 'Draft was modified in another tab. Please refresh.',
    severity: 'warning'
  });
  return false;
}
```

---

### **6. Offline Queue Support**

**Current**: Autosave fails if user is offline.

**Improvement**: Queue saves when offline, sync when online.

```javascript
// Create: utils/offlineQueue.js
export const queueAutosave = (draftData) => {
  const queue = JSON.parse(localStorage.getItem('autosave_queue') || '[]');
  queue.push({ ...draftData, timestamp: Date.now() });
  localStorage.setItem('autosave_queue', JSON.stringify(queue));
};

export const processOfflineQueue = async (supabase, user) => {
  if (!navigator.onLine) return;
  
  const queue = JSON.parse(localStorage.getItem('autosave_queue') || '[]');
  for (const item of queue) {
    try {
      await handleAutoSaveDraft({ ...item, supabase, user });
      queue.shift(); // Remove successful item
    } catch (err) {
      break; // Stop on first error
    }
  }
  localStorage.setItem('autosave_queue', JSON.stringify(queue));
};

// In Register.jsx
useEffect(() => {
  const handleOnline = () => processOfflineQueue(supabase, user);
  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, []);
```

---

### **7. Draft Cleanup (Auto-delete Old Drafts)**

**Current**: Drafts accumulate indefinitely.

**Improvement**: Auto-delete drafts older than 30 days.

```javascript
// Create: utils/draftCleanup.js
export const cleanupOldDrafts = async (supabase, userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'draft')
    .lt('updated_at', thirtyDaysAgo.toISOString());
  
  if (!error) {
    console.log('Cleaned up old drafts');
  }
};

// Call on user login or periodically
```

---

### **8. Optimistic Updates**

**Current**: UI waits for server response before showing "saved" state.

**Improvement**: Show "saved" immediately, rollback on error.

```javascript
// In handleAutoSaveDraft
setIsAutoSaving(true);
setHasUnsavedChanges(false); // Optimistic update
setLastSavedAt(new Date());

try {
  // ... save to database ...
  // If successful, keep optimistic state
} catch (err) {
  // Rollback on error
  setHasUnsavedChanges(true);
  setLastSavedAt(null);
  throw err;
}
```

---

### **9. Batch Multiple Changes**

**Current**: Each field change triggers a separate autosave check.

**Improvement**: Batch rapid changes into single save.

```javascript
// In Register.jsx autosave useEffect
const BATCH_DELAY = 2000; // Wait 2s for more changes

autoSaveTimerRef.current = setTimeout(async () => {
  // Check if more changes happened during delay
  const currentTrigger = formTrigger;
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (currentTrigger === formTrigger) {
    // No new changes, safe to save
    await handleAutoSaveDraft({ ... });
  }
}, BATCH_DELAY);
```

---

### **10. Visual Feedback Improvements**

**Current**: Basic spinner and "Saved X ago" message.

**Improvement**: More detailed status indicators.

```javascript
// In FormHeader.jsx
{isAutoSaving ? (
  <span className="text-blue-600">
    <Spinner /> Saving changes...
  </span>
) : lastSavedAt ? (
  <span className="text-green-600">
    <CheckCircle /> Saved {formatTimeAgo(lastSavedAt)}
    {hasUnsavedChanges && <span className="text-orange-500 ml-2">• Unsaved changes</span>}
  </span>
) : hasUnsavedChanges ? (
  <span className="text-orange-500">
    <Clock /> Changes pending...
  </span>
) : null}
```

---

### **11. Save on Blur (Immediate Save)**

**Current**: Only saves after 1.5s delay.

**Improvement**: Also save immediately when user leaves a field.

```javascript
// In BasicInfoStep.jsx
<input
  onBlur={() => {
    // Trigger immediate autosave for this field
    if (hasUnsavedChanges && formData.name) {
      handleAutoSaveDraft({ ... });
    }
  }}
/>
```

---

### **12. Draft Version History**

**Current**: No history of changes.

**Improvement**: Store draft snapshots.

```javascript
// Create: utils/draftHistory.js
export const saveDraftSnapshot = async (supabase, draftId, draftData) => {
  await supabase.from('draft_history').insert({
    draft_id: draftId,
    snapshot: draftData,
    created_at: new Date().toISOString()
  });
  
  // Keep only last 10 snapshots
  await supabase
    .from('draft_history')
    .delete()
    .eq('draft_id', draftId)
    .order('created_at', { ascending: false })
    .limit(10, { foreignTable: 'draft_history' });
};
```

---

## Priority Ranking

1. **CRITICAL**: Fix `hasUnsavedChanges` bug ✅ (DONE)
2. **HIGH**: Retry mechanism (#1)
3. **HIGH**: Error notifications (#2)
4. **MEDIUM**: File upload saving (#4)
5. **MEDIUM**: Track all field changes (#3)
6. **LOW**: Conflict detection (#5)
7. **LOW**: Offline queue (#6)
8. **LOW**: Draft cleanup (#7)

---

## Implementation Notes

- Start with critical bug fix (already done)
- Add retry mechanism next (most impactful)
- Test thoroughly before adding complex features
- Consider user experience - don't over-engineer
- Monitor autosave success rate in production

