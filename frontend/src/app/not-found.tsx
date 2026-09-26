import Link from 'next/link';
import { Store, ArrowLeft, PhoneCall } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      textAlign: 'center',
      backgroundColor: '#f8fafc',
    }}>
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        backgroundColor: '#eff6ff',
        color: '#2563eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.25rem',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
      }}>
        <Store size={36} />
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
        Page or Product Not Found
      </h1>

      <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1.75rem auto', lineHeight: 1.6 }}>
        The item or page you are looking for is currently unavailable, undergoing updates, or moved. Explore our active store catalog or contact our team directly.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/products"
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.875rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
          }}
        >
          <ArrowLeft size={16} /> Browse All Products
        </Link>

        <a
          href="tel:9631410611"
          style={{
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            fontWeight: 700,
            fontSize: '0.875rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <PhoneCall size={16} color="#059669" /> Call Store (9631410611)
        </a>
      </div>
    </div>
  );
}
