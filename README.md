# AI Mixologist 🍸

Welcome to **AI Mixologist** – a modern, cloud-native web application that uses Google Cloud Vertex AI to generate unique cocktail recipes and accompanying images based on user prompts.

## 🏛 Architecture

- **Frontend:** React + Vite, styled with Tailwind CSS.
- **Backend:** FastAPI (Python), handling API requests and Vertex AI integrations.
- **Database:** Google Cloud SQL (PostgreSQL) for persistent storage of recipes.
- **AI Integrations:** Google Cloud Vertex AI (Gemini and Imagen models).
- **Deployment:** Google Cloud Run (Serverless containers) for both Frontend and Backend.
- **Authentication:** Firebase Auth integrating seamlessly with the FastAPI backend.

## 📂 Project Structure

- `/frontend` - Contains the React/Vite web application.
- `/backend` - Contains the FastAPI Python application and AI logic.
- `gcp-setup.sh` - Script to configure GCP APIs and Service Accounts.
- `gcp-provision.sh` - Script to provision the Cloud SQL database.
- `gcp-deploy.sh` - Orchestrates the Docker builds and pushes to Google Artifact Registry / Cloud Run.

## 🚀 Deployment

The project includes deployment scripts to easily launch into Google Cloud. 

1. **Setup GCP Environment:** 
   Run `./gcp-setup.sh`
2. **Provision Infrastructure:** 
   Run `./gcp-provision.sh`
3. **Deploy the App:** 
   Run `./gcp-deploy.sh`

---
*Built as part of DATS 5750.*
