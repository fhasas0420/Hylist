export const SERVER_LINKS = [
    { key: "discordUrl", label: "Discord", icon: "heroicons-outline:chat-bubble-left-right", placeholder: "https://discord.gg/yourserver" },
    { key: "websiteUrl", label: "Website", icon: "heroicons-outline:globe-alt", placeholder: "https://example.com" },
    { key: "storeUrl", label: "Store", icon: "heroicons-outline:shopping-cart", placeholder: "https://store.example.com" },
    { key: "youtubeUrl", label: "YouTube", icon: "heroicons-outline:play", placeholder: "https://youtube.com/@yourchannel" },
    { key: "tiktokUrl", label: "TikTok", icon: "heroicons-outline:musical-note", placeholder: "https://tiktok.com/@yourname" },
    { key: "twitterUrl", label: "X (Twitter)", icon: "heroicons-outline:at-symbol", placeholder: "https://x.com/yourname" },
    { key: "instagramUrl", label: "Instagram", icon: "heroicons-outline:camera", placeholder: "https://instagram.com/yourname" },
] as const;

export type ServerLinkKey = (typeof SERVER_LINKS)[number]["key"];
