// ✅ Socket event listeners
useEffect(() => {
  socket.on("load_messages", (msgs) => {
    console.log("Loaded old messages:", msgs);
    setAllmsg(msgs);
  });

  socket.on("new_message", (msg) => {
    setAllmsg((prev) => [...prev, msg]);
  });

  socket.on("chats_cleared", () => setAllmsg([]));

  return () => {
    socket.off("load_messages");
    socket.off("new_message");
    socket.off("chats_cleared");
  };
}, []);
