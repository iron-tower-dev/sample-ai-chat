export interface ThemeColors {
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondary: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiary: string;
    onTertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    error: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;
    shadow: string;
    scrim: string;
    inverseSurface: string;
    inverseOnSurface: string;
    inversePrimary: string;
}

export interface Theme {
    id: string;
    name: string;
    baseName: string; // e.g., 'blue-purple', 'green', 'blue', 'purple'
    mode: 'light' | 'dark';
    cssClass: string; // CSS class name for the theme
    preview: {
        primary: string;
        secondary: string;
        tertiary: string;
        background: string;
        surface: string;
    };
}

export const THEMES: Theme[] = [
    // Blue & Purple Themes
    {
        id: 'blue-purple-light',
        name: 'Blue & Purple Light',
        baseName: 'blue-purple',
        mode: 'light',
        cssClass: 'blue-purple-light-theme',
        preview: {
            primary: '#1976D2',
            secondary: '#1565C0',
            tertiary: '#7B1FA2',
            background: '#FAFAFA',
            surface: '#FFFFFF'
        }
    },
    {
        id: 'blue-purple-dark',
        name: 'Blue & Purple Dark',
        baseName: 'blue-purple',
        mode: 'dark',
        cssClass: 'blue-purple-dark-theme',
        preview: {
            primary: '#90CAF9',
            secondary: '#64B5F6',
            tertiary: '#CE93D8',
            background: '#1A1D23',
            surface: '#242831'
        }
    },
    // Green Themes
    {
        id: 'green-light',
        name: 'Green Light',
        baseName: 'green',
        mode: 'light',
        cssClass: 'green-light-theme',
        preview: {
            primary: '#2E7D32',
            secondary: '#388E3C',
            tertiary: '#1976D2',
            background: '#F8F9FA',
            surface: '#FFFFFF'
        }
    },
    {
        id: 'green-dark',
        name: 'Green Dark',
        baseName: 'green',
        mode: 'dark',
        cssClass: 'green-dark-theme',
        preview: {
            primary: '#81C784',
            secondary: '#A5D6A7',
            tertiary: '#90CAF9',
            background: '#1A1F1C',
            surface: '#242A21'
        }
    },
    // Blue Themes
    {
        id: 'blue-light',
        name: 'Blue Light',
        baseName: 'blue',
        mode: 'light',
        cssClass: 'blue-light-theme',
        preview: {
            primary: '#1976D2',
            secondary: '#1565C0',
            tertiary: '#7B1FA2',
            background: '#F3F7FF',
            surface: '#FFFFFF'
        }
    },
    {
        id: 'blue-dark',
        name: 'Blue Dark',
        baseName: 'blue',
        mode: 'dark',
        cssClass: 'blue-dark-theme',
        preview: {
            primary: '#90CAF9',
            secondary: '#64B5F6',
            tertiary: '#CE93D8',
            background: '#1A1D26',
            surface: '#242732'
        }
    },
    // Purple Themes
    {
        id: 'purple-light',
        name: 'Purple Light',
        baseName: 'purple',
        mode: 'light',
        cssClass: 'purple-light-theme',
        preview: {
            primary: '#7B1FA2',
            secondary: '#9C27B0',
            tertiary: '#1976D2',
            background: '#FDF7FF',
            surface: '#FFFFFF'
        }
    },
    {
        id: 'purple-dark',
        name: 'Purple Dark',
        baseName: 'purple',
        mode: 'dark',
        cssClass: 'purple-dark-theme',
        preview: {
            primary: '#CE93D8',
            secondary: '#BA68C8',
            tertiary: '#90CAF9',
            background: '#1F1A23',
            surface: '#292431'
        }
    }
];
