import os
import uuid
from google.cloud import firestore, storage

# Initialize GCP clients
# We fall back to a default project ID if the env var isn't set
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "ai-mixologist-b4ruch")
BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME", f"{PROJECT_ID}-images")

# These clients will automatically use the default credential in Cloud Run
db = firestore.Client(project=PROJECT_ID)
storage_client = storage.Client(project=PROJECT_ID)
bucket = storage_client.bucket(BUCKET_NAME)

def upload_image_to_gcs(image_bytes: bytes, content_type: str) -> str:
    """Uploads image bytes to Google Cloud Storage and returns the public URL."""
    # Generate unique filename
    extension = "png"
    if "jpeg" in content_type or "jpg" in content_type:
        extension = "jpg"
    elif "webp" in content_type:
        extension = "webp"
        
    filename = f"{uuid.uuid4()}.{extension}"
    blob = bucket.blob(filename)
    
    # Upload from string/bytes
    blob.upload_from_string(image_bytes, content_type=content_type)
    
    # Return the public URL
    return f"https://storage.googleapis.com/{BUCKET_NAME}/{filename}"

def save_recipe_to_firestore(user_id: int, title: str, prompt: str, content: str, image_url: str = None) -> str:
    """Saves a recipe to Cloud Firestore."""
    recipes_ref = db.collection("recipes")
    
    data = {
        "user_id": user_id,
        "title": title,
        "prompt": prompt,
        "content": content,
        "image_url": image_url,
        "created_at": firestore.SERVER_TIMESTAMP
    }
    
    # Add a new doc
    doc_ref = recipes_ref.document()
    doc_ref.set(data)
    
    return doc_ref.id

def get_recipes_by_user(user_id: int) -> list:
    """Gets all recipes for a given user ordered by creation date."""
    recipes_ref = db.collection("recipes")
    query = recipes_ref.where("user_id", "==", user_id).order_by("created_at", direction=firestore.Query.DESCENDING)
    
    docs = query.stream()
    
    history = []
    for doc in docs:
        d_dict = doc.to_dict()
        history.append({
            "id": doc.id,
            "title": d_dict.get("title", ""),
            "prompt": d_dict.get("prompt", ""),
            "content": d_dict.get("content", ""),
            "isImage": False,
            "imageUrl": d_dict.get("image_url", None)
        })
    return history

def delete_recipe_from_firestore(recipe_id: str):
    """Deletes a recipe from Cloud Firestore."""
    db.collection("recipes").document(recipe_id).delete()

def update_recipe_image_in_firestore(recipe_id: str, image_url: str):
    """Updates the image URL of an existing recipe."""
    db.collection("recipes").document(recipe_id).update({"image_url": image_url})
