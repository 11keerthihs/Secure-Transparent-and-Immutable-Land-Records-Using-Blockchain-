import React, { useState } from 'react';
import { calculateFileHash } from '../utils/crypto';
import { FileCheck, UploadCloud, Copy, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface DocumentHashVerifierProps {
  expectedHash?: string;
  onHashGenerated?: (hash: string) => void;
  title?: string;
}

export const DocumentHashVerifier: React.FC<DocumentHashVerifierProps> = ({
  expectedHash,
  onHashGenerated,
  title = 'Document Integrity & SHA-256 Hasher',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [manualCompareHash, setManualCompareHash] = useState<string>('');

  const targetComparison = expectedHash || manualCompareHash;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsHashing(true);
    try {
      const calculated = await calculateFileHash(selectedFile);
      setHash(calculated);
      if (onHashGenerated) {
        onHashGenerated(calculated);
      }
    } catch (err) {
      console.error('Hashing error:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const copyHash = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMatch = targetComparison && hash && targetComparison.toLowerCase().trim() === hash.toLowerCase().trim();
  const isMismatch = targetComparison && hash && targetComparison.toLowerCase().trim() !== hash.toLowerCase().trim();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-5 h-5 text-blue-400" />
        <h4 className="font-semibold text-white text-sm">{title}</h4>
      </div>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        The original deed or survey plan is hashed locally in your browser using the Web Crypto SHA-256 algorithm. The immutable digest proves document integrity without exposing sensitive document contents on the public ledger.
      </p>

      {/* Drop zone */}
      <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg p-5 text-center transition bg-slate-950/60 cursor-pointer">
        <input
          type="file"
          id="doc-hasher-input"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud className="w-8 h-8 text-blue-400 mb-2" />
          <p className="text-xs font-medium text-slate-200">
            {file ? file.name : 'Upload title deed, survey map, or sale contract (PDF/Image)'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Browser-side SHA-256 calculation • No file uploaded to server'}
          </p>
        </div>
      </div>

      {/* Generated Hash Box */}
      {hash && (
        <div className="mt-4 p-3.5 bg-slate-950 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Computed SHA-256 Cryptographic Hash:</span>
            <button
              onClick={copyHash}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono text-[11px]"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Hash'}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-emerald-400 break-all select-all font-semibold">
            {hash}
          </div>
        </div>
      )}

      {/* Comparison section if expectedHash is provided or manually entered */}
      {!expectedHash && (
        <div className="mt-3">
          <label className="block text-[11px] text-slate-400 mb-1">
            Verify against an existing Blockchain Document Hash (optional):
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={manualCompareHash}
            onChange={(e) => setManualCompareHash(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Match Result Banner */}
      {isMatch && (
        <div className="mt-3 p-3 bg-emerald-950/60 border border-emerald-600/80 rounded-lg flex items-center gap-2.5 text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong>100% Document Hash Match: Verified Authentic!</strong>
            <p className="text-[11px] text-emerald-400/90 mt-0.5">
              The digital fingerprint of this uploaded file matches the immutable record registered on the blockchain. The document has not been altered or tampered with.
            </p>
          </div>
        </div>
      )}

      {isMismatch && (
        <div className="mt-3 p-3 bg-rose-950/60 border border-rose-600/80 rounded-lg flex items-center gap-2.5 text-rose-300 text-xs">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong>Hash Mismatch: Potential Document Tampering Detected!</strong>
            <p className="text-[11px] text-rose-400/90 mt-0.5">
              The hash computed from this file does not match the registered on-chain document hash. Content has been modified, corrupted, or is from a different document version.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
