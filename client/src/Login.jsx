import React,{useState,useContext}from 'react';
import axios from'axios';
import {store} from './App' 
import { Navigate } from 'react-router-dom'; 
//import './login.css';

const Login = () => {
  const [token,setToken] =useContext(store);
  const [data,setData] = useState({
    email:'',
    password:''
  })
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const changeHandler = e=>{
    setData({...data,[e.target.name]:e.target.value})
    // Clear error when user starts typing
    if(error) {
      setError('');
    }
  }

  const submitHandler = e =>{
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Check for empty fields
    if(!data.email || !data.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    axios.post('https://chat-application-xc15.onrender.com/login',data)
      .then(res => {
        setToken(res.data.token);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        if(err.response && err.response.status === 401) {
          setError('Invalid email or password');
        } else if(err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Login failed. Please try again.');
        }
      })
  }
  if(token){
    return <Navigate to='/MyProfile'/>
  }
  
    return (
    <div>
        <center>
            <form onSubmit={submitHandler}>
                <h3>Login</h3>
                
                {/* Error Message */}
                {error && (
                  <div style={{
                    color: '#f44336',
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '4px',
                    padding: '10px',
                    marginBottom: '15px',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    {error}
                  </div>
                )}
                
                <input 
                  type="text" 
                  onChange={changeHandler} 
                  name="email" 
                  placeholder="Email"
                  value={data.email}
                  disabled={loading}
                /><br/>
                <input 
                  type="password" 
                  onChange={changeHandler} 
                  name="password" 
                  placeholder="Password"
                  value={data.password}
                  disabled={loading}
                /><br/>
                <input 
                  type="submit" 
                  value={loading ? "Logging in..." : "Login"}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? '#ccc' : '#4CAF50',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                /><br/>
            </form>
        </center>

    </div>
  )
}

export default Login
