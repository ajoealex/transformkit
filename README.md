# TransformKit

A modern, fully offline encoding/decoding, hashing, and compression tool built with React and TailwindCSS. All processing happens locally in your browser - no data is sent to any server.

## Features

### Encoding
- **Base64** - Standard Base64 encoding/decoding with optional padding
- **Base64 URL Safe** - URL-safe Base64 variant (replaces `+/` with `-_`)
- **Base32** - RFC 4648 Base32 encoding/decoding with optional padding
- **Base16 (Hex)** - Hexadecimal encoding/decoding
- **URL Encoding** - Percent-encoding for URLs (encodeURIComponent)

### Escaping
- **HTML Entity** - Escape/unescape HTML special characters (`<`, `>`, `&`, `"`, etc.)
- **JSON** - Escape/unescape strings for JSON (handles `\n`, `\t`, `\"`, etc.)
- **XML** - Escape/unescape XML special characters
- **Regex** - Escape/unescape regex metacharacters

### Hashing
- **SHA-1** - 160-bit hash (legacy, not recommended for security)
- **SHA-256** - 256-bit hash (recommended)
- **SHA-384** - 384-bit hash
- **SHA-512** - 512-bit hash

All hashing uses the native Web Crypto API. Supports:
- Text hashing
- File hashing (with progress indicator)
- Hash verification (compare expected vs actual)

### Compression
- **GZIP** - Standard gzip compression
- **Deflate** - Raw deflate compression

Uses native browser CompressionStream/DecompressionStream APIs. Output is Base64-encoded for display.

## Tech Stack

- **React 19** - UI framework (no TypeScript)
- **Vite** - Build tool and dev server
- **TailwindCSS 4** - Utility-first CSS framework
- **Web Crypto API** - Native browser hashing
- **CompressionStream API** - Native browser compression

## Getting Started

### Install dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

Build output goes to `/docs` folder with relative asset paths (`./`) for static hosting.

### Preview production build
```bash
npm run preview
```

## Project Structure

```
TransformKit/
├── docs/                    # Production build output
├── src/
│   ├── utils/
│   │   ├── encoding.js      # Encoding & escaping algorithms
│   │   ├── hashing.js       # SHA hashing with Web Crypto API
│   │   └── compression.js   # GZIP/Deflate compression
│   ├── App.jsx              # Main application component
│   ├── App.css              # Component styles
│   ├── index.css            # Global styles & TailwindCSS
│   └── main.jsx             # Application entry point
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
└── package.json
```

## Browser Support

Requires modern browsers with support for:
- Web Crypto API (subtle.digest)
- CompressionStream / DecompressionStream
- ES2020+ features

## License

MIT
