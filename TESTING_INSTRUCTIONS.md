# Testing Instructions for Citation and Tooling Fixes

## Changes Made

### 1. Tool Events Now Send Chunk Updates
**File**: `src/app/services/llm-api.service.ts` (lines 322-343)

**Problem**: Tool events (e.g., `tool: {"action": "searching for documents..."}`) were being parsed correctly but no chunk update was sent to the UI, so the tooling text never appeared.

**Fix**: Added code to send a chunk update immediately after parsing a tool event, similar to how data chunks are sent.

**Expected Result**: When the API sends tool events during streaming, the tooling indicator should now appear to users with text like "searching for unescorted access procedures" with a spinner.

---

### 2. Enhanced UUID Lookup Debugging
**File**: `src/app/services/source-citation.service.ts` (lines 195-213)

**Problem**: Citation UUIDs in the response text weren't matching the metadata keys, causing lookups to fail. The logging was insufficient to diagnose the exact mismatch.

**Fix**: Added comprehensive logging to show:
- All available keys in citationMetadata
- The full metadata object structure
- Actual values returned from lookups (not just "FOUND"/"NOT FOUND")

**Expected Result**: Console logs will now show exactly what's in the metadata object and what values are returned when looking up UUIDs, making it clear if there's a key mismatch or object structure issue.

---

## What to Test

### Test 1: Tooling Display During Streaming
1. Open the app in your browser
2. Open browser DevTools console (F12)
3. Ask a question that triggers document search (e.g., "what are the procedures for unescorted access?")
4. **Watch for**: A tooling indicator with spinner and text should appear **BEFORE** the response content appears
5. **Expected behavior**: Similar to ChatGPT - shows "searching for documents..." or similar while working
6. After response completes, tooling text should appear in collapsed thinking section

### Test 2: Inline Citation Links
1. After receiving a response with citations like `[Source: {UUID}]`
2. **Check console logs** - look for:
   - `[SourceCitationService] Full metadata object:` - shows the complete metadata structure
   - `[SourceCitationService] Direct lookup citationMetadata["..."] =` - shows actual value returned
   - `[SourceCitationService] All available keys:` - shows all UUIDs in metadata
3. **Expected result**: 
   - Console shows the actual metadata values being looked up
   - If UUIDs match, citations should render as clickable links with document titles
   - If UUIDs don't match, logs will clearly show the key mismatch

### Test 3: Combined Test
1. Clear browser console
2. Ask: "what are the procedures for unescorted access?"
3. Capture **complete console log** from start to finish
4. Check rendered response HTML for citation links

---

## What to Capture If Issues Persist

If citations still don't work or tooling doesn't display, please capture:

1. **Full console log** from the query start to response completion
2. **The rendered HTML** - right-click the response text, Inspect Element, and copy the HTML
3. **Network tab** - the raw API response from the SSE stream

Save these to files like:
```bash
# Save from browser console (right-click > Save as...)
console-log-$(date +%s).log

# Or manually copy and save
```

---

## Key Console Log Lines to Look For

### For Tooling:
```
[LLM API] FOUND TOOL EVENT, line: tool: {"action": "..."}
[LLM API] Sending chunk after tool event: {thinkingLength: ..., toolingLength: ..., responseLength: ...}
[ChatService] Processing chunk: {thinkingLength: ..., toolingLength: X, responseLength: ...}
```
- `toolingLength` should be > 0 after tool event is found

### For Citations:
```
[SourceCitationService] Looking up UUID: {FA205FD1-7739-C377-84CE-7B63C3A00000}
[SourceCitationService] All available keys: ['{C387180F-...', '{FA205FD1-...', ...]
[SourceCitationService] Full metadata object: {...}
[SourceCitationService] Direct lookup citationMetadata["{FA205FD1-...}"] = {DocumentTitle: "...", ...}
```
- Should show actual object values, not just "FOUND"/"NOT FOUND"

---

## Next Steps After Testing

Based on the console logs:

### If tooling still doesn't display:
- Check if `[ChatService] Processing chunk` shows `toolingLength > 0`
- Check if `message().toolingText` is populated in the component

### If citations still don't work:
- Compare the UUID in `[Source: {UUID}]` with `All available keys:` in the logs
- Check if there's a case difference, extra spaces, or formatting mismatch
- Look at the actual value returned from the lookup to see if metadata structure is wrong
