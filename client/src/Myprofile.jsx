// Myprofile.jsx
import React, { useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { store } from "./App";
import { Navigate } from "react-router-dom";

// Connect to backend Socket.IO
const socket = io("https://chat-application-xc15.onrender.com");

const Myprofile = () => {
  const [token, setToken] = useContext(store);
  const [data, setData] = useState(null);
  const [allmsg, setAllmsg] = useState([]);
  const [newmsg, setNewmsg] = useState("");
  const chatBoxRef = useRef(null);

  // ✅ Fetch profile on login
  useEffect(() => {
    if (token) {
      axios
        .get("https://chat-application-xc15.onrender.com/myprofile", {
          headers: { "x-token": token },
        })
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => console.log("Profile error:", err));
    }
  }, [token]);

  // ✅ Socket event listeners
  useEffect(() => {
    // Load old messages
    socket.on("load_messages", (msgs) => {
      setAllmsg(msgs);
    });

    // Listen for new messages
    socket.on("new_message", (msg) => {
      setAllmsg((prev) => [...prev, msg]);
    });

    // Listen for chat deletion
    socket.on("chats_cleared", () => setAllmsg([]));

    return () => {
      socket.off("load_messages");
      socket.off("new_message");
      socket.off("chats_cleared");
    };
  }, []);

  // ✅ Auto-scroll to newest message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [allmsg]);

  // ✅ Send message
  const submitHandler = (e) => {
    e.preventDefault();
    if (!newmsg.trim() || !data) return;

    const message = {
      username: data.username,
      text: newmsg,
      date: new Date(),
    };

    socket.emit("send_message", message);
    setNewmsg("");
  };

  // ✅ Delete all chats
  const deleteAll = async () => {
    const confirmDelete = window.confirm(
      "⚠️ Are you sure you want to delete ALL chats? This cannot be undone!"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        "https://chat-application-xc15.onrender.com/delete-all"
      );
      alert(response.data.message);
      socket.emit("delete_all");
    } catch (error) {
      console.error("Error deleting all data:", error);
      alert("❌ Failed to delete chats. Please try again.");
    }
  };

  if (!token) return <Navigate to="/login" />;

  return (
    <div>
      {data && (
        <center>
          <br />
          <div className="card" style={{ width: "38rem", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                className="logout-btn"
                onClick={() => setToken(null)}
              >
                Logout
              </button>
              <button className="delete-btn" onClick={deleteAll}>
                Delete Chat
              </button>
            </div>

            <div className="chatbox-title">Chatbox</div>

            <div
              className="card-body"
              ref={chatBoxRef}
              style={{ height: "400px", overflowY: "auto" }}
            >
              {allmsg.length > 0 ? (
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
                <h4 style={{ textAlign: "center" }}>
                  Chat box is empty <br />
                  Say hi! 😜
                </h4>
              )}
            </div>

            <form className="chat-input" onSubmit={submitHandler}>
              <input
                type="text"
                value={newmsg}
                placeholder="Type here..."
                onChange={(e) => setNewmsg(e.target.value)}
              />
              <input type="submit" value="Send" />
            </form>
          </div>
        </center>
      )}
    </div>
  );
};

export default Myprofile;
