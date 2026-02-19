from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi import Body
from app.models import InterviewStartRequest,InterviewAnswerRequest
from app.LLM.llm_service import generate_first_question, evaluate_and_continue, generate_final_summary
from app.LLM.llm_sst import transcribe_audio


load_dotenv()
app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

allow_origins_list = ["http://localhost:5173"]  # For local testing

if FRONTEND_URL != "http://localhost:5173":
    allow_origins_list.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "EDITH Backend Running 🚀"}


# 🎤 STT Endpoint
@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):

    file_bytes = await file.read()

    text = transcribe_audio(
        file_bytes=file_bytes,
        filename=file.filename,
        mime_type=file.content_type,
    )

    return {"text": text}


# 🚀 Start Interview
@app.post("/interview/start")
def start_interview(data: InterviewStartRequest):

    question = generate_first_question(
        role=data.role,
        experience=data.experience
    )

    return {"question": question}


# 🔄 Continue Interview
@app.post("/interview/answer")
def answer_interview(data: InterviewAnswerRequest):

    # End condition - generate final summary after 10 questions
    if data.question_count >= 9:
        summary = generate_final_summary(
            role=data.role,
            experience=data.experience,
            history=[msg.dict() for msg in data.history]
        )
        return {"response": summary}

    result = evaluate_and_continue(
        role=data.role,
        experience=data.experience,
        history=[msg.dict() for msg in data.history]
    )

    return {"response": result}