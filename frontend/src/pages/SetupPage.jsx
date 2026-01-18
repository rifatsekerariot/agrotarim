import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { Sprout, User, MapPin } from 'lucide-react';
import axios from 'axios';

const SetupPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        farmName: '',
        farmLocation: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        if (formData.password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır');
            return;
        }

        setLoading(true);

        try {
            await axios.post('/api/setup/initialize', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                farmName: formData.farmName,
                farmLocation: formData.farmLocation
            });

            // Success - redirect to login
            alert('✅ Kurulum tamamlandı! Şimdi giriş yapabilirsiniz.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Kurulum başarısız oldu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <Container style={{ maxWidth: '600px' }}>
                <Card className="shadow-lg border-0">
                    <Card.Header className="bg-success text-white text-center py-4">
                        <Sprout size={48} className="mb-2" />
                        <h2 className="mb-0">AGROMETA</h2>
                        <p className="mb-0 small">İlk Kurulum Sihirbazı</p>
                    </Card.Header>
                    <Card.Body className="p-4">
                        <ProgressBar now={(step / 2) * 100} className="mb-4" />

                        {error && <Alert variant="danger">{error}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <>
                                    <h5 className="mb-3 d-flex align-items-center gap-2">
                                        <User size={20} /> Admin Kullanıcı Oluştur
                                    </h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Kullanıcı Adı *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="admin"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>E-posta</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="admin@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                        <Form.Text>İsteğe bağlı</Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Şifre *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="En az 6 karakter"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Şifre Tekrar *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Şifrenizi tekrar girin"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                    <Button variant="success" onClick={() => setStep(2)} className="w-100">
                                        Devam Et →
                                    </Button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <h5 className="mb-3 d-flex align-items-center gap-2">
                                        <MapPin size={20} /> Çiftlik Bilgileri
                                    </h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Çiftlik Adı *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Örn: Adana Organik Çiftliği"
                                            value={formData.farmName}
                                            onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Konum</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Örn: Adana, Türkiye"
                                            value={formData.farmLocation}
                                            onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                                        />
                                        <Form.Text>İsteğe bağlı</Form.Text>
                                    </Form.Group>

                                    <div className="d-flex gap-2">
                                        <Button variant="secondary" onClick={() => setStep(1)} className="w-50">
                                            ← Geri
                                        </Button>
                                        <Button
                                            variant="success"
                                            type="submit"
                                            disabled={loading}
                                            className="w-50"
                                        >
                                            {loading ? 'Kuruluyor...' : '🚀 Kurulumu Tamamla'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </Card.Body>
                </Card>

                <div className="text-center mt-3 text-white">
                    <small>Bu kurulum yalnızca bir kez yapılır. Sistem hazır olduğunda giriş ekranına yönlendirileceksiniz.</small>
                </div>
            </Container>
        </div>
    );
};

export default SetupPage;
