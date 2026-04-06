module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        deep: {
          bg: "#0a1628",
          surface: "#0d1f35",
          card: "#122a47",
          elevated: "#163358",
          border: "#2a4d73",
          ink: "#050d18",
          muted: "#8ea3c0",
        },
      },
      backgroundImage: {
        "gradient-page":
          "linear-gradient(165deg, #0a1628 0%, #0d2138 45%, #0f2847 100%)",
        "gradient-hero":
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(56, 189, 248, 0.12), transparent), linear-gradient(165deg, #0a1628 0%, #102a4a 50%, #0d2138 100%)",
        "gradient-accent":
          "linear-gradient(90deg, #2563eb 0%, #0891b2 55%, #06b6d4 100%)",
        "gradient-accent-hover":
          "linear-gradient(90deg, #3b82f6 0%, #0e7490 55%, #22d3ee 100%)",
      },
    },
  },
  plugins: [],
};
