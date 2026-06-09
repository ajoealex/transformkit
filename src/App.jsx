import { useState, useRef, useCallback, useEffect } from 'react';
import { encoders, escapers } from './utils/encoding';
import { hashText, hashFile, verifyHash, hashers } from './utils/hashing';
import { compress, decompress, compressors, isCompressionSupported } from './utils/compression';
import './App.css';

// Example inputs for each algorithm
const EXAMPLES = {
  // Encoding
  base64: 'Hello, World! This is a Base64 encoding example.',
  base64Url: 'Hello, World! This is URL-safe Base64 encoding.',
  base32: 'Hello, World! Base32 example.',
  base16: 'Hello, World!',
  urlEncoding: 'redirect=https://myapp.com/dashboard?user=john@email.com&token=abc123',
  // Escaping
  htmlEntity: '<div class="container">Hello & Welcome!</div>',
  jsonEscape: 'Hello "World"\nNew line\tTab character\\Backslash',
  xmlEscape: '<user name="John" role=\'admin\'>Data & Content</user>',
  regexEscape: 'Match this: file.txt (version 1.0) [test] $100 ^start end$',
  // Hashing
  sha1: 'The quick brown fox jumps over the lazy dog',
  sha256: 'The quick brown fox jumps over the lazy dog',
  sha384: 'The quick brown fox jumps over the lazy dog',
  sha512: 'The quick brown fox jumps over the lazy dog',
  // Compression
  gzip: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  deflate: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
};

// Categories and their algorithms
const CATEGORIES = {
  encoding: {
    name: 'Encoding',
    algorithms: Object.entries(encoders).map(([key, val]) => ({
      id: key,
      name: val.name,
      supportsPadding: val.supportsPadding
    }))
  },
  escaping: {
    name: 'Escaping',
    algorithms: Object.entries(escapers).map(([key, val]) => ({
      id: key,
      name: val.name
    }))
  },
  hashing: {
    name: 'Hashing',
    algorithms: Object.entries(hashers).map(([key, val]) => ({
      id: key,
      name: val.name,
      algorithm: val.algorithm
    }))
  },
  compression: {
    name: 'Compression',
    algorithms: Object.entries(compressors).map(([key, val]) => ({
      id: key,
      name: val.name,
      algorithm: val.algorithm
    }))
  }
};

