import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import Login from './Login';
import Signup from './Signup';
import Stats from './Stats';
import Dashboard from './Dashboard';
import Account from './account';
import Subscribe from './subscribe';
import Unsub from './unsub';
import Logout from './logout';

ReactDOM.render(
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/app" element={<App />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/account" element={<Account />} />
      <Route path="/subscribe" element={<Subscribe />} />
      <Route path="/unsub" element={<Unsub />} />
      <Route path="/logout" element={<Logout />} />
    </Routes>
  </Router>,
  document.getElementById('root')
);


// const PrivateRoute = ({ children }) => {
//   const token = localStorage.getItem('token');
//   return token ? children : <Navigate to="/" />;
// };

// <Routes>
//   <Route path="/" element={<Login />} />
//   <Route path="/app" element={<PrivateRoute><App /></PrivateRoute>} />
// </Routes>
