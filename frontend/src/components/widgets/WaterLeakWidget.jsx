import React from 'react';

const WaterLeakWidget = ({ data }) => {
    const isLeak = data?.value === 1 || false;

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
                Son kontrol: 5 dk önce
            </div>
        </div>
    );
};

export default WaterLeakWidget;
