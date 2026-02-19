import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function ChatInterview() {
  const location = useLocation();
  const navigate = useNavigate();

  const { role, experience } = location.state || {};

  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
   const [completed, setCompleted] = useState(false);

  // 🔥 Auto start interview
  useEffect(() => {
    if (!role) {
      navigate("/");
      return;
    }

    startInterview();
  }, []);

  const startInterview = async () => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/interview/start",
        {
          role,
          experience: parseInt(experience)
        }
      );

      setMessages([
        { role: "assistant", content: res.data.question }
      ]);

      setLoading(false);

    } catch (err) {
      console.error(err);
    }
  };

  const submitAnswer = async () => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/a2fa980f-9157-4619-85d9-7bd7cd708e02", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "frontend/src/Pages/ChatInterview.jsx:submitAnswer",
        message: "chat_submit_attempt",
        data: {
          questionCount,
          completed,
          hasAnswer: !!answer.trim(),
        },
        timestamp: Date.now(),
        runId: "chat-pre-fix",
        hypothesisId: "CHAT1",
      }),
    }).catch(() => {});
    // #endregion

    if (completed || questionCount >= 10) {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/a2fa980f-9157-4619-85d9-7bd7cd708e02", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "frontend/src/Pages/ChatInterview.jsx:submitAnswer",
          message: "chat_submit_blocked_interview_completed",
          data: { questionCount, completed },
          timestamp: Date.now(),
          runId: "chat-pre-fix",
          hypothesisId: "CHAT2",
        }),
      }).catch(() => {});
      // #endregion
      return;
    }

    if (!answer.trim()) return;

    const updatedHistory = [
      ...messages,
      { role: "user", content: answer }
    ];

    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/interview/answer",
        {
          role,
          experience: parseInt(experience),
          history: updatedHistory,
          question_count: questionCount
        }
      );

      const nextQuestionCount = questionCount + 1;

      setMessages([
        ...updatedHistory,
        { role: "assistant", content: res.data.response }
      ]);

      setQuestionCount(nextQuestionCount);
      setAnswer("");
      setLoading(false);

      // After answering the 10th question, mark as completed immediately
      // This prevents any further questions from being asked
      if (nextQuestionCount >= 10) {
        setCompleted(true);
      }

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

      <h1 className="text-3xl font-bold mb-6">
        💬 Chat Interview
      </h1>
      <div className="flex items-center gap-4 mb-4">
        <p className="text-sm text-gray-500">
          Role: {role} | Experience: {experience} years
        </p>
        <span className="text-sm font-semibold text-blue-600">
          Question {Math.min(questionCount + 1, 10)} of 10
          {completed && " (Completed)"}
        </span>
      </div>


      <div className="w-full max-w-2xl bg-white shadow-xl rounded-xl p-6 space-y-4">

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              msg.role === "assistant"
                ? "bg-blue-100 text-blue-900"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <p className="text-gray-500 text-sm">
            AI thinking...
          </p>
        )}

      </div>

      <div className="w-full max-w-2xl mt-6 flex gap-3">

        <textarea
          rows="3"
          placeholder={completed || questionCount >= 10 ? "Interview completed. Final summary displayed above." : `Answer Question ${questionCount + 1}...`}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={loading || completed || questionCount >= 10}
          className="flex-1 border rounded-lg p-3 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        <button
          onClick={submitAnswer}
          disabled={loading || completed || questionCount >= 10}
          className="px-6 py-3 bg-black text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Send
        </button>

      </div>

      {completed && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800">
            ✅ Interview Completed
          </p>
          <p className="text-sm text-green-700 mt-1">
            You have answered all 10 questions. Review the final summary above.
          </p>
        </div>
      )}

    </div>
  );
}

export default ChatInterview;
