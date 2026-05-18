resource "google_project" "recipes" {
  name       = var.project_name
  project_id = var.project_id

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_service" "services" {
  for_each = toset([
    "firestore.googleapis.com",
    "firebase.googleapis.com",
    "firebaserules.googleapis.com",
    "firebaseappcheck.googleapis.com",
  ])

  project            = google_project.recipes.project_id
  service            = each.value
  disable_on_destroy = false

  depends_on = [google_project.recipes]
}

resource "google_firestore_database" "recipes" {
  project     = google_project.recipes.project_id
  name        = "(default)"
  location_id = "nam5"
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.services]
}

resource "google_firebase_project" "recipes" {
  provider = google-beta
  project  = google_project.recipes.project_id

  depends_on = [google_project_service.services]
}

resource "google_firebase_web_app" "recipes" {
  provider     = google-beta
  project      = google_project.recipes.project_id
  display_name = "Recipes"

  depends_on = [google_firebase_project.recipes]
}

data "google_firebase_web_app_config" "recipes" {
  provider   = google-beta
  project    = google_project.recipes.project_id
  web_app_id = google_firebase_web_app.recipes.app_id
}

resource "google_firebaserules_ruleset" "firestore" {
  provider = google-beta
  project  = google_project.recipes.project_id

  source {
    files {
      name = "firestore.rules"
      content = <<-EOF
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /recipes/{recipeId} {
              allow read: if true;
              allow write: if false;
            }
          }
        }
      EOF
    }
  }

  depends_on = [google_firebase_project.recipes]
}

resource "google_firebaserules_release" "firestore" {
  provider     = google-beta
  project      = google_project.recipes.project_id
  name         = "cloud.firestore"
  ruleset_name = google_firebaserules_ruleset.firestore.name

  depends_on = [google_firestore_database.recipes]
}
