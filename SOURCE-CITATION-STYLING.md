# Inline Source Citation Styling Update

## Overview

Updated inline source citations with a modern, badge-style design that makes them highly visible and prepares them for future interactive features (click-to-open documents, hover previews).

## Visual Design

### Badge Appearance
- **Rounded corners** (6px border-radius) for modern look
- **Subtle background** with primary color tint (8% opacity in light mode, 12% in dark)
- **Light border** (20% opacity in light, 30% in dark) for definition
- **Document icon** (📄) prefix for immediate visual recognition
- **Medium font weight** (500) to stand out from body text
- **Compact size** (0.85em) to integrate naturally with text

### Color Scheme
- Uses Material Design primary color (`--mat-primary`)
- Adapts to theme with appropriate opacity levels
- Enhanced colors on hover for interactivity feedback

## Interactive States

### Default State
```css
background-color: rgba(99, 102, 241, 0.08);
border: 1px solid rgba(99, 102, 241, 0.2);
color: var(--mat-primary-600);
```
- Subtle but visible presence
- Icon at 70% opacity

### Hover State
```css
background-color: rgba(99, 102, 241, 0.15);
border-color: rgba(99, 102, 241, 0.4);
transform: translateY(-1px);
box-shadow: 0 2px 4px rgba(99, 102, 241, 0.15);
```
- **Elevation**: Lifts 1px upward
- **Enhanced colors**: Stronger background and border
- **Shadow**: Subtle depth effect
- **Icon**: Full opacity (100%)

### Active State (Pressed)
```css
transform: translateY(0);
box-shadow: 0 1px 2px rgba(99, 102, 241, 0.1);
```
- Returns to baseline position
- Reduced shadow for pressed effect
- Provides tactile feedback

### Focus State (Keyboard Navigation)
```css
outline: 2px solid var(--mat-primary-500);
outline-offset: 2px;
background-color: rgba(99, 102, 241, 0.15);
```
- Clear 2px outline for accessibility
- Enhanced background
- 2px offset for visual clarity

## Dark Theme Adaptations

```css
.dark-theme .inline-source-citation {
  color: var(--mat-primary-400);
  background-color: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.3);
}

.dark-theme .inline-source-citation:hover {
  background-color: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.5);
  color: var(--mat-primary-300);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}
```

- Higher base opacity (12% vs 8%) for visibility on dark backgrounds
- Lighter primary color shades for better contrast
- Adjusted shadow opacity

## Prepared Features

### 1. Hover Preview Tooltip

Pre-styled tooltip container ready for document previews:

```css
.inline-source-citation-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  max-width: 400px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
```

**Features:**
- Positioned above citation with 8px gap
- Centered horizontally
- Max width 400px for readability
- Smooth fade-in/out transition
- High z-index for proper layering
- Hidden by default, shown on hover

### 2. Click Navigation

**Ready for implementation:**
- Cursor indicates clickability
- Active state provides pressed feedback
- Focus state enables keyboard navigation
- `data-doc` attribute stores encoded document JSON

### 3. Data Attributes

**Supported attributes:**
- `data-preview`: Marks citations that support hover preview
- `data-doc`: Contains encoded document metadata for click handlers

```html
<span class="inline-source-citation" 
      data-doc="{&quot;id&quot;:&quot;ML21049A274&quot;,&quot;title&quot;:&quot;TICAP Document&quot;}">
  [ML21049A274]
</span>
```

## Technical Implementation

### CSS Location
`src/app/components/markdown-content/markdown-content.component.css`

### Key Properties
- `display: inline-flex` - Flexbox for icon/text alignment
- `align-items: center` - Vertical centering
- `gap: 0.25rem` - Space between icon and text
- `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` - Smooth Material Design easing
- `white-space: nowrap` - Prevent citation text wrapping
- `vertical-align: baseline` - Align with surrounding text

### Icon Implementation
```css
.inline-source-citation::before {
  content: '📄';
  font-size: 0.875em;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}
```

## Accessibility

### Current Features
- **Keyboard navigation**: Full focus state with visible outline
- **Cursor indication**: Pointer cursor signals interactivity
- **Color contrast**: Meets WCAG guidelines for both themes
- **Tactile feedback**: Active state provides pressed effect

