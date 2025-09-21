# Rentro 🏠
Rental Property Management Platform for Landlords and Property Managers

---

## 📚 Table of Contents

1. [🚀 Overview](#-overview)
2. [✨ Features](#-features)
3. [🛠️ Tech Stack](#-tech-stack)
4. [🏗️ Architecture](#-architecture)
5. [⚙️ How to Use (Development)](#-how-to-use-development)
6. [📄 License](#-license)

---

## 🚀 Overview

Rentro is a modern platform for managing rental properties, contracts, tenants, payments, and assets. Built for property managers and landlords, it streamlines administrative tasks, automates notifications, and provides actionable reports via an efficient web interface.

---

## ✨ Features

- Tenant and contract management with automated reminders
- Payment and invoice tracking with real-time status
- Asset inventory and maintenance scheduling
- Automated notifications for payments and contract events
- Occupancy, financial, and property performance reporting

---

## 🛠️ Tech Stack

- Backend: Laravel 12 (PHP 8.4)
- Frontend: ReactJS (Inertia.js), Vite
- Database: PostgreSQL 17
- Cache/Queue: Redis 7, Laravel Horizon
- Web Server: Nginx
- Containerization: Docker, Docker Compose

---

## ⚙️ How to Use (Development)

### Installation

1. Copy the example environment file and generate the app key:
    ```bash
    cp .env.example .env
    docker compose exec app php artisan key:generate
    ```

### Running the Application

2. Build and start all services:
    ```bash
    docker compose up -d --build
    ```

3. (Optional) Start frontend hot reloading:
    ```bash
    docker compose --profile devtools up -d vite
    ```

4. Run database migrations:
    ```bash
    docker compose exec app php artisan migrate
    ```

---

## 📄 License

Released under a permissive license. See [LICENSE.md](LICENSE.md) for details.
