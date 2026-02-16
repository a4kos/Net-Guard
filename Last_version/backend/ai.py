import os
from openai import AsyncOpenAI

# 1. Initialize the Client with a Groq-compatible model
# Tip: Hardcode for your project or use a fallback string

api_key = os.environ.get('gsk_...Jni4') or ("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")

client = AsyncOpenAI(
    api_key=api_key,
    base_url="https://console.groq.com/keys",
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