import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Interview() {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const navigate = useNavigate();

  const goToVoice = () => {
    if (!role || !experience) {
      alert("Enter role and experience");
      return;
    }

    navigate("/voice", {
      state: { role, experience }
    });
  };

  const goToChat = () => {
    if (!role || !experience) {
      alert("Enter role and experience");
      return;
    }

    navigate("/chat", {
      state: { role, experience }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <input
        className="border p-3 rounded-lg"
        placeholder="Role"
        onChange={(e) => setRole(e.target.value)}
      />

      <input
        className="border p-3 rounded-lg"
        type="number"
        placeholder="Experience"
        onChange={(e) => setExperience(e.target.value)}
      />

      <div className="flex gap-6 mt-4">
        <button
          onClick={goToChat}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg"
        >
          💬 Chat Interview
        </button>

        <button
          onClick={goToVoice}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg"
        >
          🎙 Voice Interview
        </button>
      </div>
    </div>
  );
}

export default Interview;
