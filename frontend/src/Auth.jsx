import { useState } from "react";
import supabase from "../api/supabase";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [mail, setMail] = useState("");
  const [pass, setPass] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: pass,
      });

      if (error) alert(error.message);
      else alert("Logged in!");
    } else {
      const { error } = await supabase.auth.signUp({
        email: mail,
        password: pass,
      });

      if (error) alert(error.message);
      else alert("Registered!");
    }
  }

  return (
    <div>
      <h2>{isLogin ? "Login" : "Register"}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />

        <button type="submit">
          {isLogin ? "Login" : "Register"}
        </button>
      </form>

      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer" }}>
        {isLogin
          ? "Don't have an account? Register"
          : "Already have an account? Login"}
      </p>
    </div>
  );
}

export default Auth;
