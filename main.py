import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import ollama

from auth       import verify_password, create_token, verify_token
from characters import CHARACTER_PROMPTS, WHITEBEARD_PROMPT
from router     import route_character, build_system_prompt
from rag        import load_knowledge, query_knowledge, is_rag_available

load_dotenv()

# ── CONFIG ──────────────────────────────────────────────────────
MODEL_NAME   = os.getenv("MODEL_NAME", "llama3:8b-instruct-q4_0")
OLLAMA_URL   = os.getenv("OLLAMA_URL", "http://localhost:11434")

# ── STARTUP & SHUTDOWN ───────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup — load knowledge base
    print("=" * 50)
    print("Straw Hat Agent Backend Starting...")
    print(f"Model: {MODEL_NAME}")
    print("=" * 50)

    rag_loaded = load_knowledge()
    if rag_loaded:
        print("RAG: Knowledge base loaded")
    else:
        print("RAG: Running without personal knowledge (add .md files to /knowledge)")

    print("Backend ready! Crew is standing by.")
    print("=" * 50)
    yield
    print("Backend shutting down. See you Nakama!")

# ── APP ──────────────────────────────────────────────────────────
app = FastAPI(
    title    = "Straw Hat Agent API",
    version  = "1.0.0",
    lifespan = lifespan
)

# Allow Electron frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── REQUEST MODELS ───────────────────────────────────────────────
class LoginRequest(BaseModel):
    password: str

class ChatRequest(BaseModel):
    message:   str
    character: str = "auto"   # "auto" = let router decide, or specific crew id

class ConversationRequest(BaseModel):
    messages:  list  # full conversation history for multi-turn
    character: str = "auto"

# ── ROUTES ──────────────────────────────────────────────────────

# ── HEALTH CHECK ─────────────────────────────────────────────────
@app.get("/health")
async def health():
    """Check if backend is running"""
    return {
        "status":      "online",
        "model":       MODEL_NAME,
        "rag_enabled": is_rag_available(),
        "crew":        "standing by"
    }

# ── LOGIN ─────────────────────────────────────────────────────────
@app.post("/login")
async def login(request: LoginRequest):
    """
    Verify the spoken or typed password.
    Returns JWT token if correct.
    Whitebeard guards this gate.
    """
    if verify_password(request.password):
        token = create_token()
        return {
            "token":   token,
            "message": "GURARARARA!! That's my son!! Welcome aboard!!",
            "crew":    "ready"
        }
    else:
        raise HTTPException(
            status_code = 401,
            detail      = "...Disappointed. A man who lies to his father is no son of mine."
        )

# ── CHAT ──────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(
    request: ChatRequest,
    token:   dict = Depends(verify_token)
):
    """
    Main chat endpoint.
    1. Routes message to correct crew member
    2. Queries RAG for personal context
    3. Sends to Ollama with character prompt
    4. Returns reply in character's voice
    """

    message   = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Empty message")

    # Step 1 — Route to correct crew member
    character = route_character(
        message,
        forced_character = None if request.character == "auto" else request.character
    )

    # Step 2 — Get personal context from RAG
    rag_context = query_knowledge(message, character)

    # Step 3 — Build system prompt with character + personal context
    system_prompt = build_system_prompt(
        character    = character,
        system_prompt= CHARACTER_PROMPTS.get(character, CHARACTER_PROMPTS["luffy"]),
        rag_context  = rag_context
    )

    # Step 4 — Call Ollama
    try:
        response = ollama.chat(
            model    = MODEL_NAME,
            messages = [
                {"role": "system",  "content": system_prompt},
                {"role": "user",    "content": message}
            ],
            options  = {
                "temperature": 0.85,   # slightly creative for personality
                "top_p":       0.9,
                "num_predict": 300,    # max tokens — keep replies concise
            }
        )

        reply = response["message"]["content"].strip()

        return {
            "reply":     reply,
            "character": character,
            "rag_used":  bool(rag_context)
        }

    except Exception as e:
        print(f"Ollama error: {e}")
        raise HTTPException(
            status_code = 500,
            detail      = f"Ollama connection failed: {str(e)}. Make sure Ollama is running."
        )

