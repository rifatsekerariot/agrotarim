import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { Sprout, User, MapPin, Lock, Mail } from 'lucide-react';
import axios from 'axios';

const SetupPage = () => {
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

    // ✅ SECURITY: Client-side validation
    const validatePassword = (pwd) => {
        const errors = [];
        if (pwd.length < 8) errors.push('en az 8 karakter');
        if (!/[A-Z]/.test(pwd)) errors.push('bir büyük harf');
        if (!/[a-z]/.test(pwd)) errors.push('bir küçük harf');
        if (!/[0-9]/.test(pwd)) errors.push('bir rakam');
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        const pwdErrors = validatePassword(formData.password);
        if (pwdErrors.length > 0) {
            setError(`Şifre gereksinimleri: ${pwdErrors.join(', ')}`);
            return;
        }

        if (!formData.username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
            setError('Kullanıcı adı 3-20 karakter olmalı (harf, rakam, alt çizgi)');
            return;
        }

        if (!formData.farmName) {
            setError('Sera adı gerekli');
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
            window.location.href = '/login';
        } catch (err) {
            setError(err.response?.data?.error || 'Kurulum başarısız oldu');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1) {
            // Validate user info
            if (!formData.username || !formData.password || !formData.confirmPassword) {
                setError('Lütfen tüm alanları doldurun');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Şifreler eşleşmiyor');
                return;
            }
            const pwdErrors = validatePassword(formData.password);
            if (pwdErrors.length > 0) {
                setError(`Şifre gereksinimleri: ${pwdErrors.join(', ')}`);
                return;
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <Container>
                <div className="text-center mb-4">
                    <Sprout size={64} className="text-success mb-3" />
                    <h1 className="display-4">🌱 Sera Otomasyon</h1>
                    <p className="text-muted">İlk Kurulum</p>
                </div>

                <Card className="mx-auto shadow-lg" style={{ maxWidth: '600px' }}>
                    <Card.Header className="bg-success text-white">
                        <ProgressBar now={(step / 2) * 100} className="mb-2" />
                        <h5 className="mb-0">
                            Adım {step}/2: {step === 1 ? 'Admin Hesabı' : 'Sera Bilgileri'}
                        </h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {error && <Alert variant="danger">{error}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <User size={18} className="me-2" />
                                            Kullanıcı Adı *
                                        </Form.Label>
                                        <Form.Control
                                            required
                                            placeholder="admin"
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            pattern="[a-zA-Z0-9_]{3,20}"
                                            title="3-20 karakter (harf, rakam, alt çizgi)"
                                        />
                                        <Form.Text className="text-muted">
                                            3-20 karakter (harf, rakam, alt çizgi)
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <Mail size={18} className="me-2" />
                                            E-posta (Opsiyonel)
                                        </Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="admin@example.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <Lock size={18} className="me-2" />
                                            Şifre *
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            required
                                            placeholder="********"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <Form.Text className="text-muted">
                                            Min 8 karakter, büyük harf, küçük harf ve rakam içermeli
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Şifre Tekrar *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            required
                                            placeholder="********"
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </Form.Group>

                                    <Button variant="success" className="w-100" onClick={nextStep}>
                                        İleri →
                                    </Button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <Sprout size={18} className="me-2" />
                                            Sera Adı *
                                        </Form.Label>
                                        <Form.Control
                                            required
                                            placeholder="Sera 1"
                                            value={formData.farmName}
                                            onChange={e => setFormData({ ...formData, farmName: e.target.value })}
                                            maxLength={100}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <MapPin size={18} className="me-2" />
                                            Konum (Opsiyonel)
                                        </Form.Label>
                                        <Form.Control
                                            placeholder="Adana"
                                            value={formData.farmLocation}
                                            onChange={e => setFormData({ ...formData, farmLocation: e.target.value })}
                                        />
                                    </Form.Group>

                                    <div className="d-flex gap-2">
                                        <Button variant="secondary" onClick={prevStep} className="flex-fill">
                                            ← Geri
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="success"
                                            disabled={loading}
                                            className="flex-fill"
                                        >
                                            {loading ? 'Kuruluyor...' : '✓ Kurulumu Tamamla'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </Card.Body>
                </Card>

                <div className="text-center mt-4 text-muted">
                    <small>🔒 Güvenli bağlantı | Sera Otomasyon v1.0</small>
                </div>
            </Container>
        </div>
    );
};

export default SetupPage;
