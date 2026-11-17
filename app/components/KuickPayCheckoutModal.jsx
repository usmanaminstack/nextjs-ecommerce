'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Lock, ShieldCheck, Loader2 } from 'lucide-react';

export default function KuickPayCheckoutModal({
  isOpen,
  sessionId,
  baseUrl = 'http://localhost:3000',
  onClose,
  onSuccess,
  onFailed,
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Normalize baseUrl (strip trailing slash)
  const normalizedBaseUrl = (baseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  const embedUrl = `${normalizedBaseUrl}/embed/${encodeURIComponent(sessionId || '')}`;

  // Reset loading state when session changes
  useEffect(() => {
    if (isOpen) {
      setIframeLoaded(false);
    }
  }, [isOpen, sessionId]);

  // Handle postMessage events from KuickPay checkout iframe
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event) => {
      const data = event.data;
      if (!data || data.source !== 'kuickpay-checkout') return;

      console.log('[KuickPay Embedded Event]:', data);

      switch (data.type) {
        case 'KUICKPAY_READY':
          setIframeLoaded(true);
          break;

        case 'KUICKPAY_SUCCESS':
          if (onSuccess) {
            onSuccess(data);
          }
          break;

        case 'KUICKPAY_FAILED':
          if (onFailed) {
            onFailed(data);
          }
          break;

        case 'KUICKPAY_CLOSE':
          if (onClose) {
            onClose();
          }
          break;

        case 'KUICKPAY_ERROR':
          if (onFailed) {
            onFailed({ message: data.message || 'Payment session error' });
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Close on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, onSuccess, onFailed]);

  if (!isOpen || !sessionId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="KuickPay Secure Checkout"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'kpFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          height: '92vh',
          maxHeight: '740px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'kpScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #1230C4 0%, #2F8FEF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={13} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                KuickPay Secure Checkout
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={11} color="#10B981" /> 256-bit Encrypted • Embedded Gateway
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Checkout"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.24)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Loading Spinner Skeleton */}
        {!iframeLoaded && (
          <div
            style={{
              position: 'absolute',
              top: '56px',
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#FAFAF9',
              zIndex: 1,
            }}
          >
            <Loader2
              size={32}
              color="#1230C4"
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
              Connecting to secure payment gateway…
            </p>
          </div>
        )}

        {/* KuickPay Embed Iframe */}
        <iframe
          src={embedUrl}
          title="KuickPay Embedded Checkout"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            flex: 1,
            backgroundColor: '#FAFAF9',
          }}
          onLoad={() => setIframeLoaded(true)}
          allow="payment *"
        />
      </div>

      <style jsx global>{`
        @keyframes kpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes kpScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
