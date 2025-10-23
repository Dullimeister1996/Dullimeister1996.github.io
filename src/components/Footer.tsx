import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { themeColors } from '../utils/themeConfig';

export function Footer() {
    const { theme } = useTheme();
    const colors = themeColors[theme];

    const footerLinks = [
        { title: 'Product', links: ['Features', 'Pricing', 'Security', 'Roadmap'] },
        { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
        { title: 'Resources', links: ['Documentation', 'Help Center', 'Community', 'Contact'] },
        { title: 'Legal', links: ['Privacy', 'Terms', 'Cookie Policy', 'Licenses'] },
    ];

    const socialLinks = [
        { icon: Github, label: 'GitHub', href: '#' },
        { icon: Twitter, label: 'Twitter', href: '#' },
        { icon: Linkedin, label: 'LinkedIn', href: '#' },
        { icon: Mail, label: 'Email', href: '#' },
    ];

    return (
        <footer className={`${colors.footerBg} ${colors.footerText} transition-colors duration-300`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-10 h-10 ${colors.accent} rounded-lg flex items-center justify-center`}>
                                <span className="text-white font-bold text-xl">M</span>
                            </div>
                            <span className="font-bold text-xl text-white">ModernSite</span>
                        </div>
                        <p className="text-sm mb-4">
                            Building modern web experiences with cutting-edge technology and beautiful design.
                        </p>
                        <div className="flex space-x-4">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        className="hover:opacity-80 transition-opacity"
                                        aria-label={social.label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {footerLinks.map((section) => (
                        <div key={section.title}>
                            <h3 className="font-semibold text-white mb-4">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-sm hover:opacity-80 transition-opacity">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-t border-opacity-20 border-gray-500 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-sm">
                            © {new Date().getFullYear()} ModernSite. All rights reserved.
                        </p>
                        <div className="flex space-x-6 text-sm">
                            <a href="#" className="hover:opacity-80 transition-opacity">
                                Privacy Policy
                            </a>
                            <a href="#" className="hover:opacity-80 transition-opacity">
                                Terms of Service
                            </a>
                            <a href="#" className="hover:opacity-80 transition-opacity">
                                Cookie Settings
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
