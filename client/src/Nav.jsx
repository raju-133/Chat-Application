import React,{useContext,useState} from 'react'
import {Link} from 'react-router-dom';
import {store} from'./App';

const Nav = () => {
  const[token,setToken] = useContext(store)
  return (
    <div>
       {!token && 
        <nav>
          <Link to="/register">REGISTER</Link> | 
           <Link to="/login"> LOGIN</Link>
        </nav>    
        }       

    </div>
  )
}

export default Nav