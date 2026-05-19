<p align="right">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

# Vue 3 Library Management System

A modern library management system built with **Vue 3 + Element Plus**, featuring book management, borrowing management, reader management, and data statistics.

## Features

### Book Management

- Book list display with search
- Add, edit, delete book information
- Book status management (available / borrowed)

### Borrowing Management

- Borrowing record list
- Book checkout and return operations
- Automatic borrowing date calculation

### Reader Management

- Reader information management
- Reader borrowing history tracking

### Data Statistics

- Total collection count and borrowed books statistics
- Book status distribution pie chart
- Monthly borrowing trend line chart
- Top 5 most popular books
- Top 5 most active readers

## Tech Stack

| Technology | Version | Description |
|-----------|---------|-------------|
| Vue | 3.5+ | Progressive JavaScript Framework |
| Vite | 8.0+ | Next-generation frontend build tool |
| Element Plus | 2.13+ | Vue 3 component library |
| Pinia | 3.0+ | Vue state management library |
| Vue Router | 5.0+ | Vue routing manager |
| ECharts | 6.0+ | Data visualization chart library |

## Project Structure

```plaintext
library-admin/
├── .github/workflows/       # GitHub Actions deployment config
├── .vscode/                 # VS Code config
├── public/                  # Static assets
├── src/
│   ├── api/                 # Mock API interfaces
│   │   └── mock.js          # Data API & local storage
│   ├── assets/              # Static resource files
│   ├── router/              # Route configuration
│   │   └── index.js         # Route definitions & guards
│   ├── stores/              # Pinia state management
│   │   └── user.js          # User state management
│   ├── views/               # Page view components
│   │   ├── Login.vue        # Login page
│   │   ├── Layout.vue       # Layout component
│   │   ├── Dashboard.vue    # Data statistics dashboard
│   │   ├── BookList.vue     # Book management page
│   │   ├── BorrowList.vue   # Borrowing management page
│   │   └── ReaderList.vue   # Reader management page
│   ├── App.vue              # Root component
│   ├── main.js              # Application entry
│   └── style.css            # Global styles
├── index.html               # HTML template
├── package.json             # Dependencies config
├── vite.config.js           # Vite config
└── README.md                # Project documentation
```

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Login Credentials

- **Username**: Any username
- **Password**: `123456`

> Note: The system uses Mock data; login only checks if the password is `123456`.

## Usage Guide

1. **Login**: Open `http://localhost:5173` in your browser, enter username and password to log in
2. **Navigation**: Left sidebar provides system navigation, supports collapse/expand
3. **Dashboard**: Home page displays library operation statistics and visual charts
4. **Book Management**: Add, edit, delete books in the book list
5. **Borrowing Management**: Manage book checkouts and returns, view borrowing history
6. **Reader Management**: Manage reader information and maintain reader profiles

## UI Preview

### Login Page

- Gradient background login card
- Form validation with loading states

### Admin Dashboard

- Responsive layout design
- Collapsible sidebar menu
- Breadcrumb navigation
- Page transition animations

### Data Visualization

- Stat cards showing key metrics
- Interactive charts with hover tooltips
- Charts auto-resize to fit window

## Feature Checklist

- [x] User login/logout
- [x] Book CRUD operations
- [x] Borrowing management (checkout / return)
- [x] Reader CRUD operations
- [x] Data statistics dashboard
- [x] ECharts visualization
- [x] Local storage mock data
- [x] Element Plus component library
- [x] Responsive layout