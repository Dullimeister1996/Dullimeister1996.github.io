import { Zap, Shield, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { themeColors } from '../utils/themeConfig';

export function Home() {
    const { theme } = useTheme();
    const colors = themeColors[theme];

    const features = [
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Optimized performance for the best user experience across all devices.',
        },
        {
            icon: Shield,
            title: 'Secure by Default',
            description: 'Enterprise-grade security with best practices built in from the ground up.',
        },
        {
            icon: Sparkles,
            title: 'Modern Design',
            description: 'Beautiful, intuitive interfaces that users love to interact with.',
        },
    ];

    const stats = [
        { value: '10k+', label: 'Active Users' },
        { value: '99.9%', label: 'Uptime' },
        { value: '50+', label: 'Countries' },
        { value: '24/7', label: 'Support' },
    ];

    return (
        <main className={`${colors.bg} ${colors.text} flex-1 transition-colors duration-300`}>
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                        Build Amazing Digital Experiences
                    </h1>
                    <p className="text-lg md:text-xl opacity-80 mb-8">
                        Transform your ideas into reality with our modern, scalable, and beautiful platform.
                        Start building today and see the difference.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className={`${colors.accent} ${colors.accentHover} text-white px-8 py-4 rounded-lg font-semibold transition-colors shadow-lg`}>
                            Get Started Free
                        </button>
                        <button className={`${colors.cardBg} ${colors.text} border ${colors.border} px-8 py-4 rounded-lg font-semibold hover:opacity-80 transition-all shadow-lg`}>
                            Watch Demo
                        </button>
                    </div>
                </div>

                <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 ${colors.cardBg} rounded-xl p-8 md:p-12 shadow-xl border ${colors.border}`}>
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                            <div className="opacity-70">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Why Choose ModernSite?
                    </h2>
                    <p className="text-lg opacity-80">
                        Powerful features designed to help you build, launch, and grow your projects with confidence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className={`${colors.cardBg} p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border ${colors.border} hover:scale-105`}
                            >
                                <div className={`${colors.accent} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="opacity-80">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className={`${colors.cardBg} border-y ${colors.border} transition-colors duration-300`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="text-lg opacity-80 mb-8">
                            Join thousands of satisfied users and start building something amazing today.
                        </p>
                        <button className={`${colors.accent} ${colors.accentHover} text-white px-10 py-5 rounded-lg font-semibold text-lg transition-colors shadow-lg`}>
                            Start Your Free Trial
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
