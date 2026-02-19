import { Routes, Route } from "react-router-dom";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Interview from "./Pages/Interview";
import ChatInterview from "./Pages/ChatInterview";
import VoiceInterview from "./Pages/VoiceInterview";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/chat" element={<ChatInterview />} />
      <Route path="/voice" element={<VoiceInterview />} />
    </Routes>
  );
}

export default App;
