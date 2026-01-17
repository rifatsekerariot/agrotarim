import React, { useState, useEffect } from 'react';

const Settings = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        serialNumber: '',
        model: '',
        jsonMap: '' // String representation of JSON
    });

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await fetch('/api/devices');
            const data = await res.json();
            setDevices(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching devices:", error);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        let telemetryMappings = {};
        try {
            if (formData.jsonMap) {
                telemetryMappings = JSON.parse(formData.jsonMap);
            }
        } catch (err) {
            alert("Hatalı JSON formatı! Lütfen kontrol edin.");
            return;
        }

        const payload = {
            name: formData.name,
            serialNumber: formData.serialNumber,
            model: formData.model,
            telemetryMappings
        };

        try {
            const url = isEditing ? `/api/devices/${formData.id}` : '/api/devices';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Cihaz kaydedildi!");
                setFormData({ name: '', serialNumber: '', model: '', jsonMap: '' });
                setIsEditing(false);
                fetchDevices();
            } else {
                alert("Kaydetme başarısız.");
            }
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    const handleEdit = (device) => {
        setFormData({
            id: device.id,
            name: device.name,
            serialNumber: device.serialNumber,
            model: device.model || '',
            jsonMap: JSON.stringify(device.telemetryMappings || {}, null, 2)
        });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu cihazı silmek istediğinize emin misiniz?")) return;

        await fetch(`/api/devices/${id}`, { method: 'DELETE' });
        fetchDevices();
    };

    return (
        <div className="container-fluid p-4">
            <h2 className="mb-4 text-primary"><i className="bi bi-gear-fill"></i> Sistem Ayarları & Cihaz Yönetimi</h2>

            <div className="row">
                {/* Device List */}
                <div className="col-md-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Kayıtlı Cihazlar (Sensörler)</h5>
                        </div>
                        <div className="card-body">
                            {loading ? <p>Yükleniyor...</p> : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Cihaz Adı</th>
                                                <th>Seri No (Topic ID)</th>
                                                <th>Model</th>
                                                <th>Durum</th>
                                                <th>İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {devices.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center">Henüz cihaz eklenmemiş.</td></tr>
                                            ) : devices.map(d => (
                                                <tr key={d.id}>
                                                    <td>{d.name}</td>
                                                    <td><code>{d.serialNumber}</code></td>
                                                    <td>{d.model || '-'}</td>
                                                    <td>
                                                        <span className={`badge bg-${d.status === 'online' ? 'success' : 'secondary'}`}>
                                                            {d.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(d)}>
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(d.id)}>
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add/Edit Form */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 bg-light">
                        <div className="card-body">
                            <h5 className="card-title mb-3">{isEditing ? 'Cihaz Düzenle' : 'Yeni Cihaz Ekle'}</h5>
                            <form onSubmit={handleSave}>
                                <div className="mb-3">
                                    <label className="form-label">Cihaz Adı</label>
                                    <input type="text" className="form-control" required
                                        placeholder="Örn: Kuzey Sera İstasyonu"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Seri Numarası (MQTT Topic ID)</label>
                                    <input type="text" className="form-control" required
                                        placeholder="Örn: DEVICE_001"
                                        disabled={isEditing} // Prevent changing ID on edit
                                        value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                                    <div className="form-text">MQTT Topic: <code>agrometa/{formData.serialNumber || 'ID'}/telemetry</code></div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Model (Opsiyonel)</label>
                                    <input type="text" className="form-control"
                                        value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Veri Eşleştirme (JSON Mapping)</label>
                                    <textarea className="form-control font-monospace" rows="4"
                                        placeholder='{"gelen_veri": "sistem_kodu"}'
                                        value={formData.jsonMap} onChange={e => setFormData({ ...formData, jsonMap: e.target.value })}
                                    ></textarea>
                                    <div className="form-text small">
                                        Sensörden gelen JSON anahtarlarını sistem kodlarına çevirin.<br />
                                        Örnek: <code>{`{"isi": "t_air", "nem": "h_air"}`}</code>
                                    </div>
                                </div>

                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-primary">
                                        {isEditing ? 'Güncelle' : 'Kaydet'}
                                    </button>
                                    {isEditing && (
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => {
                                            setIsEditing(false);
                                            setFormData({ name: '', serialNumber: '', model: '', jsonMap: '' });
                                        }}>İptal</button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
