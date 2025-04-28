import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';

import './dashboard.css';


function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); 
  
    const handleLogin = async () => {
      try {
        const response = await fetch('http://localhost:3001/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
  
        if (response.ok) {
          const data = await response.json();
          setMessage('Login successful!');
          localStorage.setItem('token', data.token);
          setUsername('');
          setPassword('');
          
          navigate('/app');
        } else {
          setMessage('Login failed. Check your credentials.');
        }
      } catch (error) {
        console.error('Error logging in:', error);
        setMessage('An error occurred.');
      }
    };

    return (
      <div className='medMain' id="loignBx">
        <h4 ><Link to="/signup" style={{ color: "green", fontWeight: "bold",  fontStyle: 'italic'}}>Signup?</Link></h4>
        <div className='' style={{width: '60%'}}>
<h2 style={{textAlign: 'center'}}>Login</h2>
          <div className=''>
            <label htmlFor="username">Username:</label>
          <input type="text" id="username"  value={username} onChange={(e) => setUsername(e.target.value)} required/>
          </div>
          <div className=''>
        <label htmlFor="password">Password:</label>
          <input type="password" id="password"  value={password} onChange={(e) => setPassword(e.target.value)} required/>
          </div>
          <div className='submitBtn'><button className='addBtn'onClick={handleLogin}>Login</button></div>
          <p>{message}</p>
        </div></div>
      );
    }
    
    export default Login;