# ── MULTI-TURN CHAT ───────────────────────────────────────────────
@app.post("/chat/conversation")
async def chat_conversation(
    request: ConversationRequest,
    token:   dict = Depends(verify_token)
):
    """
    Multi-turn conversation endpoint.
    Sends full conversation history to maintain context.
    Use this for longer conversations within same character.
    """

    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Get the last user message for routing
    last_user_msg = next(
        (m["content"] for m in reversed(request.messages) if m["role"] == "user"),
        ""
    )

    # Route character
    character = route_character(
        last_user_msg,
        forced_character = None if request.character == "auto" else request.character
    )

    # Get RAG context
    rag_context = query_knowledge(last_user_msg, character)

    # Build system prompt
    system_prompt = build_system_prompt(
        character     = character,
        system_prompt = CHARACTER_PROMPTS.get(character, CHARACTER_PROMPTS["luffy"]),
        rag_context   = rag_context
    )

    # Build messages with system prompt
    ollama_messages = [{"role": "system", "content": system_prompt}]
    ollama_messages += request.messages

    try:
        response = ollama.chat(
            model    = MODEL_NAME,
            messages = ollama_messages,
            options  = {
                "temperature": 0.85,
                "top_p":       0.9,
                "num_predict": 400,
            }
        )

        reply = response["message"]["content"].strip()

        return {
            "reply":     reply,
            "character": character,
            "rag_used":  bool(rag_context)
        }

    except Exception as e:
        print(f"Ollama error: {e}")
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")

# ── RAG STATUS ────────────────────────────────────────────────────
@app.get("/rag/status")
async def rag_status(token: dict = Depends(verify_token)):
    """Check if personal knowledge base is loaded"""
    return {
        "rag_enabled": is_rag_available(),
        "message":     "Knowledge base loaded" if is_rag_available()
                       else "No knowledge files found — add .md files to /knowledge folder"
    }

# ── RELOAD RAG ────────────────────────────────────────────────────
@app.post("/rag/reload")
async def reload_rag(token: dict = Depends(verify_token)):
    """Reload knowledge base — call this after adding new .md files"""
    success = load_knowledge()
    return {
        "success": success,
        "message": "Knowledge base reloaded!" if success else "Reload failed — check /knowledge folder"
    }

# ── CREW INFO ─────────────────────────────────────────────────────
@app.get("/crew")
async def get_crew():
    """Get list of all crew members and their domains"""
    crew = [
        {"id": "luffy",   "name": "Monkey D. Luffy",   "domain": "General & motivation",      "emoji": "☠"},
        {"id": "zoro",    "name": "Roronoa Zoro",       "domain": "Skills & learning",          "emoji": "⚔"},
        {"id": "nami",    "name": "Nami",               "domain": "Career & travel",            "emoji": "🗺"},
        {"id": "usopp",   "name": "Usopp",              "domain": "Ideas & creativity",         "emoji": "🎯"},
        {"id": "sanji",   "name": "Sanji",              "domain": "Food & nutrition",           "emoji": "🍳"},
        {"id": "chopper", "name": "Tony Tony Chopper",  "domain": "Health & wellness",          "emoji": "🩺"},
        {"id": "robin",   "name": "Nico Robin",         "domain": "Research & knowledge",       "emoji": "📚"},
        {"id": "franky",  "name": "Franky",             "domain": "Tech & automation",          "emoji": "🔧"},
        {"id": "brook",   "name": "Brook",              "domain": "Mood & entertainment",       "emoji": "🎵"},
        {"id": "jinbe",   "name": "Jinbe",              "domain": "Schedule & productivity",    "emoji": "🌊"},
    ]
    return {"crew": crew}

# ── TEST CHARACTER ─────────────────────────────────────────────────
@app.post("/test/{character}")
async def test_character(character: str):
    """
    Test any character without auth — for development only.
    Remove this in production.
    """
    if character not in CHARACTER_PROMPTS:
        raise HTTPException(status_code=404, detail=f"Character '{character}' not found")

    try:
        response = ollama.chat(
            model    = MODEL_NAME,
            messages = [
                {"role": "system",  "content": CHARACTER_PROMPTS[character]},
                {"role": "user",    "content": "Introduce yourself in 2 sentences"}
            ],
            options  = {"temperature": 0.85, "num_predict": 150}
        )

        return {
            "character": character,
            "reply":     response["message"]["content"].strip()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
