import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { store } from "./App";
import { Navigate } from "react-router-dom";

// ✅ Socket connection
const socket = io("https://chat-application-xc15.onrender.com");

const Myprofile = () => {
  const [token, setToken] = useContext(store);
  const [data, setData] = useState(null);
  const [allmsg, setAllmsg] = useState([]);
  const [newmsg, setNewmsg] = useState("");

  // ✅ Delete all chats
  const deleteAll = async () => {
    const confirmDelete = window.confirm("⚠️ Delete all chats permanently?");
    if (!confirmDelete) return;

    try {
      const res = await axios.delete(
        "https://chat-application-xc15.onrender.com/delete-all"
      );
      alert(res.data.message);
      socket.emit("delete_all");
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("❌ Failed to delete chats. Try again.");
    }
  };

  // ✅ Fetch user profile
  useEffect(() => {
    if (token) {
      axios
        .get("https://chat-application-xc15.onrender.com/myprofile", {
          headers: { "x-token": token },
        })
        .then((res) => {
          setData(res.data);
          socket.emit("join_chat", res.data.username);
        })
        .catch((err) => console.error("Profile error:", err));
    }
  }, [token]);

  // ✅ Fetch all old messages from backend on load (HTTP fallback)
  useEffect(() => {
    axios
      .get("https://chat-application-xc15.onrender.com/messages")
      .then((res) => setAllmsg(res.data))
      .catch((err) => console.error("❌ Could not load old messages:", err));
  }, []);

  // ✅ Handle real-time updates
  useEffect(() => {
    socket.on("load_messages", (msgs) => setAllmsg(msgs));
    socket.on("new_message", (msg) =>
      setAllmsg((prev) => [...prev, msg])
    );
    socket.on("chats_cleared", () => setAllmsg([]));

    return () => {
      socket.off("load_messages");
      socket.off("new_message");
      socket.off("chats_cleared");
    };
  }, []);

  // ✅ Send a new message
  const submitHandler = (e) => {
    e.preventDefault();
    if (!newmsg.trim() || !data) return;

    const message = {
      username: data.username,
      text: newmsg.trim(),
      date: new Date(),
    };

    socket.emit("send_message", message);
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
                    <h5>
                      {message.username}{" "}
                      {new Date(message.date).toLocaleTimeString()}
                    </h5>
                    <p>{message.text}</p>
                  </div>
                ))
              ) : (
                <h3>
                  Chat is empty <br /> Type a message to start chatting 😜
                </h3>
              )}

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
          </div>
        </center>
      )}
    </div>
  );
};

export default Myprofile;
