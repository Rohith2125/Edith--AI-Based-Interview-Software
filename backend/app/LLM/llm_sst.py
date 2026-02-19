from groq import Groq
from app.config.settings import GROQ_API_KEY


def transcribe_audio(file_bytes: bytes, filename: str, mime_type: str | None = None):

    # region agent log
    # Hypothesis H_env: GROQ_API_KEY is missing/falsey and we fail before reaching previous logs.
    try:
        import json
        import time

        with open("/Users/rohith/Desktop/Edith/.cursor/debug.log", "a") as f:
            f.write(
                json.dumps(
                    {
                        "id": f"log_{int(time.time() * 1000)}_env_check",
                        "timestamp": int(time.time() * 1000),
                        "location": "app/LLM/llm_sst.py:transcribe_audio",
                        "message": "transcribe_audio_before_env_check",
                        "data": {
                            "has_groq_key": bool(GROQ_API_KEY),
                        },
                        "runId": "pre-fix-2",
                        "hypothesisId": "H_env",
                    }
                )
                + "\n"
            )
    except Exception:
        # Logging must never break the main flow
        pass
    # endregion

    if not GROQ_API_KEY:
        # region agent log
        try:
            import json
            import time

            with open("/Users/rohith/Desktop/Edith/.cursor/debug.log", "a") as f:
                f.write(
                    json.dumps(
                        {
                            "id": f"log_{int(time.time() * 1000)}_missing_key",
                            "timestamp": int(time.time() * 1000),
                            "location": "app/LLM/llm_sst.py:transcribe_audio",
                            "message": "missing_groq_api_key",
                            "data": {},
                            "runId": "pre-fix-2",
                            "hypothesisId": "H_env",
                        }
                    )
                    + "\n"
                )
        except Exception:
            pass
        # endregion
        raise ValueError("Missing GROQ_API_KEY")

    # Decide on an effective filename with a supported extension for Groq Whisper.
    allowed_extensions = (
        "flac",
        "mp3",
        "mp4",
        "mpeg",
        "mpga",
        "m4a",
        "ogg",
        "opus",
        "wav",
        "webm",
    )

    original_filename = filename or "blob"
    ext = None
    if "." in original_filename:
        ext = original_filename.rsplit(".", 1)[1].lower()

    if ext not in allowed_extensions:
        # Try to infer from MIME type like "audio/webm"
        if mime_type:
            try:
                mt_ext = mime_type.split("/")[-1].lower()
                if mt_ext in allowed_extensions:
                    ext = mt_ext
            except Exception:
                ext = None

        # Fallback to a safe default if still unknown.
        if not ext:
            ext = "webm"

    effective_filename = (
        original_filename
        if "." in original_filename and ext in allowed_extensions
        else f"audio.{ext}"
    )

    # region agent log
    try:
        import json
        import time

        with open("/Users/rohith/Desktop/Edith/.cursor/debug.log", "a") as f:
            f.write(
                json.dumps(
                    {
                        "id": f"log_{int(time.time() * 1000)}_sst_entry",
                        "timestamp": int(time.time() * 1000),
                        "location": "app/LLM/llm_sst.py:transcribe_audio",
                        "message": "transcribe_audio_entry",
                        "data": {
                            "original_filename": original_filename,
                            "effective_filename": effective_filename,
                            "mime_type": mime_type,
                            "file_bytes_len": len(file_bytes)
                            if isinstance(file_bytes, (bytes, bytearray))
                            else None,
                            "file_bytes_type": type(file_bytes).__name__,
                        },
                        "runId": "pre-fix",
                        "hypothesisId": "H1",
                    }
                )
                + "\n"
            )
    except Exception:
        # Logging must never break the main flow
        pass
    # endregion

    client = Groq(api_key=GROQ_API_KEY)

    # region agent log
    try:
        import json
        import time

        with open("/Users/rohith/Desktop/Edith/.cursor/debug.log", "a") as f:
            f.write(
                json.dumps(
                    {
                        "id": f"log_{int(time.time() * 1000)}_before_call",
                        "timestamp": int(time.time() * 1000),
                        "location": "app/LLM/llm_sst.py:transcribe_audio",
                        "message": "before_groq_transcription_call",
                        "data": {
                            "filename": filename,
                        },
                        "runId": "pre-fix",
                        "hypothesisId": "H2",
                    }
                )
                + "\n"
            )
    except Exception:
        pass
    # endregion

    try:
        transcription = client.audio.transcriptions.create(
            file=(effective_filename, file_bytes),
            model="whisper-large-v3",
            temperature=0,
        )
    except Exception as e:
        # region agent log
        try:
            import json
            import time

            with open("/Users/rohith/Desktop/Edith/.cursor/debug.log", "a") as f:
                f.write(
                    json.dumps(
                        {
                            "id": f"log_{int(time.time() * 1000)}_exception",
                            "timestamp": int(time.time() * 1000),
                            "location": "app/LLM/llm_sst.py:transcribe_audio",
                            "message": "groq_transcription_exception",
                            "data": {
                                "error_type": type(e).__name__,
                                "error_str": str(e),
                            },
                            "runId": "pre-fix",
                            "hypothesisId": "H3",
                        }
                    )
                    + "\n"
                )
        except Exception:
            pass
        # endregion
        raise

    return transcription.text
