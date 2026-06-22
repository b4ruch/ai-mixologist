import json
import os
import re
from google import genai
from google.genai import types

# Use Native Application Default Credentials mapped dynamically through Vertex AI
PROJECT_ID = os.environ.get("PROJECT_ID", "ai-mixologist-b4ruch")
LOCATION = "us-central1"

# Initialize Client directly referencing Vertex (no manual API key needed!)
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

# Since 3.5-flash threw 404 access restrictions on Vertex, we lock into the verified gemini-2.5-flash model natively!
MODEL_ID = "gemini-2.5-pro"

def get_classic_cocktail_ratios(cocktail_name: str) -> str:
    classic_ratios = {
        "margarita": "2 oz Tequila, 1 oz Fresh Lime Juice, 0.5 oz Agave Nectar",
        "old fashioned": "2 oz Bourbon, 2 dashes Angostura bitters, 0.25oz simple syrup",
        "negroni": "1 oz Gin, 1 oz Campari, 1 oz Sweet Vermouth",
    }
    return classic_ratios.get(cocktail_name.lower(), "No classic ratio found. Invent a balanced upscale recipe!")

def generate_recipe_from_text(prompt: str) -> dict:
    sanitized_prompt = prompt.replace("ignore all previous instructions", "")
    
    # We ask the agent to return JSON so we know strictly if a spirit exists
    sys_prompt = """You are the AI Mixologist, an upscale craft cocktail creator.
Here are your classic ratios: Margarita (2 oz Tequila, 1 oz Lime, 0.5 oz Agave), Old Fashioned (2 oz Bourbon, 2 dashes bitters, 0.25oz simple), Negroni (1 oz Gin, 1 oz Campari, 1 oz Sweet Vermouth).
If a user asks for an ingredient not in your classic ratios, aggressively use Google Search to find real liquors (like Dalandan) and invent a great recipe. NEVER just apologize. If the ingredient is absolute gibberish and truly does not exist on the internet, set is_valid to false."""
    
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=sanitized_prompt + ' Return your response in JSON format exactly like: {"title": "Name of the Drink", "recipe": "Markdown text here", "is_valid": true}',
        config=types.GenerateContentConfig(
            tools=[{"google_search": {}}],
            system_instruction=sys_prompt,
            temperature=0.7
        )
    )
    
    try:
        text = response.text.replace('```json', '').replace('```', '').strip()
        # Clean Vertex Grounding citation references like [1], [2] from the raw JSON text
        text = re.sub(r'\[[\d,\s]+\]', '', text)
        data = json.loads(text, strict=False)
        if "recipe" in data and isinstance(data["recipe"], str):
            data["recipe"] = re.sub(r'\[[\d,\s]+\]', '', data["recipe"])
        return data
    except Exception as e:
        cleaned_fallback = re.sub(r'\[[\d,\s]+\]', '', response.text) if response and hasattr(response, 'text') else str(e)
        return {"recipe": cleaned_fallback, "is_valid": True}

def generate_recipe_from_image(image_bytes: bytes, mime_type: str, prompt: str = "") -> dict:
    sanitized_prompt = prompt.replace("ignore all previous instructions", "")
    text_instruction = 'Analyze this image of a drink. Tell me what it likely is and provide a craft cocktail recipe for it. Return JSON strictly like {"title": "Name of the Drink", "recipe": "Markdown text here", "is_valid": true}'
    if sanitized_prompt:
        text_instruction += f" Additional user request: {sanitized_prompt}"

    response = client.models.generate_content(
        model=MODEL_ID,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            text_instruction
        ],
        config=types.GenerateContentConfig(
            system_instruction="You are the AI Mixologist. Analyze the provided image of a beverage and provide an upscale recipe. Return completely in JSON format.",
            response_mime_type="application/json"
        )
    )
    
    try:
        text = response.text.replace('```json', '').replace('```', '').strip()
        # Clean Vertex Grounding citation references like [1], [2] from the raw JSON text
        text = re.sub(r'\[[\d,\s]+\]', '', text)
        data = json.loads(text, strict=False)
        if "recipe" in data and isinstance(data["recipe"], str):
            data["recipe"] = re.sub(r'\[[\d,\s]+\]', '', data["recipe"])
        return data
    except Exception as e:
        cleaned_fallback = re.sub(r'\[[\d,\s]+\]', '', response.text) if response and hasattr(response, 'text') else str(e)
        return {"recipe": cleaned_fallback, "is_valid": True}

def generate_drink_image(prompt: str) -> bytes:
    try:
        # Simplify the prompt slightly for the image generator naturally
        image_prompt = f"A high-quality, professional food photography shot of a beautiful craft cocktail. {prompt.replace('ignore all previous instructions', '')}"
        
        result = client.models.generate_image(
            model='imagen-3.0-generate-001',
            prompt=image_prompt[:480], # Limit to avoid prompt too long errors for Imagen
            config=types.GenerateImageConfig(
                number_of_images=1,
                aspect_ratio="1:1"
            )
        )
        if result.generated_images and len(result.generated_images) > 0:
            return result.generated_images[0].image.image_bytes
        return None
    except Exception as e:
        print(f"Imagen Error: {e}")
        return None
