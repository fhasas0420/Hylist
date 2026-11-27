import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      title: "HyList",
      htmlAttrs: { lang: "en" },
      meta: [{ name: "description", content: "Hytale server list with live status and player counts." }],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" },
      ],
    },
  },
  modules: ["@nuxt/icon", "nuxt-toastify"],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    authJwtSecret: process.env.AUTH_JWT_SECRET,
    authRefreshPepper: process.env.AUTH_REFRESH_PEPPER,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    allowAdminSignup: process.env.ALLOW_ADMIN_SIGNUP === "true",
    public: {
      siteUrl: process.env.SITE_URL,
    },
  },
  css: ["~/assets/css/main.css", "~/assets/css/toastify.css"],
  nitro: {
    storage: {
      data: {
        driver: "fs",
        base: "./.data",
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  toastify: {
    autoClose: 2000,
    position: "top-right",
    theme: "auto",
  },
});
