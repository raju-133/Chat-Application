import React,{useContext,useState,useEffect} from 'react'
import axios from 'axios';
import {store} from './App';
import { Navigate } from 'react-router-dom';
//import './myprofile.css';

const Myprofile = () => {
  const [token,setToken] = useContext(store)
  const [data,setData] = useState(null);
  const [allmsg,setAllmsg] =useState([])
  const [newmsg,setNewmsg] =useState("")

    

async function deleteAll() {
  const confirmDelete = window.confirm(
    "⚠️ Are you sure you want to delete ALL chats? This cannot be undone!"
  );
  if (!confirmDelete) return;

  try {
    const response = await axios.delete("http://localhost:5000/delete-all"); // ✅ correct method
    alert(response.data.message);
    setAllmsg([]); // clear chat instantly
  } catch (error) {
    console.error("Error deleting all data:", error);
    alert("❌ Failed to delete chats. Please try again.");
  }
}



  useEffect(()=>{
    console.log('Token:', token);
    if(token) {
      console.log('Making API calls...');
      axios.get('http://localhost:5000/myprofile',{
        headers:{
          'x-token' : token
        }
      }).then(res=> {
        console.log('Profile data:', res.data);
        setData(res.data);
      }).catch((err)=>{
        console.log('Profile error:', err);
      });

      axios.get('http://localhost:5000/getmsg',{
        headers:{
          'x-token' : token
        }
      }).then(res=> {
        console.log('Messages data:', res.data);
        setAllmsg(res.data);
      }).catch((err)=>{
        console.log('Messages error:', err);
      });

  
    }
  },[token])

  const submitHandler = e=>{
    e.preventDefault();
      axios.post('http://localhost:5000/addmsg',{text:newmsg},{
        headers:{
          'x-token' : token
        }
      }).then(res=> {
        setAllmsg(res.data);
        setNewmsg("");
      }).catch((err)=>console.log(err))
  }
  
  // Add debug logs
  console.log('Current state:', { token, data, allmsg });

  if(!token)
  {
    console.log('No token, redirecting to login');
    return <Navigate to ='/login'/>
  }


  return (
    <div>
      {
        data && 
        <center>
           <br/>
            
             <div className="card" style={{"width":"38rem","textAlign":"left"}}>
               <button className="logout-btn" onClick={() => setToken(null)}>Logout</button>
               <button className='delete-btn' onClick={deleteAll}>Delete Chat</button>
              
               <div className="chatbox-title">
                 Chatbox
               </div>
               <div className="card-body">
                {
                  allmsg.length>=1 ?
                   allmsg.map((message, idx) => <div className={message.username === data.username ? "msg-right" : "msg-left"} key={message._id || idx}>

                     
                       <h5 className = "card-title">{message.username} {new Date(message.date).toLocaleDateString()} {new Date(message.date).toLocaleTimeString()}</h5>
                      <p>{message.text}</p>
                    
                  </div>)

                  :
                  <h1>chat box is empty <br />yedho oka msg pettu ra babu.. 😜</h1>
                }

                <form className="chat-input" onSubmit={submitHandler}>
                  <input type = "text" value={newmsg} placeholder='type here...' onChange={e=>setNewmsg(e.target.value)}/>
                  <input type = "submit" value="Send message"/>
                  
                  
                </form>
                 
              </div>
              
            </div>  
            

        </center>
      }
    </div>
  )
}

export default Myprofile