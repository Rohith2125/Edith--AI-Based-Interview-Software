import { useState } from "react";
import axios from "axios";

function Dashboard() {
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");

 async function startInterview() {

  //  Guardrail validation
  if (!role.trim() || !experience) {
    alert("Please enter role and experience before starting interview.");
    return;
  }

  try {
    const response = await axios.post(
      `${API_URL}/interview/start`,
      {
        role,
        experience: Number(experience),
      }
    );

    console.log("Backend response:", response.data);

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}


  return (
    <>
      <h1>Welcome to Dashboard 🚀</h1>

      <input
        type="text"
        placeholder="Enter role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />

      <input
        type="number"
        placeholder="Years of experience"
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
      />

      <button onClick={startInterview}>
        Ready for Interview
      </button>
    </>
  );
}

export default Dashboard;
