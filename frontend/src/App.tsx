import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClientOrders } from './pages/ClientOrders';
import { RiderDeliveries } from './pages/RiderDeliveries';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/Toast';

import { useEffect } from 'react';
import { socket } from './services/socket';

function App() {
  useEffect(() => {
    socket.connect();
    return () => { socket.disconnect(); };
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route path="/orders" element={<ClientOrders />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['rider']} />}>
            <Route path="/my-deliveries" element={<RiderDeliveries />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;