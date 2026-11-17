'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Sparkles, Terminal, Copy, Check,
  ArrowLeft, RefreshCw, Play, Layers, Code, CheckCircle2,
  AlertCircle, LayoutTemplate, Eye
} from 'lucide-react';
import KuickPayCheckoutModal from '../components/KuickPayCheckoutModal';
import KuickPayCheckoutInline from '../components/KuickPayCheckoutInline';

export default function SdkCheckoutPlayground() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [sessionId, setSessionId] = useState('');
  const [checkoutMode, setCheckoutMode] = useState('modal'); // 'modal' | 'inline'
  const [currency, setCurrency] = useState('AED'); // 'AED' (default) | 'PKR'
  const [eventLogs, setEventLogs] = useState([]);
  const [copied, setCopied] = useState(false);

  // React Triggers
  const [isReactModalOpen, setIsReactModalOpen] = useState(false);
  const [isReactInlineOpen, setIsReactInlineOpen] = useState(false);

  useEffect(() => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionId(`TEST-SESSION-${randomHex}`);
  }, []);

  // Listen for all KuickPay checkout events globally to display in the live terminal
  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.data;
      if (!data || data.source !== 'kuickpay-checkout') return;

      const logEntry = {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        type: data.type,
        payload: data,
      };

      setEventLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addLog = (type, payload) => {
    setEventLogs((prev) => [
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        type,
        payload,
      },
      ...prev.slice(0, 19),
    ]);
  };

  const generateNewSession = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newId = `TEST-SESSION-${randomHex}`;
    setSessionId(newId);
    addLog('SYSTEM_INFO', { message: 'Generated fresh test sessionId: ' + newId });
  };

  // Option A: Trigger KuickPay SDK
  const handleSdkOpen = () => {
    if (typeof window !== 'undefined' && window.KuickPay && typeof window.KuickPay.open === 'function') {
      addLog('SDK_TRIGGER', { method: 'KuickPay.open()', baseUrl, sessionId, mode: checkoutMode });

      if (checkoutMode === 'inline') {
        window.KuickPay.open({
          baseUrl,
          sessionId,
          mode: 'inline',
          target: '#sdk-inline-mount-point',
          onReady: () => addLog('CALLBACK_READY', { message: 'Inline checkout ready' }),
          onSuccess: (data) => {
            addLog('CALLBACK_SUCCESS', data);
            alert(`🎉 Payment Approved! Transaction ID: ${data.transactionID || 'TXN-OK'}`);
          },
          onFailed: (error) => {
            addLog('CALLBACK_FAILED', error);
            alert(`❌ Payment Failed: ${error?.message || 'Declined'}`);
          },
          onClose: () => addLog('CALLBACK_CLOSE', { message: 'Inline checkout closed' }),
        });
      } else {
        window.KuickPay.open({
          baseUrl,
          sessionId,
          mode: 'modal',
          closeOnBackdrop: true,
          closeOnEscape: true,
          onReady: () => addLog('CALLBACK_READY', { message: 'Modal checkout ready' }),
          onSuccess: (data) => {
            addLog('CALLBACK_SUCCESS', data);
            alert(`🎉 Payment Approved! Transaction ID: ${data.transactionID || 'TXN-OK'}`);
          },
          onFailed: (error) => {
            addLog('CALLBACK_FAILED', error);
            alert(`❌ Payment Failed: ${error?.message || 'Declined'}`);
          },
          onClose: () => addLog('CALLBACK_CLOSE', { message: 'Customer closed modal' }),
        });
      }
    } else {
      addLog('SDK_FALLBACK', {
        message: 'window.KuickPay not loaded. Fallback directly to React component.',
      });
      if (checkoutMode === 'inline') {
        setIsReactInlineOpen(true);
      } else {
        setIsReactModalOpen(true);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', padding: '2rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

        {/* Back Link */}
        <button
          onClick={() => window.location.href = '/'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            color: '#64748B',
            fontSize: '0.88rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1.5rem',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back to Storefront
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#E0E7FF', color: '#3730A3', padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, marginBottom: 8 }}>
              <Layers size={12} /> KuickPay Embedded Checkout v2.0
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              Modal & Inline Checkout Playground
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.95rem', margin: 0, maxWidth: '640px' }}>
              Test both <strong>Modal (Popup)</strong> and <strong>Inline (Embedded On-Page)</strong> checkout flows with live postMessage event debugging.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600 }}>
              <ShieldCheck size={14} /> Modal + Inline Supported
            </div>
          </div>
        </div>

        {/* Grid Layout: Config + Triggers on Left, Event Log on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: '1.5rem' }}>

          {/* Left Column: Controls & Integration Methods */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Config Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem' }}>Playground Configuration</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Checkout Base URL (Frontend App hosting /embed & SDK)
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      outline: 'none',
                    }}
                    placeholder="https://checkout.kuickpay.com or http://localhost:3000"
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4, display: 'block' }}>
                    Production: <code>https://checkout.kuickpay.com</code> | Local: <code>http://localhost:3000</code>
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                      Session ID
                    </label>
                    <button
                      onClick={generateNewSession}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#1230C4',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <RefreshCw size={12} /> Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Currency Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Currency
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setCurrency('AED')}
                      style={{
                        padding: '8px',
                        borderRadius: 8,
                        border: currency === 'AED' ? '2px solid #1230C4' : '1px solid #CBD5E1',
                        backgroundColor: currency === 'AED' ? '#EFF6FF' : '#FFFFFF',
                        color: currency === 'AED' ? '#1230C4' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      🇦🇪 AED (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('PKR')}
                      style={{
                        padding: '8px',
                        borderRadius: 8,
                        border: currency === 'PKR' ? '2px solid #1230C4' : '1px solid #CBD5E1',
                        backgroundColor: currency === 'PKR' ? '#EFF6FF' : '#FFFFFF',
                        color: currency === 'PKR' ? '#1230C4' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      🇵🇰 PKR
                    </button>
                  </div>
                </div>

                {/* Mode Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Test Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setCheckoutMode('modal')}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: checkoutMode === 'modal' ? '2px solid #1230C4' : '1px solid #CBD5E1',
                        backgroundColor: checkoutMode === 'modal' ? '#EFF6FF' : '#FFFFFF',
                        color: checkoutMode === 'modal' ? '#1230C4' : '#475569',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Sparkles size={14} /> Modal Popup
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutMode('inline')}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: checkoutMode === 'inline' ? '2px solid #1230C4' : '1px solid #CBD5E1',
                        backgroundColor: checkoutMode === 'inline' ? '#EFF6FF' : '#FFFFFF',
                        color: checkoutMode === 'inline' ? '#1230C4' : '#475569',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <LayoutTemplate size={14} /> Inline Embed
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Method A: Drop-in SDK */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1230C4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Option A
                </span>
                <span style={{ fontSize: '0.72rem', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                  kuickpay-checkout.js
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>Universal JS SDK</h3>
              <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '0 0 1rem' }}>
                Calls <code>KuickPay.open({`{ mode: '${checkoutMode}' }`})</code> with event callbacks.
              </p>

              <button
                onClick={handleSdkOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#1230C4',
                  color: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: 10,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(18, 48, 196, 0.2)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Play size={16} /> Launch via KuickPay.open() ({checkoutMode})
              </button>
            </div>

            {/* Method B: React Components */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Option B
                </span>
                <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                  Pure React Components
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>React Components</h3>
              <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '0 0 1rem' }}>
                Directly drop into your JSX tree without depending on external script loading.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => setIsReactModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={14} /> &lt;Modal /&gt;
                </button>

                <button
                  onClick={() => setIsReactInlineOpen(!isReactInlineOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: isReactInlineOpen ? '#DC2626' : '#047857',
                    color: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  <LayoutTemplate size={14} /> {isReactInlineOpen ? 'Hide Inline' : 'Show <Inline />'}
                </button>
              </div>
            </div>

            {/* SDK Mount Target for Inline SDK Testing */}
            <div id="sdk-inline-mount-point" />

          </div>

          {/* Right Column: Real-time Event Logger & Live Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Inline React Preview Card (if open) */}
            {isReactInlineOpen && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <KuickPayCheckoutInline
                  sessionId={sessionId}
                  baseUrl={baseUrl}
                  onClose={() => {
                    setIsReactInlineOpen(false);
                    addLog('REACT_INLINE_CLOSE', { message: 'Customer closed inline frame' });
                  }}
                  onSuccess={(data) => {
                    addLog('REACT_INLINE_SUCCESS', data);
                    alert(`🎉 Paid! Order: ${data.orderID || 'OK'}, Transaction: ${data.transactionID || 'TXN-OK'}`);
                  }}
                  onFailed={(err) => {
                    addLog('REACT_INLINE_FAILED', err);
                    alert(`❌ Failed: ${err?.message || 'Declined'}`);
                  }}
                />
              </div>
            )}

            {/* Terminal Event Stream */}
            <div style={{ backgroundColor: '#0B0F19', borderRadius: 16, border: '1px solid #1E293B', padding: '1.5rem', display: 'flex', flexDirection: 'column', color: '#E2E8F0', minHeight: '480px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={18} color="#38BDF8" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#F8FAFC' }}>
                    Live postMessage Event Stream
                  </span>
                </div>
                <button
                  onClick={() => setEventLogs([])}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#94A3B8',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear Log
                </button>
              </div>

              {/* Log Stream Area */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '520px', paddingRight: 4 }}>
                {eventLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#475569' }}>
                    <Terminal size={28} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>Waiting for KuickPay checkout events…</p>
                    <p style={{ fontSize: '0.75rem', marginTop: 4 }}>Click a launch button on the left to start testing.</p>
                  </div>
                ) : (
                  eventLogs.map((log) => {
                    let badgeColor = '#38BDF8';
                    let badgeBg = 'rgba(56, 189, 248, 0.12)';
                    if (log.type === 'KUICKPAY_SUCCESS' || log.type === 'CALLBACK_SUCCESS' || log.type === 'REACT_MODAL_SUCCESS' || log.type === 'REACT_INLINE_SUCCESS') {
                      badgeColor = '#4ADE80';
                      badgeBg = 'rgba(74, 222, 128, 0.15)';
                    } else if (log.type === 'KUICKPAY_FAILED' || log.type === 'CALLBACK_FAILED' || log.type === 'KUICKPAY_ERROR') {
                      badgeColor = '#F87171';
                      badgeBg = 'rgba(248, 113, 113, 0.15)';
                    } else if (log.type === 'KUICKPAY_CLOSE' || log.type === 'CALLBACK_CLOSE' || log.type === 'REACT_MODAL_CLOSE' || log.type === 'REACT_INLINE_CLOSE') {
                      badgeColor = '#FBBF24';
                      badgeBg = 'rgba(251, 191, 36, 0.15)';
                    }

                    return (
                      <div
                        key={log.id}
                        style={{
                          backgroundColor: '#111827',
                          borderRadius: 8,
                          padding: '10px 12px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ color: badgeColor, backgroundColor: badgeBg, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {log.type}
                          </span>
                          <span style={{ color: '#64748B', fontSize: '0.7rem' }}>{log.time}</span>
                        </div>
                        <pre style={{ margin: 0, color: '#CBD5E1', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.74rem' }}>
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #1E293B', fontSize: '0.72rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                <span>Origin verification: <code>kuickpay-checkout</code></span>
                <span>Events logged: {eventLogs.length}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Render React Modal Component when triggered */}
      <KuickPayCheckoutModal
        isOpen={isReactModalOpen}
        sessionId={sessionId}
        baseUrl={baseUrl}
        onClose={() => {
          setIsReactModalOpen(false);
          addLog('REACT_MODAL_CLOSE', { message: 'Customer closed modal' });
        }}
        onSuccess={(data) => {
          setIsReactModalOpen(false);
          addLog('REACT_MODAL_SUCCESS', data);
          alert(`🎉 Payment Successful! Order ID: ${data.orderID || 'OK'}, Transaction: ${data.transactionID || 'TXN-OK'}`);
        }}
        onFailed={(err) => {
          addLog('REACT_MODAL_FAILED', err);
          alert(`❌ Payment Failed: ${err?.message || 'Declined'}`);
        }}
      />
    </div>
  );
}