// Toast notification component
function Toast({ message, type, onClose }) {
  return (
    <div
      className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 toast-enter
        ${type === 'success' ? 'bg-emerald-500/90' : type === 'error' ? 'bg-red-500/90' : 'bg-blue-500/90'}
        text-white backdrop-blur-sm`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="hover:opacity-70 transition-opacity">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Icon components
const Icons = {
  Copy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Swap: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  ),
  Clear: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  File: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Example: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
};

function App() {
  const [category, setCategory] = useState('encoding');
  const [algorithm, setAlgorithm] = useState('base64');
  const [input, setInput] = useState(EXAMPLES.base64);
  const [output, setOutput] = useState('');
  const [withPadding, setWithPadding] = useState(true);
  const [expectedHash, setExpectedHash] = useState('');
  const [hashVerificationResult, setHashVerificationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [fileProgress, setFileProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const currentCategory = CATEGORIES[category];
  const currentAlgorithm = currentCategory.algorithms.find(a => a.id === algorithm) || currentCategory.algorithms[0];

  // Load example when algorithm changes
  const loadExample = useCallback(() => {
    const example = EXAMPLES[algorithm];
    if (example) {
      setInput(example);
      setOutput('');
    }
  }, [algorithm]);

  // Handle category change
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    const firstAlgo = CATEGORIES[newCategory].algorithms[0].id;
    setAlgorithm(firstAlgo);
    setInput(EXAMPLES[firstAlgo] || '');
    setOutput('');
    setHashVerificationResult(null);
    setSelectedFile(null);
  };

  // Handle algorithm change
  const handleAlgorithmChange = (newAlgorithm) => {
    setAlgorithm(newAlgorithm);
    setInput(EXAMPLES[newAlgorithm] || '');
    setOutput('');
    setHashVerificationResult(null);
  };

  // Encode operation
  const handleEncode = async () => {
    if (!input.trim()) {
      showToast('Please enter some text to encode', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const encoder = encoders[algorithm];
      const result = encoder.supportsPadding
        ? encoder.encode(input, withPadding)
        : encoder.encode(input);
      setOutput(result);
      showToast('Encoded successfully');
    } catch (error) {
      showToast(error.message, 'error');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Decode operation
  const handleDecode = async () => {
    if (!input.trim()) {
      showToast('Please enter some text to decode', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const encoder = encoders[algorithm];
      const result = encoder.decode(input);
      setOutput(result);
      showToast('Decoded successfully');
    } catch (error) {
      showToast(error.message, 'error');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Escape operation
  const handleEscape = async () => {
    if (!input.trim()) {
      showToast('Please enter some text to escape', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const escaper = escapers[algorithm];
      const result = escaper.escape(input);
      setOutput(result);
      showToast('Escaped successfully');
    } catch (error) {
      showToast(error.message, 'error');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Unescape operation
  const handleUnescape = async () => {
    if (!input.trim()) {
      showToast('Please enter some text to unescape', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const escaper = escapers[algorithm];
      const result = escaper.unescape(input);
      setOutput(result);
      showToast('Unescaped successfully');
    } catch (error) {
      showToast(error.message, 'error');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate hash
  const handleHash = async () => {
    if (!input.trim()) {
      showToast('Please enter some text to hash', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const hasher = hashers[algorithm];
      const result = await hashText(input, hasher.algorithm);
      setOutput(result);
      showToast('Hash generated successfully');

      // Auto-verify if expected hash is provided
      if (expectedHash.trim()) {
        const isMatch = verifyHash(result, expectedHash);
        setHashVerificationResult(isMatch);
      }
    } catch (error) {
      showToast(error.message, 'error');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Hash file
  const handleHashFile = async () => {
    if (!selectedFile) {
      showToast('Please select a file first', 'error');
      return;
    }

    setIsProcessing(true);
    setFileProgress(0);
    try {
      const hasher = hashers[algorithm];
      const result = await hashFile(selectedFile, hasher.algorithm, (progress) => {
        setFileProgress(Math.round(progress));
      });
      setOutput(result);
      setInput(`[File: ${selectedFile.name}]`);
      showToast('File hashed successfully');

      // Auto-verify if expected hash is provided
      if (expectedHash.trim()) {
        const isMatch = verifyHash(result, expectedHash);
        setHashVerificationResult(isMatch);
      }
    } catch (error) {
      showToast(error.message, 'error');
      setOutput('');
    } finally {
      setIsProcessing(false);
      setFileProgress(0);
    }
  };

  // Compress
  const handleCompress = async () => {
    if (!input.trim()) {
      showToast('Please enter some text to compress', 'error');
      return;
    }

    if (!isCompressionSupported()) {
      showToast('Compression APIs are not supported in this browser', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const compressor = compressors[algorithm];
      const result = await compress(input, compressor.algorithm);
      setOutput(result);
      const originalSize = new TextEncoder().encode(input).length;
      const compressedSize = atob(result).length;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      showToast(`Compressed (${ratio}% reduction)`);
    } catch (error) {
      showToast(error.message, 'error');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Decompress
  const handleDecompress = async () => {
    if (!input.trim()) {
      showToast('Please enter Base64 compressed data', 'error');
      return;
    }

    if (!isCompressionSupported()) {
      showToast('Compression APIs are not supported in this browser', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const compressor = compressors[algorithm];
      const result = await decompress(input, compressor.algorithm);
      setOutput(result);
      showToast('Decompressed successfully');
    } catch (error) {
      showToast(error.message, 'error');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy output
  const handleCopy = async () => {
    if (!output) {
      showToast('Nothing to copy', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      showToast('Copied to clipboard');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  // Swap input/output
  const handleSwap = () => {
    if (!output) return;
    setInput(output);
    setOutput('');
    setHashVerificationResult(null);
  };

  // Clear all
  const handleClear = () => {
    setInput('');
    setOutput('');
    setExpectedHash('');
    setHashVerificationResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      showToast(`File selected: ${file.name}`, 'info');
    }
  };

  // Render action buttons based on category
  const renderActions = () => {
    const buttonBase = "px-6 py-3 rounded-xl font-medium transition-all btn-glow flex items-center gap-2 justify-center text-base";
    const primaryBtn = `${buttonBase} bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25`;
    const secondaryBtn = `${buttonBase} bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/50`;

    switch (category) {
      case 'encoding':
        return (
          <>
            <button onClick={handleEncode} className={primaryBtn} disabled={isProcessing}>
              Encode
            </button>
            <button onClick={handleDecode} className={secondaryBtn} disabled={isProcessing}>
              Decode
            </button>
          </>
        );
      case 'escaping':
        return (
          <>
            <button onClick={handleEscape} className={primaryBtn} disabled={isProcessing}>
              Escape
            </button>
            <button onClick={handleUnescape} className={secondaryBtn} disabled={isProcessing}>
              Unescape
            </button>
          </>
        );
      case 'hashing':
        return (
          <>
            <button onClick={handleHash} className={primaryBtn} disabled={isProcessing}>
              Generate Hash
            </button>
            <button onClick={() => fileInputRef.current?.click()} className={secondaryBtn}>
              <Icons.File /> Select File
            </button>
            {selectedFile && (
              <button onClick={handleHashFile} className={secondaryBtn} disabled={isProcessing}>
                Hash File
              </button>
            )}
          </>
        );
      case 'compression':
        return (
          <>
            <button onClick={handleCompress} className={primaryBtn} disabled={isProcessing}>
              Compress
            </button>
            <button onClick={handleDecompress} className={secondaryBtn} disabled={isProcessing}>
              Decompress
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Animated background */}
      <div className="bg-animated" />

      {/* Toast notification */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main container - full width with padding */}
      <div className="relative z-10 flex-1 flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            TransformKit
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Encode, Hash, and Compress - All in your browser
          </p>
        </header>

        {/* Main card - grows to fill space */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8 flex-1 flex flex-col max-w-[1800px] mx-auto w-full">
          {/* Controls row */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Category selector */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-600/50 text-white focus:border-indigo-500 transition-colors text-base"
              >
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Algorithm selector */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => handleAlgorithmChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-600/50 text-white focus:border-indigo-500 transition-colors text-base"
              >
                {currentCategory.algorithms.map((algo) => (
                  <option key={algo.id} value={algo.id}>{algo.name}</option>
                ))}
              </select>
            </div>

            {/* Padding option (for encoding) */}
            {category === 'encoding' && currentAlgorithm?.supportsPadding && (
              <div className="flex items-end">
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-600/50 cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={withPadding}
                    onChange={(e) => setWithPadding(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 bg-gray-700"
                  />
                  <span className="text-gray-300 text-sm">With Padding</span>
                </label>
              </div>
            )}

            {/* Load Example button */}
            <div className="flex items-end">
              <button
                onClick={loadExample}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-600/50 text-gray-300 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors text-sm"
              >
                <Icons.Example /> Load Example
              </button>
            </div>
          </div>

          {/* Input/Output areas - flex-1 to grow */}
          <div className="grid lg:grid-cols-2 gap-4 mb-6 flex-1 min-h-0">
            {/* Input */}
            <div className="flex flex-col min-h-[250px] lg:min-h-0">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Input
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={category === 'hashing' ? 'Enter text to hash or select a file...' : 'Enter text to transform...'}
                className="flex-1 w-full px-4 py-4 rounded-xl bg-gray-800/50 border border-gray-600/50 text-white placeholder-gray-500 focus:border-indigo-500 transition-colors font-mono text-sm resize-none"
              />
              {selectedFile && category === 'hashing' && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm flex items-center gap-2">
                  <Icons.File />
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="text-gray-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {/* Output */}
            <div className="flex flex-col min-h-[250px] lg:min-h-0">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Output
              </label>
              <textarea
                value={output}
                readOnly
                placeholder="Result will appear here..."
                className="flex-1 w-full px-4 py-4 rounded-xl bg-gray-800/50 border border-gray-600/50 text-white placeholder-gray-500 font-mono text-sm resize-none"
              />
            </div>
          </div>

          {/* Hash verification (for hashing category) */}
          {category === 'hashing' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Expected Hash (for verification)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={expectedHash}
                  onChange={(e) => {
                    setExpectedHash(e.target.value);
                    setHashVerificationResult(null);
                  }}
                  placeholder="Enter expected hash to verify..."
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-600/50 text-white placeholder-gray-500 focus:border-indigo-500 transition-colors font-mono text-sm"
                />
                {hashVerificationResult !== null && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${hashVerificationResult ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {hashVerificationResult ? <Icons.Check /> : <Icons.X />}
                    {hashVerificationResult ? 'Match' : 'No Match'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress bar (for file operations) */}
          {isProcessing && fileProgress > 0 && (
            <div className="mb-6">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${fileProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1 text-center">{fileProgress}%</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {renderActions()}

            <div className="w-full sm:w-auto flex gap-3 justify-center mt-2 sm:mt-0">
              <button
                onClick={handleCopy}
                className="px-5 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/50 transition-all flex items-center gap-2"
                title="Copy output"
              >
                <Icons.Copy /> Copy
              </button>

              {category !== 'hashing' && (
                <button
                  onClick={handleSwap}
                  className="px-5 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/50 transition-all flex items-center gap-2"
                  title="Swap input/output"
                >
                  <Icons.Swap /> Swap
                </button>
              )}

              <button
                onClick={handleClear}
                className="px-5 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/50 transition-all flex items-center gap-2"
                title="Clear all"
              >
                <Icons.Clear /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-6 text-gray-500 text-sm">
          <p>
            Built with React + TailwindCSS | All processing happens locally in your browser
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
