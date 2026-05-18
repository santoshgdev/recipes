variable "project_id" {
  description = "GCP project ID — must be globally unique (e.g. 'santosh-recipes-12345')"
  type        = string
}

variable "project_name" {
  description = "Human-readable project name"
  type        = string
  default     = "Recipes"
}
