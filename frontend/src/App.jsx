import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeviceDetail from './pages/DeviceDetail';
import Settings from './pages/Settings';
import CustomDashboard from './pages/CustomDashboard';
import UserManagement from './pages/UserManagement';
import AutomationPage from './pages/AutomationPage';
import SetupPage from './pages/SetupPage';

import MainLayout from './components/MainLayout';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

function App() {
    const [setupNeeded, setSetupNeeded] = useState(null); // null = loading

    useEffect(() => {
        // Check if setup is needed
        axios.get('/api/setup/status')
            .then(res => setSetupNeeded(res.data.needsSetup))
            .catch(err => {
                console.error('Setup check failed:', err);
                setSetupNeeded(false);
            });
    }, []);

    // Loading state
    if (setupNeeded === null) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        );
    }

    // Redirect to setup if needed
    if (setupNeeded) {
        return <SetupPage />;
    }

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/device/:serial"
                    element={
                        <PrivateRoute>
                            <DeviceDetail />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <PrivateRoute>
                            <Settings />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/custom"
                    element={
                        <PrivateRoute>
                            <CustomDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <PrivateRoute>
                            <UserManagement />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/automation"
                    element={
                        <PrivateRoute>
                            <AutomationPage />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
