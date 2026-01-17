import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeviceDetail from './pages/DeviceDetail';
import Settings from './pages/Settings';
import CustomDashboard from './pages/CustomDashboard';
import UserManagement from './pages/UserManagement';
import AutomationPage from './pages/AutomationPage';

import MainLayout from './components/MainLayout';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

function App() {
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
