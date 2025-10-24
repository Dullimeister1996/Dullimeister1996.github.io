import {useTheme} from '../context/ThemeContext';
import {themeColors} from '../utils/themeConfig';
import {CartesianGrid, Legend, Line, LineChart, XAxis, YAxis} from "recharts";


const data = [{name: 'Page A', uv: 400, pv: 2400, amt: 2400}];

export function Beer() {
    const {theme} = useTheme();
    const colors = themeColors[theme];

    return (
        <main className={`${colors.bg} ${colors.text} flex items-center justify-center min-h-screen transition-colors duration-300 p-8`}>
            <div className={`flex items-center justify-center ${colors.cardBg} rounded-xl p-8 md:p-12 shadow-xl border ${colors.border} max-w-4xl w-full`}>
                <LineChart style={{ width: '100%', aspectRatio: 1.618, maxWidth: 600 }} responsive data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#aaa" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="uv" stroke="purple" strokeWidth={2} name="My data series name" />
                    <XAxis dataKey="name" />
                    <YAxis width="auto" label={{ value: 'UV', position: 'insideLeft', angle: -90 }} />
                    <Legend align="right" />
                </LineChart>
            </div>
        </main>
    );
}