from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Union

# Import our new GCP services
from app.services.gcp_service import (
    upload_image_to_gcs,
    save_recipe_to_firestore,
    get_recipes_by_user,
    delete_recipe_from_firestore,
    update_recipe_image_in_firestore
)

from app.services.ai_agent import generate_recipe_from_text, generate_recipe_from_image, generate_drink_image

router = APIRouter()

class RecipeRequest(BaseModel):
    prompt: str

@router.post("/recipes/generate")
def create_recipe(request: RecipeRequest):
    """
    Endpoint for text-only recipe generation.
    """
    try:
        if not request.prompt or len(request.prompt.strip()) == 0:
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
            
        recipe_data = generate_recipe_from_text(request.prompt)
        return {
            "title": recipe_data.get("title", ""),
            "recipe": recipe_data.get("recipe", ""),
            "is_valid": recipe_data.get("is_valid", True)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recipes/upload")
async def upload_and_generate(file: UploadFile = File(...), prompt: Optional[str] = Form("")):
    """
    Endpoint for Multi-Modal (Image + Optional Text) recipe generation.
    """
    try:
        # Read the file bytes
        image_bytes = await file.read()
        
        # Verify it's an image
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
            
        recipe_data = generate_recipe_from_image(image_bytes, file.content_type, prompt)
        
        # Upload image to Google Cloud Storage instead of Base64
        try:
            image_url = upload_image_to_gcs(image_bytes, file.content_type)
        except Exception as bucket_err:
            print(f"Bucket upload failed: {bucket_err}, falling back to null image.")
            image_url = None

        return {
            "title": recipe_data.get("title", "Custom Drink"),
            "recipe": recipe_data.get("recipe", ""),
            "is_valid": recipe_data.get("is_valid", True),
            "filename": file.filename,
            "image_url": image_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ImageGenerateRequest(BaseModel):
    prompt: str
    recipe: str

@router.post("/recipes/generate-image")
def create_recipe_image(request: ImageGenerateRequest):
    """
    Endpoint for generating an image from a finished recipe.
    """
    try:
        if not request.prompt and not request.recipe:
            raise HTTPException(status_code=400, detail="Missing context for image generation")
            
        clean_recipe = request.recipe.replace("\n", " ").strip()
        combined_prompt = f"Make sure you include the exact visual ingredients. Drink context: {request.prompt}. Theme and Ingredients: {clean_recipe[:350]}"
        image_bytes = generate_drink_image(combined_prompt)
        
        if not image_bytes:
            raise HTTPException(status_code=500, detail="Image generation failed.")
            
        # Upload AI image to Google Cloud Storage
        try:
            image_url = upload_image_to_gcs(image_bytes, "image/png")
        except Exception as bucket_err:
            print(f"Bucket upload failed: {bucket_err}")
            raise HTTPException(status_code=500, detail="Failed to save image to cloud storage.")
            
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RecipeSaveRequest(BaseModel):
    user_id: int
    title: str
    prompt: Optional[str] = ""
    content: str
    image_url: Optional[str] = None

@router.post("/recipes/save")
def save_recipe(request: RecipeSaveRequest):
    try:
        # Save to Google Cloud Firestore instead of SQL
        doc_id = save_recipe_to_firestore(
            user_id=request.user_id,
            title=request.title,
            prompt=request.prompt,
            content=request.content,
            image_url=request.image_url
        )
        return {"status": "success", "id": str(doc_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recipes/history/{user_id}")
def get_history(user_id: int):
    try:
        # Fetch from Google Cloud Firestore
        history = get_recipes_by_user(user_id)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: str):
    try:
        delete_recipe_from_firestore(recipe_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RecipeImageUpdateRequest(BaseModel):
    image_url: str

@router.put("/recipes/{recipe_id}/image")
def update_recipe_image(recipe_id: str, request: RecipeImageUpdateRequest):
    try:
        update_recipe_image_in_firestore(recipe_id, request.image_url)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
