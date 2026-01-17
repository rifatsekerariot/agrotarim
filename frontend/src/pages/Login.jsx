import React, { useState } from 'react';
import { Form, Button, Container, Alert, Card, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [tempToken, setTempToken] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await login(username, password);

            if (data.mustChangePassword) {
                // User must change password
                setTempToken(data.token);
                setShowPasswordChange(true);
            } else {
                // Normal login
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Giriş başarısız');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 5) {
            setError('Şifre en az 5 karakter olmalıdır');
            return;
        }

        try {
            const res = await fetch('/api/auth/change-initial-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (res.ok) {
                // Password changed successfully, log in again
                localStorage.setItem('token', tempToken);
                const userData = { username };
                localStorage.setItem('user', JSON.stringify(userData));
                navigate('/');
            } else {
                const data = await res.json();
                setError(data.error || 'Şifre değiştirilemedi');
            }
        } catch (err) {
            setError('Şifre değiştirme başarısız');
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card className="p-4 shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
                <div className="text-center mb-4">
                    <i className="bi bi-flower1 text-success" style={{ fontSize: '3rem' }}></i>
                    <h2 className="fw-bold text-success mt-2">AGROMETA</h2>
                    <p className="text-muted">Tarımsal IoT Platformu</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Kullanıcı Adı</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="admin"
                        />
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Şifre</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </Form.Group>
                    <Button className="w-100 shadow-sm" variant="success" size="lg" type="submit">
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Giriş Yap
                    </Button>
                </Form>
            </Card>

            {/* Password Change Modal */}
            <Modal show={showPasswordChange} onHide={() => { }} backdrop="static" centered>
                <Modal.Header className="bg-warning text-white">
                    <Modal.Title><i className="bi bi-shield-lock me-2"></i>Şifre Değiştirme Zorunlu</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">
                        <i className="bi bi-info-circle me-2"></i>
                        Varsayılan şifre ile giriş yaptınız. Güvenlik için lütfen şifrenizi değiştirin.
                    </Alert>
                    <Form onSubmit={handlePasswordChange}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Yeni Şifre (Min. 5 karakter)</Form.Label>
                            <Form.Control
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={5}
                                autoFocus
                            />
                        </Form.Group>
                        <div className="d-grid">
                            <Button variant="warning" size="lg" type="submit">
                                <i className="bi bi-check-circle me-2"></i>
                                Şifreyi Değiştir ve Devam Et
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Login;
