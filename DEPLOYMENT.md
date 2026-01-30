# Smart Leave Deployment Guide

This guide will walk you through hosting your application step-by-step.

## Prerequisites
1.  **GitHub Account**: You must push your project to a GitHub repository.
2.  **Supabase Account**: You already have this set up.
3.  **Render Account**: For hosting the Backend (Free).
4.  **Vercel Account**: For hosting the Frontend (Free).

---

## Part 1: Organize for Deployment

We need to ensure GitHub sees your project correctly. Make sure your repository structure looks like this root:
```
/client  (Frontend code)
/server  (Backend code + Dockerfile)
README.md
```

I have already created a `Dockerfile` in the `/server` folder which is required for Render.

---

## Part 2: Deploy Backend (Render)

1.  Log in to [Render.com](https://render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Give it a name (e.g., `smart-leave-api`).
5.  **Important Settings**:
    *   **Root Directory**: `server`
    *   **Runtime**: `Docker`
    *   **Region**: Choose one close to you (e.g., Singapore or Frankfurt).
    *   **Free Instance Type**: Select the "Free" tier.
6.  **Environment Variables**:
    *   Click "Advanced" or "Environment Variables".
    *   Add Key: `Supabase__Url`, Value: `[Your Supabase URL]`
    *   Add Key: `Supabase__Key`, Value: `[Your Supabase Anon Key]`
    *   *(Note: In .NET configuration, colons `:` are often replaced by double underscores `__` in environment variables).*
7.  Click **Create Web Service**.
8.  Wait for the build to finish. Once done, copy the **Render URL** (e.g., `https://smart-leave-api.onrender.com`).

---

## Part 3: Deploy Frontend (Vercel)

1.  Log in to [Vercel.com](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Project Name**: Leave as is or change it.
5.  **Framework Preset**: It should auto-detect **Vite**.
6.  **Root Directory**: Click "Edit" and select `client`.
7.  **Environment Variables**:
    *   Add Key: `VITE_API_BASE_URL`
    *   Value: The **Render URL** you copied in Part 2 (e.g., `https://smart-leave-api.onrender.com`).
    *   *(Ensure there is NO trailing slash `/` at the end).*
    *   Add Key: `VITE_SUPABASE_URL`, Value: `[Your Supabase URL]`
    *   Add Key: `VITE_SUPABASE_ANON_KEY`, Value: `[Your Supabase Anon Key]`
8.  Click **Deploy**.

---

## Part 4: Final Connection

1.  Once Vercel finishes, you will get a **Vercel Domain** (e.g., `https://smart-leave-client.vercel.app`).
2.  Go back to **Supabase** -> **Authentication** -> **URL Configuration**.
3.  Add your Vercel URL to **Site URL** and **Redirect URLs**.
4.  You're done! Open the Vercel link to use your live app.
