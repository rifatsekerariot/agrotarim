import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Badge, Card } from 'react-bootstrap';
import { Users, Trash2, Key, Plus, RefreshCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // Form Data
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [resetData, setResetData] = useState({ id: null, username: '', newPassword: '' });

    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Kullanıcılar getirilemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        try {
            await api.post('/users', newUser);
            setShowAddModal(false);
            setNewUser({ username: '', password: '' });
            fetchUsers();
        } catch (e) {
            alert(`Hata: ${e.response?.data?.error || 'Bir hata oluştu.'}`);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (e) {
            alert('Hata oluştu.');
        }
    };

    const handleResetPassword = async () => {
        try {
            await api.post(`/users/${resetData.id}/reset-password`, { newPassword: resetData.newPassword });
            setShowResetModal(false);
            setResetData({ id: null, username: '', newPassword: '' });
            alert('Parola başarıyla sıfırlandı.');
        } catch (e) {
            alert('Hata oluştu.');
        }
    };

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-primary mb-1 d-flex align-items-center gap-2">
                        <Users size={32} /> Kullanıcı Yönetimi
                    </h2>
                    <p className="text-muted mb-0">Sistem kullanıcılarını görüntüleyin ve yönetin.</p>
                </div>
                <Button variant="primary" className="shadow-sm" onClick={() => setShowAddModal(true)}>
                    <Plus size={20} className="me-2" />
                    Yeni Kullanıcı
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-3">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0"><Search size={18} className="text-muted" /></span>
                        <Form.Control
                            type="text"
                            placeholder="Kullanıcı ara..."
                            className="border-start-0 shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
                <Table hover responsive className="mb-0 align-middle">
                    <thead className="bg-light">
                        <tr>
                            <th className="py-3 ps-4">Kullanıcı Adı</th>
                            <th className="py-3">Kayıt Tarihi</th>
                            <th className="py-3 text-end pe-4">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" className="text-center py-4 text-muted">Yükleniyor...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="3" className="text-center py-4 text-muted">Kullanıcı bulunamadı.</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td className="ps-4 fw-medium text-dark">{user.username}</td>
                                    <td className="text-muted">{new Date(user.created_at).toLocaleDateString('tr-TR')}</td>
                                    <td className="text-end pe-4">
                                        <Button variant="light" size="sm" className="me-2 text-warning"
                                            title="Parola Sıfırla"
                                            onClick={() => {
                                                setResetData({ id: user.id, username: user.username, newPassword: '' });
                                                setShowResetModal(true);
                                            }}>
                                            <Key size={16} />
                                        </Button>
                                        <Button variant="light" size="sm" className="text-danger"
                                            title="Sil"
                                            onClick={() => handleDeleteUser(user.id)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card>

            {/* Add User Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Kullanıcı Ekle</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Kullanıcı Adı</Form.Label>
                        <Form.Control
                            type="text"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Parola</Form.Label>
                        <Form.Control
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>İptal</Button>
                    <Button variant="primary" onClick={handleAddUser} disabled={!newUser.username || !newUser.password}>Kaydet</Button>
                </Modal.Footer>
            </Modal>

            {/* Reset Password Modal */}
            <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Parola Sıfırla: {resetData.username}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Yeni Parola</Form.Label>
                        <Form.Control
                            type="password"
                            value={resetData.newPassword}
                            onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowResetModal(false)}>İptal</Button>
                    <Button variant="warning" onClick={handleResetPassword} disabled={!resetData.newPassword}>Sıfırla</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UserManagement;
