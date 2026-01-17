import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <Navbar expand="lg" className="bg-white shadow-sm sticky-top px-3 py-2">
                <Container fluid>
                    <Navbar.Brand as={Link} to="/" className="fw-bold text-success d-flex align-items-center gap-2">
                        <i className="bi bi-flower1"></i> AGROMETA
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mx-auto">
                            <Nav.Link as={Link} to="/" className={`px-3 fw-medium ${isActive('/') ? 'text-success active-link' : 'text-secondary'}`}>
                                <i className="bi bi-speedometer2 me-1"></i> Panel
                            </Nav.Link>
                            <Nav.Link as={Link} to="/custom" className={`px-3 fw-medium ${isActive('/custom') ? 'text-success active-link' : 'text-secondary'}`}>
                                <i className="bi bi-grid-1x2 me-1"></i> Özel Panel
                            </Nav.Link>
                            <Nav.Link as={Link} to="/settings" className={`px-3 fw-medium ${isActive('/settings') ? 'text-success active-link' : 'text-secondary'}`}>
                                <i className="bi bi-gear me-1"></i> Ayarlar
                            </Nav.Link>
                        </Nav>
                        <Button variant="outline-danger" size="sm" onClick={handleLogout} className="d-flex align-items-center gap-1">
                            <i className="bi bi-box-arrow-right"></i> Çıkış
                        </Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <div className="flex-grow-1">
                {children}
            </div>

            <style>
                {`
                .active-link {
                    background-color: #f8f9fa;
                    border-radius: 8px;
                }
                `}
            </style>
        </div>
    );
};

export default MainLayout;
