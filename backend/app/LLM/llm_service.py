from groq import Groq
from app.config.settings import GROQ_API_KEY


def get_client():
    if not GROQ_API_KEY:
        raise ValueError("Missing GROQ_API_KEY")
    return Groq(api_key=GROQ_API_KEY)

def _interviewer_system_prompt(role: str, experience: int) -> str:
    return f"""\
You are EDITH, a senior technical interviewer.

## Context
- Target role: {role}
- Candidate experience: {experience} years

## Objectives
- Run a structured, realistic technical interview.
- Ask exactly ONE question at a time and wait for the candidate's answer.
- Keep the interview aligned to the target role and experience level.

## Style guidelines
- Be concise, direct, and professional.
- Prefer practical, job-relevant questions over trivia.
- Avoid multi-part questions. If you need multiple aspects, ask the most important one first.
- Output ONLY plain text - no JSON, no markdown formatting, no code blocks.
- Write naturally as if speaking to the candidate.

## Output format
- For the first question: Output ONLY the question text (one clear sentence ending with a question mark).
- For subsequent questions: First provide a brief comment (1-2 sentences) on the candidate's previous answer, then ask the next question. Format: "[Brief comment on previous answer]. [Next question]"
"""


def generate_first_question(role: str, experience: int):

    client = get_client()

    messages = [
        {
            "role": "system",
            "content": _interviewer_system_prompt(role=role, experience=experience)
        },
        {
            "role": "user",
            "content": "Start the interview now. Ask the first technical question. Output ONLY the question text, no JSON, no formatting."
        }
    ]

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.7,
    )

    response_text = completion.choices[0].message.content.strip()
    # Remove any accidental JSON formatting or markdown if present
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1]) if len(lines) > 2 else response_text
    return response_text


def evaluate_and_continue(role: str, experience: int, history: list):

    client = get_client()

    messages = [
        {
            "role": "system",
            "content": _interviewer_system_prompt(role=role, experience=experience)
        }
    ]

    messages.extend(history)

    # Instruct to comment on previous answer and ask next question in plain text
    messages.append(
        {
            "role": "user",
            "content": "Briefly comment on my most recent answer (1-2 sentences), then ask the next single technical question. Output ONLY plain text - no JSON, no markdown, no formatting. Format: '[Brief comment]. [Next question]'",
        }
    )

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.7,
    )

    response_text = completion.choices[0].message.content.strip()
    # Remove any accidental JSON formatting or markdown if present
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1]) if len(lines) > 2 else response_text
    return response_text


def generate_final_summary(role: str, experience: int, history: list):

    client = get_client()

    messages = [
        {
            "role": "system",
            "content": f"""\
You are EDITH, a senior technical interviewer providing a final interview summary.

## Context
- Target role: {role}
- Candidate experience: {experience} years

## Task
Review the entire conversation history and provide a comprehensive final evaluation summary.

## Output format
Provide a structured summary in plain text (no JSON, no markdown) covering:
1. Overall assessment (2-3 sentences)
2. Key strengths demonstrated (2-3 bullet points or sentences)
3. Areas for improvement (2-3 bullet points or sentences)
4. Final score out of 10
5. Recommendation (hire/not hire/conditional)

Be professional, constructive, and specific. Reference specific answers from the conversation.
"""
        }
    ]

    messages.extend(history)

    messages.append(
        {
            "role": "user",
            "content": "The interview is complete. Provide the final evaluation summary based on all answers given. Output ONLY plain text - no JSON, no markdown formatting."
        }
    )

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.7,
    )

    response_text = completion.choices[0].message.content.strip()
    # Remove any accidental JSON formatting or markdown if present
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1]) if len(lines) > 2 else response_text
    return response_text
