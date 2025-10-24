import { ReactNode } from "react";
import { useTheme } from "./ThemeContext.tsx";
import {themeColors} from '../utils/themeConfig';

export function ThemedBackground({ children }: { children: ReactNode }) {
    const { theme } = useTheme();

    return (
        <div
            className={`relative min-h-screen overflow-hidden ${themeColors[theme].bg} ${themeColors[theme].text}`}
        >
            {/* Wenn beer-Theme aktiv, zeige Video */}
            {theme === "beer" && (
                <video
                    className="fixed top-0 left-0 w-full h-full object-cover -z-10"
                    src="/beer.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            )}

            {/* Hauptinhalt */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
