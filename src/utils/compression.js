// Compression utilities using native browser APIs (CompressionStream/DecompressionStream)

// Check if compression APIs are available
export const isCompressionSupported = () => {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
};

// Convert string to Uint8Array
const stringToBytes = (str) => {
  return new TextEncoder().encode(str);
};

// Convert Uint8Array to string
const bytesToString = (bytes) => {
  return new TextDecoder().decode(bytes);
};

// Convert Uint8Array to Base64
const bytesToBase64 = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert Base64 to Uint8Array
const base64ToBytes = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// Read stream to completion
const streamToBytes = async (stream) => {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
};

// Compress data using specified algorithm
export const compress = async (input, algorithm = 'gzip') => {
  if (!isCompressionSupported()) {
    throw new Error('Compression APIs are not supported in this browser');
  }

  const validAlgorithms = ['gzip', 'deflate', 'deflate-raw'];
  if (!validAlgorithms.includes(algorithm)) {
    throw new Error(`Unsupported compression algorithm: ${algorithm}. Use: ${validAlgorithms.join(', ')}`);
  }

  try {
    const inputBytes = stringToBytes(input);

    // Create a readable stream from the input
    const inputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(inputBytes);
        controller.close();
      }
    });

    // Pipe through compression stream
    const compressedStream = inputStream.pipeThrough(new CompressionStream(algorithm));
    const compressedBytes = await streamToBytes(compressedStream);

    // Return as Base64 for display
    return bytesToBase64(compressedBytes);
  } catch (e) {
    throw new Error(`Failed to compress: ${e.message}`);
  }
};

// Decompress data using specified algorithm
export const decompress = async (input, algorithm = 'gzip') => {
  if (!isCompressionSupported()) {
    throw new Error('Compression APIs are not supported in this browser');
  }

  const validAlgorithms = ['gzip', 'deflate', 'deflate-raw'];
  if (!validAlgorithms.includes(algorithm)) {
    throw new Error(`Unsupported decompression algorithm: ${algorithm}. Use: ${validAlgorithms.join(', ')}`);
  }

  try {
    // Decode from Base64
    const compressedBytes = base64ToBytes(input);

    // Create a readable stream from the compressed data
    const inputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(compressedBytes);
        controller.close();
      }
    });

    // Pipe through decompression stream
    const decompressedStream = inputStream.pipeThrough(new DecompressionStream(algorithm));
    const decompressedBytes = await streamToBytes(decompressedStream);

    return bytesToString(decompressedBytes);
  } catch (e) {
    throw new Error(`Failed to decompress: ${e.message}. Make sure the input is valid Base64-encoded compressed data.`);
  }
};

// Compress file
export const compressFile = async (file, algorithm = 'gzip', onProgress = null) => {
  if (!isCompressionSupported()) {
    throw new Error('Compression APIs are not supported in this browser');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const inputBytes = new Uint8Array(arrayBuffer);

    if (onProgress) onProgress(30);

    const inputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(inputBytes);
        controller.close();
      }
    });

    const compressedStream = inputStream.pipeThrough(new CompressionStream(algorithm));
    const compressedBytes = await streamToBytes(compressedStream);

    if (onProgress) onProgress(100);

    return {
      data: bytesToBase64(compressedBytes),
      originalSize: file.size,
      compressedSize: compressedBytes.length,
      ratio: ((1 - compressedBytes.length / file.size) * 100).toFixed(2)
    };
  } catch (e) {
    throw new Error(`Failed to compress file: ${e.message}`);
  }
};

// Export compression algorithms
export const compressionAlgorithms = [
  { id: 'gzip', name: 'GZIP' },
  { id: 'deflate', name: 'Deflate' }
];

export const compressors = {
  gzip: { name: 'GZIP', algorithm: 'gzip' },
  deflate: { name: 'Deflate', algorithm: 'deflate' }
};
