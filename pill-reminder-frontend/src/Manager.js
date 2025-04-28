import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import App from './App';

function Manager() {
    const isAuthenticated = !!localStorage.getItem('token'); 

    return (
        <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/app" /> : <Login />} />
            <Route path="/app" element={isAuthenticated ? <App /> : <Navigate to="/" />} />
        </Routes>
    );
}

export default Manager;
