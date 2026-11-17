'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Loader2, X } from 'lucide-react';

export default function KuickPayCheckoutInline({
  sessionId,
  baseUrl = 'http://localhost:3000',
  onSuccess,
  onFailed,
  onClose,
  minHeight = 620,
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(minHeight);

  const normalizedBaseUrl = (baseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  const embedUrl = `${normalizedBaseUrl}/embed/${encodeURIComponent(sessionId || '')}`;

  useEffect(() => {
    setIframeLoaded(false);
  }, [sessionId]);

  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.data;
      if (!data || data.source !== 'kuickpay-checkout') return;

      console.log('[KuickPay Inline Event]:', data);

      switch (data.type) {
        case 'KUICKPAY_READY':
          setIframeLoaded(true);
          break;

        case 'KUICKPAY_RESIZE':
          if (data.height && Number(data.height) > 300) {
            setIframeHeight(Number(data.height));
          }
          break;

        case 'KUICKPAY_SUCCESS':
          if (onSuccess) onSuccess(data);
          break;

        case 'KUICKPAY_FAILED':
          if (onFailed) onFailed(data);
          break;

        case 'KUICKPAY_CLOSE':
          if (onClose) onClose();
          break;

        case 'KUICKPAY_ERROR':
          if (onFailed) onFailed({ message: data.message || 'Payment session error' });
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onFailed, onClose]);

  if (!sessionId) return null;

  return (
    <div
      className="kuickpay-inline-card"
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'red',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.2s ease',
      }}
    >
      {/* Header Banner */}
      {/* <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #1230C4 0%, #2F8FEF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={13} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
              KuickPay Embedded Checkout
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={11} color="#10B981" /> 256-bit Encrypted Inline Payment
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cancel Payment"
            title="Cancel and return to basket"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
          >
            <X size={13} /> Cancel
          </button>
        )}
      </div> */}

      {/* Loading Skeleton Indicator */}
      {!iframeLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 54,
            left: 0,
            right: 0,
            bottom: 0,
            minHeight: `${iframeHeight}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            backgroundColor: '#FAFAF9',
            zIndex: 2,
          }}
        >
          <Loader2
            size={32}
            color="#1230C4"
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <p style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
            Loading secure payment gateway…
          </p>
        </div>
      )}

      {/* Inline Checkout Iframe */}
      <iframe
        src={embedUrl}
        title="KuickPay Inline Checkout"
        style={{
          width: '100%',
          height: `${iframeHeight}px`,
          border: 'none',
          display: 'block',
          backgroundColor: '#FAFAF9',
          transition: 'height 0.2s ease',
        }}
        onLoad={() => setIframeLoaded(true)}
        allow="payment *"
      />
    </div>
  );
}
