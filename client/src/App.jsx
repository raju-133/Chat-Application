import React,{useState,createContext} from 'react'
import Nav from './Nav';
import {BrowserRouter,Route,Routes} from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Myprofile from './Myprofile';

export const store = createContext();

const App = () => {
  
  const [token,setToken] = useState(null);
  return (
    <div>
    <store.Provider value={[token,setToken]}>
     <BrowserRouter>
     <Nav/>
     <Routes>
       <Route path ='/' element ={<Login/>}/>
       <Route path ='/register' element ={<Register/>}/>
       <Route path ='/login' element ={<Login/>}/>
       <Route path ='/MyProfile' element = {<Myprofile/>}/>
    </Routes>
     </BrowserRouter>
    </store.Provider>
     
      
    </div>
  )
}

export default App