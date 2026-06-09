// Base64 standard encoding/decoding
export const base64 = {
  encode: (input, withPadding = true) => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)));
      return withPadding ? encoded : encoded.replace(/=+$/, '');
    } catch (e) {
      throw new Error('Failed to encode Base64: ' + e.message);
    }
  },
  decode: (input) => {
    try {
      // Add padding if missing
      const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
      return decodeURIComponent(escape(atob(padded)));
    } catch (e) {
      throw new Error('Failed to decode Base64: Invalid input');
    }
  }
};

// Base64 URL-safe encoding/decoding
export const base64Url = {
  encode: (input, withPadding = true) => {
    try {
      let encoded = btoa(unescape(encodeURIComponent(input)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      return withPadding ? encoded : encoded.replace(/=+$/, '');
    } catch (e) {
      throw new Error('Failed to encode Base64 URL: ' + e.message);
    }
  },
  decode: (input) => {
    try {
      // Convert URL-safe characters back and add padding
      let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
      base64 += '='.repeat((4 - (base64.length % 4)) % 4);
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      throw new Error('Failed to decode Base64 URL: Invalid input');
    }
  }
};

// Base32 encoding/decoding (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE32_PAD = '=';

export const base32 = {
  encode: (input, withPadding = true) => {
    try {
      const bytes = new TextEncoder().encode(input);
      let bits = '';
      for (const byte of bytes) {
        bits += byte.toString(2).padStart(8, '0');
      }

      // Pad to multiple of 5
      while (bits.length % 5 !== 0) {
        bits += '0';
      }

      let encoded = '';
      for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.slice(i, i + 5);
        encoded += BASE32_ALPHABET[parseInt(chunk, 2)];
      }

      if (withPadding) {
        const paddingMap = { 0: 0, 1: 6, 2: 4, 3: 3, 4: 1 };
        const padding = paddingMap[bytes.length % 5];
        encoded += BASE32_PAD.repeat(padding);
      }

      return encoded;
    } catch (e) {
      throw new Error('Failed to encode Base32: ' + e.message);
    }
  },
  decode: (input) => {
    try {
      // Remove padding and convert to uppercase
      const cleaned = input.replace(/=+$/, '').toUpperCase();

      let bits = '';
      for (const char of cleaned) {
        const index = BASE32_ALPHABET.indexOf(char);
        if (index === -1) {
          throw new Error('Invalid character in Base32 input');
        }
        bits += index.toString(2).padStart(5, '0');
      }

      // Convert bits to bytes
      const bytes = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
      }

      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch (e) {
      throw new Error('Failed to decode Base32: ' + e.message);
    }
  }
};

// Base16 (Hex) encoding/decoding
export const base16 = {
  encode: (input) => {
    try {
      const bytes = new TextEncoder().encode(input);
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('');
    } catch (e) {
      throw new Error('Failed to encode Hex: ' + e.message);
    }
  },
  decode: (input) => {
    try {
      const cleaned = input.replace(/\s/g, '');
      if (cleaned.length % 2 !== 0) {
        throw new Error('Invalid hex string length');
      }

      const bytes = [];
      for (let i = 0; i < cleaned.length; i += 2) {
        const byte = parseInt(cleaned.slice(i, i + 2), 16);
        if (isNaN(byte)) {
          throw new Error('Invalid hex character');
        }
        bytes.push(byte);
      }

      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch (e) {
      throw new Error('Failed to decode Hex: ' + e.message);
    }
  }
};

// HTML Entity encoding/decoding
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

export const htmlEntity = {
  encode: (input) => {
    try {
      return input.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);
    } catch (e) {
      throw new Error('Failed to encode HTML entities: ' + e.message);
    }
  },
  decode: (input) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = input;
      return textarea.value;
    } catch (e) {
      throw new Error('Failed to decode HTML entities: ' + e.message);
    }
  }
};

// URL Encoding
export const urlEncoding = {
  encode: (input) => {
    try {
      return encodeURIComponent(input);
    } catch (e) {
      throw new Error('Failed to URL encode: ' + e.message);
    }
  },
  decode: (input) => {
    try {
      return decodeURIComponent(input);
    } catch (e) {
      throw new Error('Failed to URL decode: ' + e.message);
    }
  }
};

// JSON Escape
export const jsonEscape = {
  encode: (input) => {
    try {
      return JSON.stringify(input).slice(1, -1);
    } catch (e) {
      throw new Error('Failed to JSON escape: ' + e.message);
    }
  },
  decode: (input) => {
    try {
      return JSON.parse(`"${input}"`);
    } catch (e) {
      throw new Error('Failed to JSON unescape: Invalid escaped string');
    }
  }
};

// XML Escape
const XML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
};

const XML_REVERSE = Object.fromEntries(
  Object.entries(XML_ENTITIES).map(([k, v]) => [v, k])
);

export const xmlEscape = {
  encode: (input) => {
    try {
      return input.replace(/[&<>"']/g, char => XML_ENTITIES[char]);
    } catch (e) {
      throw new Error('Failed to XML escape: ' + e.message);
    }
  },
  decode: (input) => {
    try {
      return input.replace(/&(amp|lt|gt|quot|apos);/g, entity => XML_REVERSE[entity]);
    } catch (e) {
      throw new Error('Failed to XML unescape: ' + e.message);
    }
  }
};

// Regex Escape
export const regexEscape = {
  encode: (input) => {
    try {
      return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    } catch (e) {
      throw new Error('Failed to escape regex: ' + e.message);
    }
  },
  decode: (input) => {
    try {
      return input.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
    } catch (e) {
      throw new Error('Failed to unescape regex: ' + e.message);
    }
  }
};

// Export all encoders with metadata
export const encoders = {
  base64: { name: 'Base64', ...base64, supportsPadding: true },
  base64Url: { name: 'Base64 URL Safe', ...base64Url, supportsPadding: true },
  base32: { name: 'Base32', ...base32, supportsPadding: true },
  base16: { name: 'Base16 (Hex)', ...base16, supportsPadding: false },
  urlEncoding: { name: 'URL Encoding', ...urlEncoding, supportsPadding: false }
};

// Export all escapers with metadata (using escape/unescape terminology)
export const escapers = {
  htmlEntity: {
    name: 'HTML Entity',
    escape: htmlEntity.encode,
    unescape: htmlEntity.decode
  },
  jsonEscape: {
    name: 'JSON',
    escape: jsonEscape.encode,
    unescape: jsonEscape.decode
  },
  xmlEscape: {
    name: 'XML',
    escape: xmlEscape.encode,
    unescape: xmlEscape.decode
  },
  regexEscape: {
    name: 'Regex',
    escape: regexEscape.encode,
    unescape: regexEscape.decode
  }
};
