# AetherMind - AI, ML, Python & Technology Blog

A modern, professional, and high-fidelity Single Page Application (SPA) blog website showcasing trends in Artificial Intelligence, Machine Learning tutorials, Python projects, and career roadmaps for engineering students.

## 🚀 Features

- **Futuristic Aesthetics**: Sleek default dark mode with custom neon purple/cyan accents and clean, responsive transitions to a light theme.
- **Glassmorphic Layout**: Responsive grids and navigation headers utilising modern backdrop blurs and floating card effects.
- **Client-Side Routing**: SPA hash-based router (`#home`, `#blog`, `#post/id`, `#category/name`) supporting back/forward browser history and deep linking.
- **Interactive Search & Filter**: Real-time keyword search engine and category filter badges to drill down through articles.
- **Validation-Ready Forms**: Dynamic email checking and successful submission states for both the contact sheet and the newsletter subscription.
- **Custom Assets**: High-tech post cover illustrations generated specifically for this publication.

## 📂 Project Structure

```text
├── assets/
│   ├── post_agentic_ai.png          # Generated visual cover for agentic AI
│   ├── post_python_smarthome.png    # Smart home blueprint visual
│   ├── post_transformers.png       # Transformers self-attention concept
│   └── post_career_guide.png       # Career path roadmap visual
├── index.html                       # HTML5 structure & layouts
├── style.css                        # CSS3 styling system & themes
├── posts.js                         # Shared blog articles database
└── app.js                           # Routing, search, & dynamic handlers
```

## 🛠️ Getting Started

To run and preview the blog website locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mpraveen9740/AI_Foundation.git
   cd AI_Foundation
   ```

2. **Start a local development server**:
   You can serve the files using any static HTTP server. For example, using Python:
   ```bash
   python -m http.server 8000
   ```
   Or using Node.js:
   ```bash
   npx serve .
   ```

3. **Open the browser**:
   Navigate to `http://localhost:8000` to interact with the blog!
