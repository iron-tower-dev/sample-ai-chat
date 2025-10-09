# Theming System

This project uses Angular Material's theming system with custom color palettes and CSS custom properties.

## File Structure

```
src/styles/
├── themes.scss                 # Main theme imports
├── themes/
│   ├── _base-theme.scss       # Base theme mixins
│   ├── blue-purple-theme.scss # Blue-purple theme definitions
│   ├── blue-theme.scss        # Blue theme definitions
│   ├── green-theme.scss       # Green theme definitions
│   ├── purple-theme.scss      # Purple theme definitions
│   └── *-theme-colors.scss    # Generated color palettes
└── README.md                  # This file
```

## How It Works

### 1. Color Palettes
- **Generated files** (`*-theme-colors.scss`) contain Material Design color palettes
- Generated using: `ng generate @angular/material:theme-color`
- Each palette includes: primary, secondary, tertiary, neutral, neutral-variant, and error colors

### 2. Theme Definitions
- **Theme files** (`*-theme.scss`) define light and dark variants
- Use base mixins to create consistent themes
- Apply to body classes (e.g., `.blue-purple-light-theme`)

### 3. Base Theme Mixins
- **`create-light-theme()`** - Creates Angular Material light theme
- **`create-dark-theme()`** - Creates Angular Material dark theme
- **`add-light-theme-variables()`** - Adds CSS custom properties for light theme
- **`add-dark-theme-variables()`** - Adds CSS custom properties for dark theme

### 4. CSS Custom Properties
All themes provide these variables:
- `--mat-primary`, `--mat-on-primary`
- `--mat-secondary`, `--mat-on-secondary`
- `--mat-tertiary`, `--mat-on-tertiary`
- `--mat-surface`, `--mat-on-surface`
- `--mat-background`, `--mat-on-background`
- `--mat-error`, `--mat-on-error`
- `--mat-outline`, `--mat-outline-variant`
- `--mat-scrim`, `--mat-shadow`
- `--mat-state-hover`, `--mat-state-focus`, etc.

## Usage

### In Components
```css
.my-component {
  background-color: var(--mat-surface);
  color: var(--mat-on-surface);
  border: 1px solid var(--mat-outline);
}
```

### Theme Switching
Themes are applied via body classes:
- `blue-purple-light-theme`
- `blue-purple-dark-theme`
- `blue-light-theme`
- `blue-dark-theme`
- `green-light-theme`
- `green-dark-theme`
- `purple-light-theme`
- `purple-dark-theme`

## Adding New Themes

1. Generate color palette:
   ```bash
   ng generate @angular/material:theme-color --name=my-theme --primary=#color --secondary=#color
   ```

2. Create theme file:
   ```scss
   @use 'base-theme' as base;
   @use 'my-theme-colors' as colors;
   
   .my-theme-light {
     @include base.create-light-theme(colors.$primary-palette, colors.$tertiary-palette);
     @include base.add-light-theme-variables(colors.$primary-palette, colors.$tertiary-palette);
   }
   
   .my-theme-dark {
     @include base.create-dark-theme(colors.$primary-palette, colors.$tertiary-palette);
     @include base.add-dark-theme-variables(colors.$primary-palette, colors.$tertiary-palette);
   }
   ```

3. Import in `themes.scss`:
   ```scss
   @use 'themes/my-theme';
   ```

## Key Features

- **Automatic error colors** - Error palette is automatically included in all themes
- **Consistent variables** - All themes use the same CSS custom property names
- **Material Design compliance** - Follows Material Design 3 color system
- **Dark mode support** - Each theme includes both light and dark variants
