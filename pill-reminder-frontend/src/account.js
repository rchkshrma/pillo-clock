import React, { useState, useEffect } from 'react';
import { usePushNotifications } from "./pushNotifications";
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar'; 
import './dashboard.css';



function Account() {
  const navigate = useNavigate();////////////////////////////
    const [username, setUsername] = useState(null);
    const [email, setEmail] = useState(null);
    const [email2, setEmail2] = useState(null);
    const token = localStorage.getItem('token');
    const [error, setError] = useState(null); 
    const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const [password, setPassword] = useState('');
      const [confirm_pass, setConfirm_pass] = useState('');
      const[success, setSuccess] = useState(null);
    const getUser  = async () => {
        try {
          const response = await fetch('http://localhost:3001/user',{ method: 'GET', headers: authHeaders });
          if (!response.ok) {
            throw new Error(`Error fetching user: ${response.statusText}`);
          }
          const data = await response.json();
          console.log(data.user);
          setUsername(data.user.username);
          setEmail(data.user.email);
          setEmail2(data.user.email2 || "");
          setError(null);

        } catch (err) {
          console.error(err);
          setError(err.message);
        }
      };
    const checkEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
      }
    

  const update = async(e) => {
    e.preventDefault();
    if(password){
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');setSuccess(null);return;
setSuccess(null);
      }
    if (password !== confirm_pass) {
      setError('Passwords do not match');setSuccess(null);return;}}
    if (email && !checkEmail(email)) {
      setError('Invalid email format');setSuccess(null);return;
    }
    if (email.trim() === "") {setError('Email cannot be empty');setSuccess(null);return;}
    if (email2 && !checkEmail(email2)) {
      setError('Invalid email format');setSuccess(null);return;}

      if (email2.trim() === "") {setEmail2(null); }
      try {
        await fetch('http://localhost:3001/user' ,{
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ email, email2, password })
        });
      } catch (error) {
        console.error('Error updating dose:', error);
        setError(error.message)
        setSuccess(null);
    }
    setSuccess("Account updated successfully");
    setError(null);
    setPassword('');
    setConfirm_pass('');
    setEmail('');
    setEmail2('');
    getUser();
    };
    
useEffect(() => {getUser();}, []);
    
return (
  <div className="">
    < NavBar />
    <div className = 'medMain'>
    <h2>Account Details</h2>
    {username ? (
      <><div className="form">
        <p><strong>Username:</strong> {username}</p>

        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Caretaker Email (optional): <button id='xBtn' className="clsBtn" type="button" onClick={()=>setEmail2("")} >Remove Caretaker Email</button></label>
        <input type="email" value={email2} onChange={(e) => setEmail2(e.target.value)} placeholder="Leave blank to remove" />
     


        <label>New Password:</label><input type="password" placeholder="Leave blank to keep current" value={password} onChange={(e) => setPassword(e.target.value)} />
{password && (<><label>Confirm New Password:</label><input type="password" placeholder="Re-enter new password" value={confirm_pass} onChange={(e) => setConfirm_pass(e.target.value)} /></>)}


<div className='submitBtn'><button className="addBtn" onClick={update}>Update Account</button></div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        
      </div>
      <h2>Push Notifications On Current Device</h2>
      <div className='reactBtn'>
    <button className='addBtn'onClick={() => navigate('/subscribe')}>Enable Push Notifications</button>
    <button className="clsBtn"onClick={() => navigate('/unsub')}>Disable Push Notifications</button></div>
      </>
    ) : (
      <p>Loading user data...</p>
    )}
    </div>
  </div>
);

}

export default Account;
