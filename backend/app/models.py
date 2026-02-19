from pydantic import BaseModel
from typing import List


class Message(BaseModel):
    role: str
    content: str


class InterviewStartRequest(BaseModel):
    role: str
    experience: int
    

class InterviewAnswerRequest(BaseModel):
    role: str
    experience: int
    history: List[Message]
    question_count: int
