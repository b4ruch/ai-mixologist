#!/bin/bash

# Deployment Configuration
PROJECT_ID="ai-mixologist-b4ruch"
REGION="us-west2" # LA Region
REPO_NAME="mixologist-repo"

echo "===================================================="
echo "Phase 5: Dockerization & Cloud Run Deployment"
echo "===================================================="

# 1. Enable Artifact Registry & Cloud Build APIs
echo "1. Enabling Artifact Registry and Cloud Build APIs..."
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

# 2. Create Artifact Registry Repository (Docker format)
echo "2. Creating Artifact Registry Repository ($REPO_NAME)..."
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker repository for AI Mixologist services" || echo "Repository may already exist, proceeding..."

# 3. Build & Deploy Backend (Optional step)
DEPLOY_BACKEND="y"
if [ "$DEPLOY_BACKEND" = "y" ]; then
  echo "3. Building & Deploying the FastAPI Backend..."
  cd backend
  gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:latest
  gcloud run deploy mixologist-backend \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:latest \
    --region $REGION \
    --project $PROJECT_ID \
    --platform managed \
    --allow-unauthenticated \
      --add-cloudsql-instances ${PROJECT_ID}:${REGION}:mixologist-db \
      --set-env-vars PROJECT_ID=$PROJECT_ID,DATABASE_URL="postgresql://postgres:ChangeMe123!@/users?host=/cloudsql/${PROJECT_ID}:${REGION}:mixologist-db" \
      --port 8080
    cd ..
  else
    echo "Skipping Backend deployment..."
  fi

  # 4. Build & Deploy Frontend
  echo "4. Building & Deploying the Vite/React Frontend..."
  
  # Inject Backend URL into frontend build variables dynamically
  BACKEND_URL=$(gcloud run services describe mixologist-backend --region $REGION --project $PROJECT_ID --format 'value(status.url)' 2>/dev/null || echo "")
  if [ -n "$BACKEND_URL" ]; then
    echo "Using Backend URL: $BACKEND_URL"
    echo "VITE_BACKEND_URL=${BACKEND_URL}/api/v1" > frontend/.env.production
  else
    echo "Warning: Could not fetch backend URL. If this is the first deployment, please deploy backend first."
  fi

  cd frontend
  gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:latest
  gcloud run deploy mixologist-frontend \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:latest \
    --region $REGION \
    --project $PROJECT_ID \
    --platform managed \
    --allow-unauthenticated \
    --port 8080
  cd ..

echo "===================================================="
echo "Deployment Complete! 🥂"
echo "Note the Service URLs provided by the 'gcloud run deploy' output."
echo "===================================================="
