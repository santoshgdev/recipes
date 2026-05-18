output "project_id" {
  description = "GCP project ID"
  value       = google_project.recipes.project_id
}

output "firebase_config" {
  description = "Paste these values into the FIREBASE_CONFIG object in index.html and recipe.html"
  value = {
    apiKey            = data.google_firebase_web_app_config.recipes.api_key
    authDomain        = data.google_firebase_web_app_config.recipes.auth_domain
    projectId         = google_project.recipes.project_id
    storageBucket     = data.google_firebase_web_app_config.recipes.storage_bucket
    messagingSenderId = data.google_firebase_web_app_config.recipes.messaging_sender_id
    appId             = google_firebase_web_app.recipes.app_id
  }
}
