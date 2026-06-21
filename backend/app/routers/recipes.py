import base64
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.models.database import Recipe, get_db
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
        
        # Convert image bytes to base64 so they can be saved in DB
        base64_str = base64.b64encode(image_bytes).decode('utf-8')
        image_url = f"data:{file.content_type};base64,{base64_str}"

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
            
        # The Vertex GenAI returning image_bytes for Imagen is already base64 encoded as bytes!
        # So we just decode the bytes to utf-8 string, no double-encoding needed!
        # We also need to specify it natively returns a PNG format. 
        try:
            base64_str = image_bytes.decode('utf-8')
        except:
            base64_str = base64.b64encode(image_bytes).decode('utf-8')
            
        image_url = f"data:image/png;base64,{base64_str}"
        
        # Here: Logic to save to bucket/DB for Registered users goes here!
        # Temporal for guests just returns the base64!
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
def save_recipe(request: RecipeSaveRequest, db: Session = Depends(get_db)):
    db_recipe = Recipe(
        user_id=request.user_id,
        title=request.title,
        prompt=request.prompt,
        content=request.content,
        image_url=request.image_url
    )
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return {"status": "success", "id": db_recipe.id}

@router.get("/recipes/history/{user_id}")
def get_history(user_id: int, db: Session = Depends(get_db)):
    recipes = db.query(Recipe).filter(Recipe.user_id == user_id).order_by(Recipe.id.desc()).all()
    # We return the exact mocked structure but parsed dynamically
    history = []
    for r in recipes:
        history.append({
            "id": r.id,
            "title": r.title,
            "prompt": r.prompt,
            "content": r.content,
            "isImage": False,
            "imageUrl": r.image_url
        })
    return {"history": history}

@router.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
    return {"status": "deleted"}


class RecipeImageUpdateRequest(BaseModel):
    image_url: str

@router.put("/recipes/{recipe_id}/image")
def update_recipe_image(recipe_id: int, request: RecipeImageUpdateRequest, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.image_url = request.image_url
    db.commit()
    return {"status": "success"}
