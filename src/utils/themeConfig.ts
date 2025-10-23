import type {Theme} from '../types/theme';

interface ThemeColors {
    bg: string;
    text: string;
    headerBg: string;
    headerText: string;
    footerBg: string;
    footerText: string;
    cardBg: string;
    accent: string;
    accentHover: string;
    border: string;
}

export const themeColors: Record<Theme, ThemeColors> = {
    light: {
        bg: 'bg-gray-50',
        text: 'text-gray-900',
        headerBg: 'bg-white',
        headerText: 'text-gray-900',
        footerBg: 'bg-gray-900',
        footerText: 'text-gray-100',
        cardBg: 'bg-white',
        accent: 'bg-blue-600',
        accentHover: 'hover:bg-blue-700',
        border: 'border-gray-200',
    },
    dark: {
        bg: 'bg-gray-950',
        text: 'text-gray-100',
        headerBg: 'bg-gray-900',
        headerText: 'text-gray-100',
        footerBg: 'bg-gray-900',
        footerText: 'text-gray-400',
        cardBg: 'bg-gray-800',
        accent: 'bg-blue-500',
        accentHover: 'hover:bg-blue-600',
        border: 'border-gray-700',
    },
    ocean: {
        bg: 'bg-cyan-50',
        text: 'text-slate-900',
        headerBg: 'bg-gradient-to-r from-teal-600 to-cyan-600',
        headerText: 'text-white',
        footerBg: 'bg-slate-800',
        footerText: 'text-cyan-100',
        cardBg: 'bg-white',
        accent: 'bg-teal-600',
        accentHover: 'hover:bg-teal-700',
        border: 'border-cyan-200',
    },
    sunset: {
        bg: 'bg-orange-50',
        text: 'text-gray-900',
        headerBg: 'bg-gradient-to-r from-orange-500 to-pink-500',
        headerText: 'text-white',
        footerBg: 'bg-gray-900',
        footerText: 'text-orange-100',
        cardBg: 'bg-white',
        accent: 'bg-orange-600',
        accentHover: 'hover:bg-orange-700',
        border: 'border-orange-200',
    },
};
