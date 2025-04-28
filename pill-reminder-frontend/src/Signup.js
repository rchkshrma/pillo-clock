import React, { useState } from 'react';
import './dashboard.css';

import { Link } from 'react-router-dom';

function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
const [message, setMessage] = useState('');
const [password_2, setPassword2] = useState('');
const [error, setError] = useState('');
const [email2, setEmail2] = useState('');

    const checkEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
      }

    const handleSignup = async (e) => {
        e.preventDefault();
        if (username.trim() === '') {
            setError('Username cannot be empty.');
            setMessage(null);
            return;}
        if(username.length < 3 || username.length > 20){
            setError('Username must be between 3 and 20 characters.');
            setMessage(null);
            return;
        }
        if(password.length < 6){
            setError('Password must be atleast 6 characters.');
            setMessage(null);
            return;
        }
        if (password !== password_2) {
            setError('Passwords do not match.');
            setMessage(null);
            return;
        }
        if (email.trim() === '') {
            setError('Email cannot be empty.');
            setMessage(null);
            return;
        }
        if (!checkEmail(email)) {
            setError('Invalid email format.');
            setMessage(null);
            return;
        }
        if (email2 && !checkEmail(email2)) {
            setError('Invalid email format');setMessage(null);return;}
      
            if (email2.trim() === "") {setEmail2(null); }
        try {
            const response = await fetch('http://localhost:3001/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, email2 })
            });

            if (response.ok) {
                    setMessage('Signup successful!');
                    setError(null);
                    setEmail2('');
                setPassword2('');
                setUsername('');
                setEmail('');
                setPassword('');
            } else {
                const error = await response.json();
                setMessage(error.message);
            }
        } catch (err) {
         setMessage('Error connecting to the server.');
        }
    };

    return (
        <div className="medMain" id="loignBx">
             <h4 ><Link to="/" style={{ color: "green", fontWeight: "bold",  fontStyle: 'italic'}}>Login?</Link></h4>
            <div style={{width: '60%'}}>
  <h2 style={{textAlign: 'center'}}>Signup</h2>
  {/* <form onSubmit={handleSignup}> */}
    <div>
      <label htmlFor="username">Username:</label>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
    <div >
      <label htmlFor="email">Email:</label>
      <input type="email"  value={email} onChange={(e) => setEmail(e.target.value)} required />
 </div>
    <div >
      <label htmlFor="email">Caretaker Email (Optional):</label>
      <input type="email"  value={email2} onChange={(e) => setEmail2(e.target.value)} required />
 </div>
    <div >
            <label htmlFor="password">Password:</label>
      <input type="password"  value={password} onChange={(e) => setPassword(e.target.value)} required />
    </div>
    <div >
      <label htmlFor="password">Confirm Password:</label>
      <input type="password" value={password_2} onChange={(e) => setPassword2(e.target.value)} required />
    </div>
    <div className='submitBtn'><button onClick={handleSignup}type="submit" className="addBtn">Sign Up</button></div>
  {/* </form> */}
  {error && <div className="error">{error}</div>}
  {message && <div>{message}</div>}
</div></div>

     );
}

export default Signup;
