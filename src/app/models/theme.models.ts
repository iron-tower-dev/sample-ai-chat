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
    mode: 'light' | 'dark';
    colors: ThemeColors;
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
        mode: 'light',
        colors: {
            primary: '#1976D2',
            onPrimary: '#FFFFFF',
            primaryContainer: '#BBDEFB',
            onPrimaryContainer: '#0D47A1',
            secondary: '#1565C0',
            onSecondary: '#FFFFFF',
            secondaryContainer: '#90CAF9',
            onSecondaryContainer: '#0D47A1',
            tertiary: '#7B1FA2',
            onTertiary: '#FFFFFF',
            tertiaryContainer: '#E1BEE7',
            onTertiaryContainer: '#4A148C',
            error: '#D32F2F',
            onError: '#FFFFFF',
            errorContainer: '#FFCDD2',
            onErrorContainer: '#B71C1C',
            background: '#FAFAFA',
            onBackground: '#212121',
            surface: '#FFFFFF',
            onSurface: '#212121',
            surfaceVariant: '#F5F5F5',
            onSurfaceVariant: '#424242',
            outline: '#BDBDBD',
            outlineVariant: '#E0E0E0',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#2F2F2F',
            inverseOnSurface: '#FFFFFF',
            inversePrimary: '#90CAF9'
        },
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
        mode: 'dark',
        colors: {
            primary: '#90CAF9',
            onPrimary: '#0D47A1',
            primaryContainer: '#1565C0',
            onPrimaryContainer: '#BBDEFB',
            secondary: '#64B5F6',
            onSecondary: '#0D47A1',
            secondaryContainer: '#1976D2',
            onSecondaryContainer: '#90CAF9',
            tertiary: '#CE93D8',
            onTertiary: '#4A148C',
            tertiaryContainer: '#6A1B9A',
            onTertiaryContainer: '#E1BEE7',
            error: '#EF5350',
            onError: '#B71C1C',
            errorContainer: '#C62828',
            onErrorContainer: '#FFCDD2',
            background: '#1A1D23',
            onBackground: '#FFFFFF',
            surface: '#242831',
            onSurface: '#FFFFFF',
            surfaceVariant: '#2E3138',
            onSurfaceVariant: '#E0E0E0',
            outline: '#616161',
            outlineVariant: '#424242',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#E0E0E0',
            inverseOnSurface: '#2F2F2F',
            inversePrimary: '#1976D2'
        },
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
        mode: 'light',
        colors: {
            primary: '#2E7D32',
            onPrimary: '#FFFFFF',
            primaryContainer: '#C8E6C9',
            onPrimaryContainer: '#1B5E20',
            secondary: '#388E3C',
            onSecondary: '#FFFFFF',
            secondaryContainer: '#A5D6A7',
            onSecondaryContainer: '#2E7D32',
            tertiary: '#1976D2',
            onTertiary: '#FFFFFF',
            tertiaryContainer: '#BBDEFB',
            onTertiaryContainer: '#0D47A1',
            error: '#D32F2F',
            onError: '#FFFFFF',
            errorContainer: '#FFCDD2',
            onErrorContainer: '#B71C1C',
            background: '#F8F9FA',
            onBackground: '#212121',
            surface: '#FFFFFF',
            onSurface: '#212121',
            surfaceVariant: '#F1F8E9',
            onSurfaceVariant: '#424242',
            outline: '#BDBDBD',
            outlineVariant: '#E0E0E0',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#2F2F2F',
            inverseOnSurface: '#FFFFFF',
            inversePrimary: '#81C784'
        },
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
        mode: 'dark',
        colors: {
            primary: '#81C784',
            onPrimary: '#1B5E20',
            primaryContainer: '#2E7D32',
            onPrimaryContainer: '#C8E6C9',
            secondary: '#A5D6A7',
            onSecondary: '#2E7D32',
            secondaryContainer: '#388E3C',
            onSecondaryContainer: '#A5D6A7',
            tertiary: '#90CAF9',
            onTertiary: '#0D47A1',
            tertiaryContainer: '#1565C0',
            onTertiaryContainer: '#BBDEFB',
            error: '#EF5350',
            onError: '#B71C1C',
            errorContainer: '#C62828',
            onErrorContainer: '#FFCDD2',
            background: '#1A1F1C',
            onBackground: '#FFFFFF',
            surface: '#242A21',
            onSurface: '#FFFFFF',
            surfaceVariant: '#2E342B',
            onSurfaceVariant: '#E0E0E0',
            outline: '#616161',
            outlineVariant: '#424242',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#E0E0E0',
            inverseOnSurface: '#2F2F2F',
            inversePrimary: '#2E7D32'
        },
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
        mode: 'light',
        colors: {
            primary: '#1976D2',
            onPrimary: '#FFFFFF',
            primaryContainer: '#BBDEFB',
            onPrimaryContainer: '#0D47A1',
            secondary: '#1565C0',
            onSecondary: '#FFFFFF',
            secondaryContainer: '#90CAF9',
            onSecondaryContainer: '#0D47A1',
            tertiary: '#7B1FA2',
            onTertiary: '#FFFFFF',
            tertiaryContainer: '#E1BEE7',
            onTertiaryContainer: '#4A148C',
            error: '#D32F2F',
            onError: '#FFFFFF',
            errorContainer: '#FFCDD2',
            onErrorContainer: '#B71C1C',
            background: '#F3F7FF',
            onBackground: '#212121',
            surface: '#FFFFFF',
            onSurface: '#212121',
            surfaceVariant: '#E3F2FD',
            onSurfaceVariant: '#424242',
            outline: '#BDBDBD',
            outlineVariant: '#E0E0E0',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#2F2F2F',
            inverseOnSurface: '#FFFFFF',
            inversePrimary: '#90CAF9'
        },
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
        mode: 'dark',
        colors: {
            primary: '#90CAF9',
            onPrimary: '#0D47A1',
            primaryContainer: '#1565C0',
            onPrimaryContainer: '#BBDEFB',
            secondary: '#64B5F6',
            onSecondary: '#0D47A1',
            secondaryContainer: '#1976D2',
            onSecondaryContainer: '#90CAF9',
            tertiary: '#CE93D8',
            onTertiary: '#4A148C',
            tertiaryContainer: '#6A1B9A',
            onTertiaryContainer: '#E1BEE7',
            error: '#EF5350',
            onError: '#B71C1C',
            errorContainer: '#C62828',
            onErrorContainer: '#FFCDD2',
            background: '#1A1D26',
            onBackground: '#FFFFFF',
            surface: '#242732',
            onSurface: '#FFFFFF',
            surfaceVariant: '#2E313C',
            onSurfaceVariant: '#E0E0E0',
            outline: '#616161',
            outlineVariant: '#424242',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#E0E0E0',
            inverseOnSurface: '#2F2F2F',
            inversePrimary: '#1976D2'
        },
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
        mode: 'light',
        colors: {
            primary: '#7B1FA2',
            onPrimary: '#FFFFFF',
            primaryContainer: '#E1BEE7',
            onPrimaryContainer: '#4A148C',
            secondary: '#9C27B0',
            onSecondary: '#FFFFFF',
            secondaryContainer: '#F3E5F5',
            onSecondaryContainer: '#6A1B9A',
            tertiary: '#1976D2',
            onTertiary: '#FFFFFF',
            tertiaryContainer: '#BBDEFB',
            onTertiaryContainer: '#0D47A1',
            error: '#D32F2F',
            onError: '#FFFFFF',
            errorContainer: '#FFCDD2',
            onErrorContainer: '#B71C1C',
            background: '#FDF7FF',
            onBackground: '#212121',
            surface: '#FFFFFF',
            onSurface: '#212121',
            surfaceVariant: '#F3E5F5',
            onSurfaceVariant: '#424242',
            outline: '#BDBDBD',
            outlineVariant: '#E0E0E0',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#2F2F2F',
            inverseOnSurface: '#FFFFFF',
            inversePrimary: '#CE93D8'
        },
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
        mode: 'dark',
        colors: {
            primary: '#CE93D8',
            onPrimary: '#4A148C',
            primaryContainer: '#6A1B9A',
            onPrimaryContainer: '#E1BEE7',
            secondary: '#BA68C8',
            onSecondary: '#6A1B9A',
            secondaryContainer: '#7B1FA2',
            onSecondaryContainer: '#F3E5F5',
            tertiary: '#90CAF9',
            onTertiary: '#0D47A1',
            tertiaryContainer: '#1565C0',
            onTertiaryContainer: '#BBDEFB',
            error: '#EF5350',
            onError: '#B71C1C',
            errorContainer: '#C62828',
            onErrorContainer: '#FFCDD2',
            background: '#1F1A23',
            onBackground: '#FFFFFF',
            surface: '#292431',
            onSurface: '#FFFFFF',
            surfaceVariant: '#332E3B',
            onSurfaceVariant: '#E0E0E0',
            outline: '#616161',
            outlineVariant: '#424242',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#E0E0E0',
            inverseOnSurface: '#2F2F2F',
            inversePrimary: '#7B1FA2'
        },
        preview: {
            primary: '#CE93D8',
            secondary: '#BA68C8',
            tertiary: '#90CAF9',
            background: '#1F1A23',
            surface: '#292431'
        }
    }
];
