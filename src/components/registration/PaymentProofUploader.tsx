/**
 * TARAS 2K26 — Payment Proof Uploader Component
 *
 * Responsibilities:
 * 1. File selection (drag & drop / click) with 5 MB input limit validation
 * 2. Instant client-side compression & resizing (Canvas API, max 1600px, WebP/JPEG)
 * 3. Transparent size comparison display (Original vs Optimized & % reduction)
 * 4. Crisp readable preview so participant can verify UTR, date, and amount
 * 5. Smooth upload progress tracking (0% -> 100%)
 * 6. Duplicate upload prevention & network failure retry
 * 7. Mobile memory leak prevention via blob URL revocation
 */

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
  FileCheck2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  compressPaymentScreenshot,
  revokeOptimizedImagePreview,
  type OptimizedImageResult,
  MAX_INPUT_FILE_SIZE_BYTES,
} from '../../utils/imageCompression';
import {
  uploadPaymentProofToSupabase,
  type SupabasePaymentProofMetadata,
} from '../../services/paymentProofStorageService';

export type UploadState = 'idle' | 'compressing' | 'ready' | 'uploading' | 'success' | 'error';

export interface PaymentProofUploaderRef {
  /** Upload the currently optimized image to Supabase Storage */
  upload: () => Promise<SupabasePaymentProofMetadata>;
  /** Check if a valid screenshot has been optimized and is ready for upload */
  isReady: boolean;
  /** Check if an upload is currently in flight */
  isUploading: boolean;
  /** Reset uploader state */
  reset: () => void;
  /** Get current optimized image result */
  getOptimizedImage: () => OptimizedImageResult | null;
}

interface PaymentProofUploaderProps {
  registrationId: string;
  existingScreenshotUrl?: string;
  onStateChange?: (state: UploadState) => void;
  disabled?: boolean;
}

