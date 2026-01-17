import React from 'react';

const WaterLeakWidget = ({ data }) => {
    const hasData = data && data.value != null;
    const isLeak = hasData && data.value === 1;

    if (!hasData) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-muted">
                <div className="spinner-border spinner-border-sm text-secondary mb-2" role="status"></div>
                <small>Veri Bekleniyor...</small>
            </div>
        );
    }

    return (
        <div className={`d-flex flex-column h-100 p-2 justify-content-center text-center ${isLeak ? 'bg-danger text-white' : 'bg-white'}`}>
            <div className={`rounded-circle p-4 mx-auto mb-3 ${isLeak ? 'bg-white text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                <i className={`bi ${isLeak ? 'bi-moisture' : 'bi-droplet'} display-4`}></i>
            </div>

            <h3 className="fw-bold mb-2">
                {isLeak ? 'SU KAÇAĞI!' : 'NORMAL'}
            </h3>

            <p className={isLeak ? 'text-white-50' : 'text-muted'}>
                {isLeak ? 'Acil müdahale gerekli!' : 'Tüm bölgeler kuru ve güvenli.'}
            </p>

            <div className={`small border-top pt-2 mt-2 ${isLeak ? 'border-white border-opacity-25' : 'text-muted'}`}>
                Son kontrol: {data.ts ? new Date(data.ts).toLocaleTimeString() : 'Bilinmiyor'}
            </div>
        </div>
    );
};

export default WaterLeakWidget;
