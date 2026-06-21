#!/bin/bash

# Configuration
# Replace 'your-project-id' with your desired GCP project ID
PROJECT_ID="ai-mixologist-b4ruch"
REGION="us-west2" # Los Angeles region

echo "===================================================="
echo "Phase 1: Local Setup & GCP Project Initialization"
echo "===================================================="

# 1. Authenticate with GCP (You may need to run this manually in your terminal if not authenticated)
# gcloud auth login

# 2. Create the GCP Project
echo "Creating GCP Project: $PROJECT_ID..."
gcloud projects create $PROJECT_ID --name="AI Mixologist"

# 3. Set the active project
echo "Setting active project..."
gcloud config set project $PROJECT_ID

# 4. Link a billing account
BILLING_ACCOUNT_ID="017DFA-F8BE66-C3D251"
echo "Linking to Billing Account: $BILLING_ACCOUNT_ID..."
gcloud beta billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID

# 5. Enable required GCP APIs
echo "Enabling necessary GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  generativelanguage.googleapis.com \
  identitytoolkit.googleapis.com # Firebase Auth

echo "Phase 1 initialization script complete!"
echo "Please remember to link a billing account if you haven't already."
