// Hash algorithms using Web Crypto API
const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

// Convert ArrayBuffer to hex string
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Hash text using specified algorithm
export const hashText = async (text, algorithm = 'SHA-256') => {
  if (!HASH_ALGORITHMS.includes(algorithm)) {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    return bufferToHex(hashBuffer);
  } catch (e) {
    throw new Error(`Failed to hash text: ${e.message}`);
  }
};

// Hash file using specified algorithm
export const hashFile = async (file, algorithm = 'SHA-256', onProgress = null) => {
  if (!HASH_ALGORITHMS.includes(algorithm)) {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  try {
    // For small files, read all at once
    if (file.size < 10 * 1024 * 1024) { // Less than 10MB
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer);
      return bufferToHex(hashBuffer);
    }

    // For larger files, read in chunks
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
    const reader = file.stream().getReader();
    let bytesRead = 0;

    // We need to collect all chunks and hash at once since SubtleCrypto
    // doesn't support streaming digest. For truly large files, we'd need
    // a different approach, but for browser use this is reasonable.
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      bytesRead += value.length;

      if (onProgress) {
        onProgress((bytesRead / file.size) * 100);
      }
    }

    // Combine all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const hashBuffer = await crypto.subtle.digest(algorithm, combined);
    return bufferToHex(hashBuffer);
  } catch (e) {
    throw new Error(`Failed to hash file: ${e.message}`);
  }
};

// Verify hash matches expected value
export const verifyHash = (actualHash, expectedHash) => {
  const normalizedActual = actualHash.toLowerCase().trim();
  const normalizedExpected = expectedHash.toLowerCase().trim();
  return normalizedActual === normalizedExpected;
};

// Export available algorithms
export const hashAlgorithms = HASH_ALGORITHMS.map(algo => ({
  id: algo.toLowerCase().replace('-', ''),
  name: algo,
  algorithm: algo
}));

export const hashers = {
  'sha1': { name: 'SHA-1', algorithm: 'SHA-1' },
  'sha256': { name: 'SHA-256', algorithm: 'SHA-256' },
  'sha384': { name: 'SHA-384', algorithm: 'SHA-384' },
  'sha512': { name: 'SHA-512', algorithm: 'SHA-512' }
};
