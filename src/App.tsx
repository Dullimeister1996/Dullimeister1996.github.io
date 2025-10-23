import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';
import { Home } from './pages/Home';
// import { About } from './pages/About';
// import { Services } from './pages/Services';
// import { Contact } from './pages/Contact';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <div className="min-h-screen flex flex-col">
                    <Header />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        {/*<Route path="/about" element={<About />} />*/}
                        {/*<Route path="/services" element={<Services />} />*/}
                        {/*<Route path="/contact" element={<Contact />} />*/}
                    </Routes>
                    <Footer />
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
