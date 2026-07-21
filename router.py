from characters import CREW_KEYWORDS

# ── CHARACTER ROUTER ─────────────────────────────────────────────
def route_character(message: str, forced_character: str = None) -> str:
    """
    Detects which crew member should handle this message.

    Priority order:
    1. If frontend forced a specific character — use that
    2. Keyword matching — find best crew member for the topic
    3. Default to Luffy for anything unmatched

    Returns character id string e.g. "zoro", "nami", "luffy"
    """

    # If user clicked a specific crew member on frontend
    if forced_character and forced_character in CREW_KEYWORDS:
        return forced_character

    # Keyword matching — check message against each crew's keywords
    message_lower = message.lower()

    # Score each character by how many keywords match
    scores = {}
    for character, keywords in CREW_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in message_lower)
        if score > 0:
            scores[character] = score

    # Return the character with the highest score
    if scores:
        return max(scores, key=scores.get)

    # Default — Luffy handles everything else
    return "luffy"


# ── CONTEXT INJECTOR ─────────────────────────────────────────────
def build_system_prompt(character: str, system_prompt: str, rag_context: str = None) -> str:
    """
    Builds the final system prompt by combining:
    1. Character personality prompt
    2. RAG context about the user (if available)
    3. Instructions to stay in character

    This is what gets sent to Ollama as the system message.
    """

    prompt_parts = [system_prompt]

    # Inject personal context from RAG if available
    if rag_context and rag_context.strip():
        prompt_parts.append(f"""
PERSONAL CONTEXT ABOUT YOUR NAKAMA:
{rag_context}

Use this information to give personalized advice.
Reference their specific skills, goals, and situation naturally.
Do not repeat this context back verbatim — weave it naturally into your response.
""")

    # Final instructions to keep response quality high
    prompt_parts.append("""
RESPONSE RULES:
- Stay completely in character — speak ONLY in your character's voice and slang
- Keep responses concise — maximum 5 sentences unless a detailed list is needed
- Never break character or say you are an AI
- Never say "As an AI language model..."
- Respond directly to what the user said
- Use your character's exact catchphrases naturally
- If asked something outside your domain, still answer in character but suggest the right crew member
""")

    return "\n".join(prompt_parts)
