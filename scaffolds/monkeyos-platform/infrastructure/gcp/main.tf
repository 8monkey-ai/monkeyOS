terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

variable "project_id" {
  type = string
}
variable "region" {
  type    = string
  default = "us-central1"
}
variable "zone" {
  type    = string
  default = "us-central1-a"
}
variable "network_name" {
  type    = string
  default = "monkeyos-production"
}
variable "subnet_name" {
  type    = string
  default = "monkeyos-production-app"
}
variable "network_cidr" {
  type    = string
  default = "10.60.10.0/24"
}
variable "trusted_ssh_cidr" {
  type = string
}
variable "app_ingress_cidr" {
  type = string
}
variable "deployer_ssh_public_key" {
  type      = string
  sensitive = true
}
variable "deployer_user" {
  type    = string
  default = "deployer"
}
variable "host_count" {
  type    = number
  default = 2
  validation {
    condition     = var.host_count >= 1 && var.host_count <= 20 && floor(var.host_count) == var.host_count
    error_message = "host_count must be an integer from 1 to 20."
  }
}
variable "host_name_prefix" {
  type    = string
  default = "app-prod"
}
variable "runtime_arch" {
  type        = string
  default     = "arm64"
  description = "arm64 by default; amd64 supports AMD and Intel x86-64 hosts."
  validation {
    condition     = contains(["arm64", "amd64"], var.runtime_arch)
    error_message = "runtime_arch must be arm64 or amd64."
  }
}
variable "machine_type" {
  type        = string
  default     = null
  nullable    = true
  description = "Optional architecture-compatible override."
}
variable "source_image" {
  type        = string
  default     = null
  nullable    = true
  description = "Optional architecture-compatible image override."
}
variable "boot_disk_size_gb" {
  type    = number
  default = 30
}
variable "boot_disk_type" {
  type    = string
  default = "pd-balanced"
}

locals {
  machine_type = coalesce(var.machine_type, var.runtime_arch == "arm64" ? "t2a-standard-2" : "e2-standard-2")
  source_image = coalesce(var.source_image, var.runtime_arch == "arm64" ? "projects/ubuntu-os-cloud/global/images/family/ubuntu-2404-lts-arm64" : "projects/ubuntu-os-cloud/global/images/family/ubuntu-2404-lts-amd64")
}

resource "google_compute_network" "runtime" {
  name                    = var.network_name
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "app" {
  name                     = var.subnet_name
  ip_cidr_range            = var.network_cidr
  region                   = var.region
  network                  = google_compute_network.runtime.id
  private_ip_google_access = true
}

resource "google_compute_firewall" "ssh" {
  name          = "${var.network_name}-trusted-deployment-ssh"
  network       = google_compute_network.runtime.name
  direction     = "INGRESS"
  source_ranges = [var.trusted_ssh_cidr]
  target_tags   = ["monkeyos-runtime"]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_firewall" "application" {
  name          = "${var.network_name}-cloudflare-origin"
  network       = google_compute_network.runtime.name
  direction     = "INGRESS"
  source_ranges = [var.app_ingress_cidr]
  target_tags   = ["monkeyos-runtime"]
  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
}

resource "google_compute_address" "hosts" {
  count  = var.host_count
  name   = format("%s-%02d", var.host_name_prefix, count.index + 1)
  region = var.region
}

resource "google_compute_instance" "hosts" {
  count        = var.host_count
  name         = format("%s-%02d", var.host_name_prefix, count.index + 1)
  machine_type = local.machine_type
  zone         = var.zone
  tags         = ["monkeyos-runtime"]
  boot_disk {
    initialize_params {
      image = local.source_image
      size  = var.boot_disk_size_gb
      type  = var.boot_disk_type
    }
  }
  network_interface {
    subnetwork = google_compute_subnetwork.app.id
    access_config {
      nat_ip = google_compute_address.hosts[count.index].address
    }
  }
  metadata                = { ssh-keys = "${var.deployer_user}:${var.deployer_ssh_public_key}" }
  metadata_startup_script = <<-SCRIPT
    #!/bin/bash
    set -euxo pipefail
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io
    systemctl enable --now docker
    usermod -aG docker ${var.deployer_user}
  SCRIPT
  labels                  = { monkeyos_pool = "production-default" }
  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }
}

output "network_id" {
  value = google_compute_network.runtime.id
}
output "app_subnet_id" {
  value = google_compute_subnetwork.app.id
}
output "runtime_host_public_ips" {
  value = google_compute_address.hosts[*].address
}
output "configured_host_count" {
  value = var.host_count
}
output "selected_runtime_architecture" {
  value = var.runtime_arch
}
output "ssh_user" {
  value = var.deployer_user
}
