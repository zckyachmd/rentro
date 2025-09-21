# Rentro 🏠
The all-in-one rental property platform for landlords & property managers — easy, fast, and fun!

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

Rentro is a robust platform designed to simplify rental property management by centralizing tenant, contract, payment, and asset workflows. Tailored for property managers and landlords, it enhances operational efficiency through automation, real-time insights, and an intuitive web interface.

---

## ✨ Features

- Streamlined tenant and lease management with automated notifications
- Real-time payment and invoice tracking with status updates
- Comprehensive asset inventory and proactive maintenance scheduling
- Event-driven alerts for payments, contract milestones, and renewals
- Data-driven occupancy, financial, and property performance reporting

---

## 🛠️ Tech Stack

- Backend: `Laravel` `PHP 8.4`
- Frontend: `React`, `shadcn/ui`, `Inertia.js` `Vite`
- Database: `PostgreSQL 17`
- Cache & Queue: `Redis 7` `Laravel Horizon`
- Web Server: `Nginx`
- Containerization: `Docker` `Docker Compose`

---

## 🏗️ Architecture

Rentro employs a modular, service-oriented architecture leveraging Laravel’s MVC framework and Inertia.js to deliver a seamless SPA experience. The backend handles business logic, data persistence, and asynchronous processing, while the frontend offers reactive UI components optimized for performance.

---

## ⚙️ How to Use (Development)

### Installation

1. Duplicate the environment configuration and generate the application key:
    ```bash
    cp .env.example .env
    docker compose exec app php artisan key:generate
    ```

### Running the Application

2. Build and launch all services:
    ```bash
    docker compose up -d --build
    ```

3. (Optional) Enable frontend hot-reloading during development:
    ```bash
    docker compose --profile devtools up -d vite
    ```

4. Apply database migrations:
    ```bash
    docker compose exec app php artisan migrate
    ```
---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and instructions.

---

## 📄 License

Distributed under a permissive license. Refer to [LICENSE.md](LICENSE.md) for full terms.
