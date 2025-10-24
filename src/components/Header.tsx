import {Menu, X, Palette} from 'lucide-react';
import {useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {useTheme} from '../context/ThemeContext';
import {themeColors} from '../utils/themeConfig';
import type {Theme} from '../types/theme';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const {theme, setTheme} = useTheme();
    const colors = themeColors[theme];
    const location = useLocation();

    const themes: { value: Theme; label: string }[] = [
        {value: 'light', label: 'Light'},
        {value: 'dark', label: 'Dark'},
        {value: 'ocean', label: 'Ocean'},
        {value: 'sunset', label: 'Sunset'},
        {value: 'beer', label: 'Beer'},
    ];

    const navItems = [
        {name: 'Home', path: '/'},
        {name: 'Bier', path: '/beer'},
        {name: 'Über uns', path: '/about-us'},
        {name: 'Kontakt', path: '/contact'},
    ];

    return (
        <header
            className={`${colors.headerBg} ${colors.headerText} shadow-lg sticky top-0 z-50 transition-colors duration-300`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${colors.accent} rounded-lg flex items-center justify-center`}>
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <span className="font-bold text-xl md:text-2xl">Schönsaufen</span>
                    </Link>

                    <nav className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`hover:opacity-80 transition-opacity font-medium ${
                                    location.pathname === item.path ? 'opacity-100 font-bold' : 'opacity-80'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                                className={`p-2 rounded-lg ${colors.cardBg} ${colors.text} hover:opacity-80 transition-all`}
                                aria-label="Change theme"
                            >
                                <Palette className="w-5 h-5"/>
                            </button>

                            {isThemeMenuOpen && (
                                <div
                                    className={`absolute right-0 mt-2 w-48 ${colors.cardBg} ${colors.text} rounded-lg shadow-xl border ${colors.border} overflow-hidden`}>
                                    {themes.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => {
                                                setTheme(t.value);
                                                setIsThemeMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 hover:bg-opacity-10 hover:bg-gray-500 transition-colors ${
                                                theme === t.value ? 'font-bold' : ''
                                            }`}
                                        >
                                            {t.label}
                                            {theme === t.value && <span className="ml-2">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <nav className="md:hidden py-4 space-y-2 border-t border-opacity-20 border-white">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`block py-2 hover:opacity-80 transition-opacity font-medium ${
                                    location.pathname === item.path ? 'opacity-100 font-bold' : 'opacity-80'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                )}
            </div>
        </header>
    );
}
