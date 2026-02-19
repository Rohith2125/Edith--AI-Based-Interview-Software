import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

function VoiceInterview() {
  const location = useLocation();
  const { role, experience } = location.state || {};

  const [voiceState, setVoiceState] = useState("thinking");
  const [messages, setMessages] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(false);

  // Sync ref with state whenever questionCount changes
  useEffect(() => {
    questionCountRef.current = questionCount;
  }, [questionCount]);

  const hasStartedRef = useRef(false);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const speakTokenRef = useRef(0);
  const completedRef = useRef(false);
  const questionCountRef = useRef(0);

  useEffect(() => {
    if (!role) return;
    if (hasStartedRef.current) return; // prevent StrictMode double-invoke from double-starting
    hasStartedRef.current = true;

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/a2fa980f-9157-4619-85d9-7bd7cd708e02", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "frontend/src/Pages/VoiceInterview.jsx:useEffect(start)",
        message: "voice_interview_startInterview_called",
        data: { hasRole: !!role, experience },
        timestamp: Date.now(),
        runId: "pre-fix",
        hypothesisId: "UI1",
      }),
    }).catch(() => {});
    // #endregion

    startInterview();
  }, [role, experience]);

  useEffect(() => {
    let interval;

    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0 && timerActive) {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/a2fa980f-9157-4619-85d9-7bd7cd708e02", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "frontend/src/Pages/VoiceInterview.jsx:useEffect(timer)",
          message: "timer_auto_stop_triggered",
          data: { timeLeft, timerActive },
          timestamp: Date.now(),
          runId: "pre-fix",
          hypothesisId: "UI5",
        }),
      }).catch(() => {});
      // #endregion
      setTimerActive(false); // make stopRecording idempotent (prevents repeated stop calls)
      stopRecording(); // auto stop
    }

    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);


  const startInterview = async () => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/interview/start",
        {
          role,
          experience: parseInt(experience)
        }
      );

      const firstQuestion = res.data.question;

      setMessages([{ role: "assistant", content: firstQuestion }]);

      speak(firstQuestion);

    } catch (err) {
      console.error(err);
    }
  };

  const speak = (text) => {
    // Stop any active recording before speaking.
    stopRecording();

    // Cancel any queued speech to avoid "continuous speaking".
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }

    const token = ++speakTokenRef.current;

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/a2fa980f-9157-4619-85d9-7bd7cd708e02", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "frontend/src/Pages/VoiceInterview.jsx:speak",
        message: "tts_speak_called",
        data: {
          token,
          textLen: typeof text === "string" ? text.length : null,
          speechSpeaking: !!window.speechSynthesis?.speaking,
          speechPending: !!window.speechSynthesis?.pending,
        },
        timestamp: Date.now(),
        runId: "pre-fix",
        hypothesisId: "UI2",
      }),
    }).catch(() => {});
    // #endregion

    setVoiceState("speaking");

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onend = () => {
      if (speakTokenRef.current !== token) return; // ignore stale onend from a cancelled utterance

      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/a2fa980f-9157-4619-85d9-7bd7cd708e02", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "frontend/src/Pages/VoiceInterview.jsx:speak.onend",
          message: "tts_onend_start_listening",
          data: { token, questionCount },
          timestamp: Date.now(),
          runId: "pre-fix",
          hypothesisId: "UI3",
        }),
      }).catch(() => {});
      // #endregion

      // Don't start listening if we've completed 10 questions
      if (completedRef.current || questionCountRef.current >= 10) {
        setVoiceState("completed");
        completedRef.current = true;
        return;
      }

      setVoiceState("listening");
      startListening();
    };

    utterance.onerror = () => {
      if (speakTokenRef.current !== token) return;
      setVoiceState("listening");
      startListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  const startListening = async () => {
    // Prevent re-entrancy (multiple onend events / double-starts).
    if (recorderRef.current && recorderRef.current.state !== "inactive") return;

    // Don't start listening if we've completed 10 questions
    if (completedRef.current || questionCountRef.current >= 10) {
      setVoiceState("completed");
      completedRef.current = true;
      return;
    }

    setVoiceState("listening");
    setTimeLeft(20);
    setTimerActive(true);

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/a2fa980f-9157-4619-85d9-7bd7cd708e02", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "frontend/src/Pages/VoiceInterview.jsx:startListening",
        message: "start_listening_begin",
        data: {
          recorderState: recorderRef.current?.state ?? null,
        },
        timestamp: Date.now(),
        runId: "pre-fix",
        hypothesisId: "UI4",
      }),
    }).catch(() => {});
    // #endregion

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.onstop = async () => {
      setTimerActive(false);
      setVoiceState("thinking");

      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      // Provide a filename with a supported extension so backend STT accepts it.
      formData.append("file", blob, "audio.webm");

      // stop mic
      try {
        streamRef.current?.getTracks?.().forEach((t) => t.stop());
      } catch {
        // ignore
      }
      streamRef.current = null;
      recorderRef.current = null;

      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/a2fa980f-9157-4619-85d9-7bd7cd708e02", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "frontend/src/Pages/VoiceInterview.jsx:recorder.onstop",
          message: "recording_stopped_transcribe_request",
          data: { blobSize: blob.size, blobType: blob.type },
          timestamp: Date.now(),
          runId: "pre-fix",
          hypothesisId: "UI6",
        }),
      }).catch(() => {});
      // #endregion

      const transcribeRes = await axios.post(
        "http://127.0.0.1:8000/transcribe",
        formData
      );

      const userText = transcribeRes.data.text;

      setMessages(prevMessages => {
        const updatedHistory = [
          ...prevMessages,
          { role: "user", content: userText }
        ];

        handleLLM(updatedHistory);

        return updatedHistory;
      });
    };

    recorder.start();

    // store recorder globally so stopRecording can access
    window.currentRecorder = recorder;
  };


  const handleLLM = async (history) => {
    try {
      // Use ref to get current questionCount value (avoids closure issues)
      const currentQuestionCount = questionCountRef.current;
      
      // Check BEFORE making API call - if we've answered 10 questions, stop immediately
      if (completedRef.current || currentQuestionCount >= 10) {
        setVoiceState("completed");
        completedRef.current = true;
        return;
      }

      const llmRes = await axios.post(
        "http://127.0.0.1:8000/interview/answer",
        {
          role,
          experience: parseInt(experience),
          history: history,
          question_count: currentQuestionCount
        }
      );

      const aiResponse = llmRes.data.response;

      const nextQuestionCount = currentQuestionCount + 1;

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: aiResponse }
      ]);

      // Update both state and ref
      setQuestionCount(nextQuestionCount);
      questionCountRef.current = nextQuestionCount;

      // Only speak if we haven't reached the limit yet
      // After answering the 10th question, the backend returns a summary, not another question
      if (nextQuestionCount < 10) {
        speak(aiResponse);
      } else {
        // We've completed 10 questions - just show the summary, don't speak it
        setVoiceState("completed");
        completedRef.current = true;
      }

    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch {
      // ignore
    }
  };


  //   return (...)
  // }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">

      <h1 className="text-3xl font-bold mb-4">
        🎤 Voice Interview
      </h1>
      
      <div className="flex items-center gap-4 mb-6">
        <p className="text-sm text-gray-500">
          Role: {role} | Experience: {experience} years
        </p>
        <span className="text-sm font-semibold text-blue-600">
          Question {Math.min(questionCountRef.current + 1, 10)} of 10
          {voiceState === "completed" && " (Completed)"}
        </span>
      </div>

      <div
        className={`
          w-28 h-28 rounded-full flex items-center justify-center text-4xl
          ${voiceState === "listening" ? "bg-red-500 animate-pulse" :
            voiceState === "thinking" ? "bg-yellow-400 animate-bounce" :
              voiceState === "speaking" ? "bg-blue-500" :
                voiceState === "completed" ? "bg-green-500" :
                "bg-gray-400"}
          text-white transition-all duration-300
        `}
      >
        🎤
      </div>

      <p className="mt-6 text-xl font-medium">
        {voiceState === "listening" && "Listening..."}
        {voiceState === "thinking" && "Thinking..."}
        {voiceState === "speaking" && "AI Speaking..."}
        {voiceState === "completed" && "Interview Completed"}
      </p>
      
      <div className="w-64 h-2 bg-gray-300 rounded mt-3">
        <div
          className="h-2 bg-red-500 rounded transition-all duration-1000"
          style={{ width: `${(timeLeft / 20) * 100}%` }}
        />
      </div>

      {voiceState === "completed" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg max-w-md">
          <p className="text-sm font-semibold text-green-800">
            ✅ Interview Completed
          </p>
          <p className="text-sm text-green-700 mt-1">
            You have answered all 10 questions. Review the final summary in the conversation above.
          </p>
        </div>
      )}
    </div>
  );
}

export default VoiceInterview;
