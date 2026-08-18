# Noreste Arquitectura

A modern, high-performance architecture portfolio and project management system built with **Next.js 15**, **TypeScript**, and **GSAP**.

[norestearq.com](https://www.norestearq.com/)

## Overview

Noreste Arquitectura is a minimalist digital showcase designed for architectural excellence. It features a seamless user experience through high-end animations, a dynamic masonry gallery, and a robust project management dashboard.

## Key Features

- **Dynamic Showcase**: GSAP-powered interactive home feed with smooth scaling and motion detection.
- **Masonry Gallery**: Elegant project layouts using `masonry-layout` and `Fancybox` for immersive image viewing.
- **Admin Dashboard**: Full CRUD capabilities for project management, including secure login and drag-and-drop reordering.
- **Media Optimization**: Integrated with **Cloudinary** for professional-grade image/video hosting and **Next.js Image** component for performance.
- **Real-time Data**: Powered by **Supabase** for a reliable and fast backend.
- **Accessibility**: Support for reduced motion preferences and responsive design across all devices.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **Animations**: GSAP (GreenSock Animation Platform).
- **Backend/Database**: Supabase.
- **Media Storage**: Cloudinary.
- **Linting & Quality**: ESLint 9 (Flat Config) & rigorous TypeScript definitions.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/joacoesperon/noreste_arq
   cd noreste-arq
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (create a `.env.local` file):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   CLOUDINARY_CLOUD_NAME=your_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_secret
   ADMIN_PASSWORD=your_password
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Creates an optimized production build.
- `npm run lint`: Runs ESLint to ensure code quality.
- `npm run start`: Starts the production server.

---

Built with precision by **Noreste Arquitectura**.
