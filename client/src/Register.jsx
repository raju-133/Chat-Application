import React, { useState } from "react";
import axios from "axios";

const Register = () => {
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    confirmpassword: "",
  });

  const changeHandler = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const { username, email, password, confirmpassword } = data;

    if (!username || !email || !password || !confirmpassword) {
      alert("⚠️ Please fill all fields");
      return;
    }

    if (password !== confirmpassword) {
      alert("❌ Passwords do not match");
      return;
    }

    try {
      const res = await axios.post(
        "https://chat-application-xc15.onrender.com/register",
        { username, email, password, confirmpassword },
        { headers: { "Content-Type": "application/json" } }
      );
      alert(res.data);
      setData({ username: "", email: "", password: "", confirmpassword: "" });
    } catch (err) {
      console.error("❌ Registration Error:", err);
      if (err.response) {
        alert(`❌ ${err.response.data}`);
      } else {
        alert("⚠️ Server or network error");
      }
    }
  };

  return (
    <div>
      <center>
        <form onSubmit={submitHandler}>
          <h3>Register</h3>
          <input
            type="text"
            name="username"
            placeholder="User Name"
            value={data.username}
            onChange={changeHandler}
          />
          <br />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={data.email}
            onChange={changeHandler}
          />
          <br />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={data.password}
            onChange={changeHandler}
          />
          <br />
          <input
            type="password"
            name="confirmpassword"
            placeholder="Confirm Password"
            value={data.confirmpassword}
            onChange={changeHandler}
          />
          <br />
          <input type="submit" value="Register" />
        </form>
      </center>
    </div>
  );
};

export default Register;