### Future Enhancements
- ARIA labels for screen readers
- Keyboard shortcuts for document preview
- Screen reader announcements for citation context
- High contrast mode support

## Examples

### Light Theme - Default State
```
The TICAP project [📄 ML21049A274] provides guidance...
```
- Subtle indigo tint background
- Light border
- Semi-transparent icon

### Light Theme - Hover State
```
The TICAP project [📄 ML21049A274] provides guidance...
                   ↑ elevated, brighter, shadow
```
- Lifted appearance
- Stronger colors
- Full opacity icon

### Dark Theme - Default State
```
The TICAP project [📄 ML21049A274] provides guidance...
```
- Higher opacity background for visibility
- Lighter primary color
- Adjusted contrast

## Comparison with Previous Design

### Before (Simple Link Style)
- Plain text with underline on hover
- Smaller font size (0.9em)
- Minimal visual presence
- Border-bottom transition only

### After (Badge Style)
- Prominent badge appearance
- Icon prefix for recognition
- Multiple visual feedback states
- Elevation and shadow effects
- Better prepared for interaction

## Browser Support

All modern browsers support:
- CSS custom properties (variables)
- Flexbox
- Transform and transitions
- Pseudo-elements (::before)
- RGBA colors with opacity

Tested on:
- Chrome/Edge (Chromium)
- Firefox
- Safari

## Performance

- **Efficient animations**: Only transforms and opacity (GPU-accelerated)
- **No layout shifts**: Transform doesn't trigger reflow
- **Minimal repaints**: Contained to citation elements only
- **Cubic-bezier easing**: Material Design standard timing function

## Future Roadmap

1. **Document preview on hover** - Show excerpt, metadata, and snippet
2. **Click to open full document** - Navigate to document viewer
3. **Different icon types** - PDF, Word, Excel icons based on document type
4. **Citation numbering** - Optional superscript numbers like [1], [2]
5. **Smart grouping** - Combine multiple citations to same source
6. **User preferences** - Customize citation appearance (icon, size, style)

## Files Modified

1. `src/app/components/markdown-content/markdown-content.component.css`
   - Replaced simple link styling with badge design
   - Added hover, active, and focus states
   - Added dark theme support
   - Included tooltip container styles for future use

2. `INLINE-SOURCE-CITATIONS.md`
   - Updated CSS documentation
   - Added visual design details
   - Documented prepared features

## Testing

### Visual Testing
1. Send query that returns sources with citations
2. Verify badge appearance with icon and background
3. Test hover effect (elevation, color change)
4. Test click/active state (pressed effect)
5. Test keyboard focus (outline visible)
6. Switch to dark theme and verify appearance

### Responsive Testing
- Citations should wrap with text naturally
- `white-space: nowrap` keeps citation text together
- Icon and text alignment maintained at all sizes

### Accessibility Testing
- Tab through citations with keyboard
- Verify focus outline visibility
- Check color contrast ratios
- Test with screen reader (future enhancement)

## Fixes Applied

### Issue 1: Inline Citations Not Showing Styles
**Problem**: Inline citation HTML was being generated but styles weren't applied.

**Root Cause**: DOMPurify sanitization was stripping the `data-doc` and `data-preview` attributes needed for the citation spans.

**Solution**: Updated `markdown-renderer.service.ts` to allow citation-specific attributes:
```typescript
ADD_ATTR: ['style', 'xmlns', 'aria-hidden', 'title', 'data-doc', 'data-preview']
```

### Issue 2: Separate Loading Indicator
**Problem**: "Generating response..." with loading circle appeared below the assistant message, separate from the "Thinking..." text inside the message.

**Solution**: 
1. Changed "*Thinking...*" (italic) to "Thinking" in `chat.service.ts`
2. Added conditional rendering in `message.component.ts` to show spinner + "Thinking" text together
3. Removed separate loading message from `chat-interface.component.ts`
4. Passed `isLoading` input to MessageComponent to conditionally show thinking indicator

**Result**: Clean, unified loading experience with spinner and text inside the message bubble.

## Related Documentation

- `INLINE-SOURCE-CITATIONS.md` - Complete inline citation system
- `LLM-API-INTEGRATION.md` - Streaming NDJSON API integration
- `WARP.md` - Project development guidelines
