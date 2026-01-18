import Link from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import api from '../utils/api';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    // Global Alert Notification State
    const [showAlert, setShowAlert] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '' });
    const [lastAlertId, setLastAlertId] = useState(0);

    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    // Poll for new alerts every 10 seconds
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const checkForNewAlerts = async () => {
            try {
                const response = await axios.get('/api/automation/logs/1', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const logs = response.data;
                if (logs.length > 0) {
                    const latest = logs[0];
                    if (lastAlertId !== 0 && latest.id !== lastAlertId) {
                        setAlertData({
                            title: latest.rule.name,
                            message: `${latest.message} (${new Date(latest.createdAt).toLocaleTimeString()})`
                        });
                        setShowAlert(true);
                    }
                    if (latest.id !== lastAlertId) setLastAlertId(latest.id);
                }
            } catch (error) {
                console.error('Alert polling error:', error);
            }
        };

        checkForNewAlerts();
        const interval = setInterval(checkForNewAlerts, 10000);
        return () => clearInterval(interval);
    }, [lastAlertId]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className={`d-flex flex-column min-vh-100 ${darkMode ? 'bg-dark' : 'bg-light'}`}>
            <Navbar expand="lg" className={`${darkMode ? 'navbar-dark bg-dark' : 'bg-white'} shadow-sm sticky-top px-3 py-2`}>
                <Container fluid>
                    <Navbar.Brand as={Link} to="/" className="fw-bold text-success d-flex align-items-center gap-2">
                        <i className="bi bi-cpu"></i> SERA OTOMASYON
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mx-auto">
                            <Nav.Link as={Link} to="/" className={`px-3 fw-medium ${isActive('/') ? 'text-success active-link' : darkMode ? 'text-light' : 'text-secondary'}`}>
                                <i className="bi bi-speedometer2 me-1"></i> Panel
                            </Nav.Link>
                            <Nav.Link as={Link} to="/settings" className={`px-3 fw-medium ${isActive('/settings') ? 'text-success active-link' : darkMode ? 'text-light' : 'text-secondary'}`}>
                                <i className="bi bi-gear me-1"></i> Ayarlar
                            </Nav.Link>
                            <Nav.Link as={Link} to="/users" className={`px-3 fw-medium ${isActive('/users') ? 'text-success active-link' : darkMode ? 'text-light' : 'text-secondary'}`}>
                                <i className="bi bi-people me-1"></i> Kullanıcılar
                            </Nav.Link>
                            <Nav.Link as={Link} to="/automation" className={`px-3 fw-medium ${isActive('/automation') ? 'text-success active-link' : darkMode ? 'text-light' : 'text-secondary'}`}>
                                <i className="bi bi-robot me-1"></i> Otomasyon
                            </Nav.Link>
                            <Nav.Link as={Link} to="/downlink-logs" className={`px-3 fw-medium ${isActive('/downlink-logs') ? 'text-success active-link' : darkMode ? 'text-light' : 'text-secondary'}`}>
                                <i className="bi bi-reception-4 me-1"></i> LoRa Logları
                            </Nav.Link>
                        </Nav>
                        <div className="d-flex align-items-center gap-2">
                            <Button
                                variant={darkMode ? 'outline-light' : 'outline-secondary'}
                                size="sm"
                                onClick={() => setDarkMode(!darkMode)}
                                className="d-flex align-items-center gap-1"
                                title={darkMode ? 'Açık Mod' : 'Karanlık Mod'}
                            >
                                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={handleLogout} className="d-flex align-items-center gap-1">
                                <i className="bi bi-box-arrow-right"></i> Çıkış
                            </Button>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <div className="flex-grow-1">
                {children}
            </div>

            {/* Global Alert Notification */}
            <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast onClose={() => setShowAlert(false)} show={showAlert} delay={8000} autohide bg="danger">
                    <Toast.Header>
                        <strong className="me-auto">🚨 {alertData.title}</strong>
                        <small>Şimdi</small>
                    </Toast.Header>
                    <Toast.Body className="text-white">
                        {alertData.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            <style>
                {`
                .active-link {
                    background-color: ${darkMode ? '#2d3748' : '#f8f9fa'};
                    border-radius: 8px;
                }
                [data-bs-theme="dark"] .card {
                    background-color: #1a202c !important;
                    border-color: #2d3748 !important;
                }
                [data-bs-theme="dark"] .bg-light {
                    background-color: #2d3748 !important;
                }
                [data-bs-theme="dark"] .text-dark {
                    color: #e2e8f0 !important;
                }
                [data-bs-theme="dark"] .text-muted {
                    color: #a0aec0 !important;
                }
                `}
            </style>
        </div>
    );
};

export default MainLayout;
