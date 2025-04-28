import React from 'react';
import { Link } from 'react-router-dom';

const linkStyle = {
    color: 'red',
    fontSize: '24px',
    fontWeight: 'bold',
  textDecoration: 'none',
  marginRight: '20px',
};

const NavBar = () => {
  return (
    <nav 
          className="navbar" 
          style={{
            position: 'fixed',  
            top: 0,            
            left: 0,            
            width: '100%',      
            backgroundColor: 'lightgreen',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '4px solid darkgreen'
          }} //marginTop: '2%' was added later
        >
          <div style={{paddingLeft: '2rem', marginTop: '2%'}}><h1 style={{padding: '0.4rem', color: 'black', fontWeight: 'boldest', fontStyle: 'italic'}}>Pill&nbsp;&nbsp;⏰'Clock</h1></div>
          <ul className="nav-links" style={{display: 'flex', flexDirection:"row", justifyContent: 'space-evenly', listStyle: 'none', justifyContent: 'space-evenly', width: '40%', marginTop: '2rem'}}>
          <li style={{backgroundColor:"lightgreen", color: 'white'}}><Link to="/dashboard" style={{ color: "white", fontWeight: "bold",  textDecoration: "none"}}>Dashboard</Link></li>
            <li style={{backgroundColor:"lightgreen", color: 'white'}} ><Link to="/stats" style={{ color: "white", fontWeight: "bold",   textDecoration: "none"}}>Health Metrics</Link></li>
            <li  style={{backgroundColor:"lightgreen", color: 'white'}}><Link to="/app"style={{ color: "white", fontWeight: "bold",   textDecoration: "none"}} >Medication</Link></li>
            <li  style={{backgroundColor:"lightgreen", color: 'white'}}><Link to="/account"  style={{ color: "white", fontWeight: "bold",   textDecoration: "none"}} >Account</Link></li>
            <li  style={{backgroundColor:"lightgreen", color: 'white'}}  ><Link to="/logout"style={{ color: "red", fontWeight: "bold",   textDecoration: "none"}}   >Logout ➦</Link></li>
            {/* <li style={{backgroundColor:"lightgreen", color: 'white'}}></li> */}

          </ul>
        </nav> 
  );
};

export default NavBar;
