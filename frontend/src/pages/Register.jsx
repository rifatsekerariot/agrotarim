import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../utils/api';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(username, password);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Kayıt başarısız');
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <div className="w-100" style={{ maxWidth: '400px' }}>
                <h2 className="text-center mb-4">AgroMeta Kayıt</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Kullanıcı Adı</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Şifre</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </Form.Group>
                    <Button className="w-100" type="submit">Kayıt Ol</Button>
                </Form>
                <div className="text-center mt-3">
                    Zaten üye misiniz? <Link to="/login">Giriş Yap</Link>
                </div>
            </div>
        </Container>
    );
};

export default Register;
