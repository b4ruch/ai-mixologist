#!/bin/bash

PROJECT_ID="ai-mixologist-b4ruch"
REGION="us-west2"

echo "===================================================="
echo "Phase 2: Database & Infrastructure Provisioning"
echo "===================================================="

# 1. Cloud Storage Bucket for drink images
echo "1. Creating Cloud Storage Bucket..."
gcloud storage buckets create gs://${PROJECT_ID}-images --location=${REGION} --project=${PROJECT_ID} --uniform-bucket-level-access

# 2. Firestore Native Mode
echo "2. Initializing Firestore in Native Mode..."
gcloud firestore databases create --location=${REGION} --type=firestore-native --project=${PROJECT_ID}

# 3. Secret Manager placeholders
echo "3. Setting up Secret Manager placeholders..."
echo "dummy-key" | gcloud secrets create GEMINI_API_KEY --data-file=- --replication-policy=automatic --project=${PROJECT_ID}
echo "dummy-db-url" | gcloud secrets create DATABASE_URL --data-file=- --replication-policy=automatic --project=${PROJECT_ID}

# 4. Cloud SQL (PostgreSQL)
echo "4. Provisioning Cloud SQL (PostgreSQL) instance..."
echo "Note: This can take 5-10 minutes. Grab a coffee or a mocktail!"
# Using db-f1-micro to save costs and reduce provisioning time during development
gcloud sql instances create mixologist-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --root-password="ChangeMe123!"

echo "Creating 'users' database within the instance..."
gcloud sql databases create users --instance=mixologist-db --project=${PROJECT_ID}

echo "Phase 2 Provisioning Complete!"
