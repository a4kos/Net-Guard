import os
from openai import AsyncOpenAI

# 1. Initialize the Client with a Groq-compatible model
# Tip: Hardcode for your project or use a fallback string

api_key = os.environ.get('gsk_...HLyl') or ("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")

client = AsyncOpenAI(
    api_key=api_key,
    base_url="https://api.groq.com/openai/v1",
)


async def generate_text(prompt: str) -> str:
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": "You are a cybersecurity expert. "
                "Analyze browser extension threats and provide a 3-sentence summary: "
                "Risk, Impact, and Recommendation."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.3
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as e:
        print(f"AI API Error: {e}")
        return "AI analysis unavailable." 