export const PaymentProofUploader = forwardRef<PaymentProofUploaderRef, PaymentProofUploaderProps>(
  ({ registrationId, existingScreenshotUrl, onStateChange, disabled = false }, ref) => {
    const [state, setState] = useState<UploadState>(existingScreenshotUrl ? 'success' : 'idle');
    const [optimizedResult, setOptimizedResult] = useState<OptimizedImageResult | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentUploadPromiseRef = useRef<Promise<SupabasePaymentProofMetadata> | null>(null);
    const latestOptimizedRef = useRef<OptimizedImageResult | null>(null);

    latestOptimizedRef.current = optimizedResult;

    // Cleanup object URL on unmount to avoid memory leaks
    useEffect(() => {
      return () => {
        if (latestOptimizedRef.current?.previewUrl) {
          revokeOptimizedImagePreview(latestOptimizedRef.current.previewUrl);
        }
      };
    }, []);

    // Notify parent of state changes
    useEffect(() => {
      onStateChange?.(state);
    }, [state, onStateChange]);

    // Handle file selection and immediate client-side compression
    const processSelectedFile = async (file: File) => {
      if (!file) return;

      // 1. Input limit check: 1 MB (1,048,576 bytes)
      if (file.size > MAX_INPUT_FILE_SIZE_BYTES) {
        setErrorMessage('Payment proof file must be 1 MB or smaller.');
        setState('error');
        return;
      }

      setErrorMessage(null);
      setState('compressing');

      try {
        // Clean up previous blob preview if replacing
        if (optimizedResult?.previewUrl) {
          revokeOptimizedImagePreview(optimizedResult.previewUrl);
        }

        const result = await compressPaymentScreenshot(file);
        setOptimizedResult(result);
        setState('ready');
        setUploadProgress(0);
      } catch (err: any) {
        console.error('Image optimization error:', err);
        setErrorMessage(err.message || 'Failed to process image. Please choose another screenshot.');
        setState('error');
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processSelectedFile(file);
      }
      // Reset input value so re-selecting same file triggers onChange
      if (e.target) {
        e.target.value = '';
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled || state === 'uploading') return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processSelectedFile(file);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && state !== 'uploading') {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const handleChangeScreenshot = () => {
      if (state === 'uploading') return;
      if (optimizedResult?.previewUrl) {
        revokeOptimizedImagePreview(optimizedResult.previewUrl);
      }
      setOptimizedResult(null);
      setErrorMessage(null);
      setUploadProgress(0);
      setState('idle');
      setTimeout(() => fileInputRef.current?.click(), 50);
    };

    // Actual upload logic invoked when user clicks Submit or Retry
    const executeUpload = async (): Promise<SupabasePaymentProofMetadata> => {
      // If already uploaded and no new image picked, return existing
      if (state === 'success' && existingScreenshotUrl && !optimizedResult) {
        return {
          provider: 'supabase',
          bucket: 'payment-proofs',
          path: '',
          fileSize: 0,
          contentType: 'image/webp',
          uploadedAt: new Date().toISOString(),
          signedUrl: existingScreenshotUrl,
        };
      }

      if (!optimizedResult) {
        throw new Error('Please select a payment screenshot proof first.');
      }

      // Prevent duplicate upload calls in parallel
      if (currentUploadPromiseRef.current) {
        return currentUploadPromiseRef.current;
      }

      setState('uploading');
      setErrorMessage(null);
      setUploadProgress(10);

      const uploadPromise = uploadPaymentProofToSupabase(
        registrationId,
        optimizedResult.file,
        (progress) => {
          setUploadProgress(progress);
        }
      )
        .then((res) => {
          setState('success');
          setUploadProgress(100);
          return res;
        })
        .catch((err) => {
          console.error('Upload execution failed:', err);
          setState('error');
          setErrorMessage(
            err.message ||
              'Payment proof upload failed. Your registration is still saved. Please retry.'
          );
          throw err;
        })
        .finally(() => {
          currentUploadPromiseRef.current = null;
        });

      currentUploadPromiseRef.current = uploadPromise;
      return uploadPromise;
    };

    // Expose control handles via ref for parent form coordination
    useImperativeHandle(ref, () => ({
      upload: executeUpload,
      isReady: state === 'ready' || (state === 'success' && !!existingScreenshotUrl),
      isUploading: state === 'uploading',
      reset: () => {
        if (optimizedResult?.previewUrl) {
          revokeOptimizedImagePreview(optimizedResult.previewUrl);
        }
        setOptimizedResult(null);
        setErrorMessage(null);
        setUploadProgress(0);
        setState(existingScreenshotUrl ? 'success' : 'idle');
      },
      getOptimizedImage: () => optimizedResult,
    }));

    return (
      <div className="space-y-3 font-mono text-xs">
        {/* Hidden native input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          disabled={disabled || state === 'uploading'}
          className="hidden"
          id="payment-screenshot-input"
        />

        {/* ── STATE: IDLE (Dropzone) ── */}
        {state === 'idle' && (
          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`cursor-pointer p-6 rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center space-y-2.5 ${
              isDragOver
                ? 'border-[#dc2626] bg-[#1a0000]/60 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                : 'border-[#dc2626]/40 bg-[#0a0c10]/90 hover:border-[#dc2626] hover:bg-[#12141a]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="w-11 h-11 rounded-2xl bg-[#1a0000] border border-[#dc2626]/50 flex items-center justify-center text-[#dc2626] shadow-md">
              <Upload className="w-5 h-5" />
            </div>

            <div>
              <span className="font-bold text-white text-xs block">
                Select Payment Proof File
              </span>
              <span className="text-[11px] text-slate-400 font-light block mt-0.5">
                Drag &amp; drop or click to browse
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                Max 1 MB
              </span>
              <span>•</span>
              <span className="text-slate-300">JPG, PNG, PDF</span>
              <span>•</span>
              <span className="text-[#dc2626] font-bold">Auto-Optimized</span>
            </div>
          </div>
        )}

        {/* ── STATE: COMPRESSING ── */}
        {state === 'compressing' && (
          <div className="p-6 rounded-2xl bg-[#0a0c10] border border-[#dc2626]/60 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
            <RefreshCw className="w-6 h-6 text-[#dc2626] animate-spin" />
            <div>
              <span className="font-bold text-white text-xs block">
                Optimizing Payment Screenshot...
              </span>
              <span className="text-[10px] text-slate-400 font-light mt-0.5 block">
                Resizing to 1600px &amp; converting to sharp WebP (preserving UTR &amp; transaction text)
              </span>
            </div>
          </div>
        )}

        {/* ── STATE: READY (Optimized & Preview) ── */}
        {(state === 'ready' || (state === 'uploading' && optimizedResult)) && optimizedResult && (
          <div className="p-4 rounded-2xl bg-[#080a0e] border border-[#dc2626]/50 shadow-xl space-y-3.5">
            {/* Header: Status & Actions */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate max-w-[220px]">
                  {optimizedResult.originalFileName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleChangeScreenshot}
                disabled={state === 'uploading'}
                className="text-[11px] text-[#dc2626] hover:text-white font-bold tracking-wider uppercase transition-colors disabled:opacity-50"
              >
                Change Screenshot
              </button>
            </div>

            {/* Optimization Metrics Card */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#0f1218] border border-white/10 text-center">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Original</span>
                <span className="text-xs font-bold text-slate-300">
                  {optimizedResult.originalSizeFormatted}
                </span>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[9px] text-slate-400 block uppercase">Optimized</span>
                <span className="text-xs font-bold text-green-400">
                  {optimizedResult.optimizedSizeFormatted}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Reduction</span>
                <span className="text-xs font-black text-[#dc2626] flex items-center justify-center gap-0.5">
                  <Sparkles className="w-3 h-3" /> {optimizedResult.reductionPercent}%
                </span>
              </div>
            </div>

            {/* Preview Box with Resolution Badge */}
            <div className="relative group rounded-xl overflow-hidden border border-white/15 bg-black/80 flex items-center justify-center max-h-48">
              <img
                src={optimizedResult.previewUrl}
                alt="Optimized payment screenshot preview"
                className="max-h-48 w-full object-contain p-1"
              />

              {/* Resolution overlay tag */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-white/20 text-[9px] text-slate-300 backdrop-blur-md">
                {optimizedResult.width} × {optimizedResult.height} px
              </div>

              {/* Enlarge preview button */}
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-sm"
              >
                <Eye className="w-4 h-4" /> Click to Inspect Text Clarity
              </button>
            </div>

            {/* Upload Progress Bar (when uploading) */}
            {state === 'uploading' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 text-[#dc2626] animate-spin" />
                    Uploading payment proof...
                  </span>
                  <span className="text-[#dc2626] font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-green-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STATE: SUCCESS ── */}
        {state === 'success' && (
          <div className="p-4 rounded-2xl bg-[#0a140f] border border-green-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Payment Proof Uploaded Successfully
                </span>
                <span className="text-[10px] text-green-400/80 font-light">
                  {optimizedResult ? `Stored optimized at ${optimizedResult.optimizedSizeFormatted}` : 'Securely stored in Firebase Storage'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleChangeScreenshot}
              disabled={disabled}
              className="px-3 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1a202c] border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-all shrink-0"
            >
              Replace Screenshot
            </button>
          </div>
        )}

        {/* ── STATE: ERROR & RETRY ── */}
        {state === 'error' && (
          <div className="p-4 rounded-2xl bg-[#1a0808] border border-[#dc2626] space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Upload Notice</span>
                <p className="text-[11px] text-red-300 font-light leading-relaxed">
                  {errorMessage || 'Payment proof upload failed. Please try again.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleChangeScreenshot}
                className="px-3 py-1.5 rounded-lg text-[10px] text-slate-300 hover:text-white font-mono transition-colors"
              >
                Choose Different File
              </button>

              {optimizedResult && (
                <button
                  type="button"
                  onClick={() => executeUpload()}
                  className="px-4 py-1.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-[10px] tracking-wider transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Upload
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── FULL PREVIEW MODAL (Verification of UTR/Date clarity) ── */}
        {previewModalOpen && optimizedResult && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewModalOpen(false)}
          >
            <div
              className="relative max-w-2xl w-full bg-[#0a0c10] border border-white/20 rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-white text-xs">
                    Optimized Proof Clarity Inspection
                  </span>
                </div>

                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-auto rounded-xl bg-black/90 border border-white/10 flex items-center justify-center p-2">
                <img
                  src={optimizedResult.previewUrl}
                  alt="Full proof inspect"
                  className="max-h-[65vh] object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>
                  Size: <strong className="text-green-400">{optimizedResult.optimizedSizeFormatted}</strong> ({optimizedResult.reductionPercent}% smaller)
                </span>
                <span>
                  Resolution: <strong>{optimizedResult.width} × {optimizedResult.height}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
