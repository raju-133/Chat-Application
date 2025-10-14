import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { store } from "./App";
import { Navigate } from "react-router-dom";

const socket = io("https://chat-application-xc15.onrender.com"); // ✅ Connect to backend server

const Myprofile = () => {
  const [token, setToken] = useContext(store);
  const [data, setData] = useState(null);
  const [allmsg, setAllmsg] = useState([]);
  const [newmsg, setNewmsg] = useState("");

  // ✅ Delete all chats (still Axios)
  async function deleteAll() {
    const confirmDelete = window.confirm(
      "⚠️ Are you sure you want to delete ALL chats? This cannot be undone!"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete("https://chat-application-xc15.onrender.com/delete-all");
      alert(response.data.message);
      setAllmsg([]);
      socket.emit("delete_all"); // notify others (optional)
    } catch (error) {
      console.error("Error deleting all data:", error);
      alert("❌ Failed to delete chats. Please try again.");
    }
  }

  // ✅ Fetch user profile once
  useEffect(() => {
    if (token) {
      axios
        .get("https://chat-application-xc15.onrender.com/myprofile", {
          headers: { "x-token": token },
        })
        .then((res) => {
          setData(res.data);
          socket.emit("join_chat", res.data.username); // join chat room
        })
        .catch((err) => console.log("Profile error:", err));
    }
  }, [token]);

  // ✅ Setup socket listeners
  useEffect(() => {
    socket.on("load_messages", (msgs) => {
      setAllmsg(msgs);
    });

    socket.on("new_message", (msg) => {
      setAllmsg((prev) => [...prev, msg]);
    });

    socket.on("chats_cleared", () => {
      setAllmsg([]);
    });

    return () => {
      socket.off("load_messages");
      socket.off("new_message");
      socket.off("chats_cleared");
    };
  }, []);

  // ✅ Send message through socket
  const submitHandler = (e) => {
    e.preventDefault();
    if (newmsg.trim() === "") return;

    const message = {
      username: data.username,
      text: newmsg,
      date: new Date(),
    };

    socket.emit("send_message", message);
    setAllmsg((prev) => [...prev, message]); // update instantly
    setNewmsg("");
  };

  if (!token) return <Navigate to="/login" />;

  return (
    <div>
      {data && (
        <center>
          <br />
          <div className="card" style={{ width: "38rem", textAlign: "left" }}>
            <button className="logout-btn" onClick={() => setToken(null)}>
              Logout
            </button>
            <button className="delete-btn" onClick={deleteAll}>
              Delete Chat
            </button>

            <div className="chatbox-title">Chatbox</div>

            <div className="card-body">
              {allmsg.length >= 1 ? (
                allmsg.map((message, idx) => (
                  <div
                    className={
                      message.username === data.username
                        ? "msg-right"
                        : "msg-left"
                    }
                    key={idx}
                  >
                    <h5 className="card-title">
                      {message.username}{" "}
                      {new Date(message.date).toLocaleTimeString()}
                    </h5>
                    <p>{message.text}</p>
                  </div>
                ))
              ) : (
                <h1>
                  Chat box is empty <br /> Yedho oka msg pettu ra babu.. 😜
                </h1>
              )}

              <form className="chat-input" onSubmit={submitHandler}>
                <input
                  type="text"
                  value={newmsg}
                  placeholder="type here..."
                  onChange={(e) => setNewmsg(e.target.value)}
                />
                <input type="submit" value="Send message" />
              </form>
            </div>
          </div>
        </center>
      )}
    </div>
  );
};

export default Myprofile;
