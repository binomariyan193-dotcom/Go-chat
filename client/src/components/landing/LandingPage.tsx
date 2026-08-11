import React from 'react';
import { Button } from '../common/Button';
import { LoopInLogo } from '../common/LoopInLogo';
import {
  Zap,
  ShieldCheck,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  Smartphone,
  ArrowRight,
  Sparkles,
  Monitor,
} from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: 'linear-gradient(180deg, rgba(3, 8, 28, 0.75) 0%, rgba(3, 8, 28, 0.92) 100%), url("/images/landing_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: 'var(--text-primary)',
        flex: 1,
        fontFamily: 'var(--font-family)',
      }}
    >
      {/* Top Navbar */}
      <nav
        style={{
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'rgba(8, 16, 43, 0.85)',
          backdropFilter: 'blur(14px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <LoopInLogo size={34} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Button onClick={onLaunchApp} style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
            Launch App <ArrowRight size={16} />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '60px 24px 40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Pill Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '30px',
            backgroundColor: 'rgba(18, 62, 140, 0.25)',
            border: '1px solid var(--border-color)',
            color: '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          <Sparkles size={14} color="#38bdf8" /> Next-Gen Real-Time Communication Platform
        </div>

        {/* Main Heading */}
        <h1
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            maxWidth: '900px',
            marginBottom: '20px',
            background: 'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Stay in the loop with instant messaging & lossless photo sharing.
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            lineHeight: 1.6,
            marginBottom: '36px',
          }}
        >
          LoopIN connects you with your friends in real-time. Experience our WhatsApp-inspired Midnight Navy interface, WebP Lossless image sharing, and 15-second message editing.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '50px' }}>
          <Button onClick={onLaunchApp} style={{ padding: '14px 32px', fontSize: '1rem', borderRadius: 'var(--radius-lg)' }}>
            Get Started Free <ArrowRight size={18} />
          </Button>
        </div>

        {/* Desktop Web Browser Main Hero Mockup */}
        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '980px',
            borderRadius: '24px',
            padding: '12px',
            boxShadow: '0 25px 50px -12px rgba(3, 8, 28, 0.9), 0 0 60px rgba(18, 62, 140, 0.3)',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
          }}
        >
          {/* Mock Window Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px 16px 0 0', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#10b981' }} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              LoopIN Desktop Web Interface
            </span>
            <div style={{ width: 30 }} />
          </div>

          <img
            src="/images/web_preview.png"
            alt="LoopIN Desktop Web Browser Application Interface"
            style={{
              width: '100%',
              maxHeight: '540px',
              objectFit: 'cover',
              borderRadius: '12px',
              display: 'block',
            }}
          />
        </div>
      </section>

      {/* Scrolling Page Feature & Mobile App Showcase */}
      <section style={{ maxWidth: '1100px', margin: '40px auto 60px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>Unified Experience Across All Devices</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Enjoy the same powerful messaging features whether you are on your laptop or mobile phone.
          </p>
        </div>

        {/* Side-by-Side Scrolling Showcase Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'center' }}>
          {/* Desktop Web Browser Showcase */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Monitor size={22} color="#38bdf8" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Desktop Web Browser View</h3>
            </div>
            <img
              src="/images/web_preview.png"
              alt="Desktop web browser interface sample"
              style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-color)' }}
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'left' }}>
              Dual-pane sidebar layout designed for desktop displays, featuring instant search, live unread counters, and WebP image cropping.
            </p>
          </div>

          {/* Mobile Smartphone Showcase */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Smartphone size={22} color="#ec4899" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Mobile App View</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <img
                src="/images/mobile_preview.png"
                alt="Mobile smartphone interface sample"
                style={{ width: '100%', maxWidth: '320px', maxHeight: '340px', objectFit: 'contain', borderRadius: '16px', border: '1px solid var(--border-color)' }}
              />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'left' }}>
              Responsive single-pane drawer navigation with 1-tap back button ⬅️, anti-zoom touch inputs, and dynamic viewport fitting.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>Why Choose LoopIN?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Built with modern architecture for speed, privacy, and visual elegance.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Feature 1 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(18, 62, 140, 0.3)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Zap size={22} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Real-Time Messaging</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Instant WebSockets delivery with live typing indicators, online presence, and unread message badges.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.2)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <ImageIcon size={22} color="#a855f7" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>WebP Lossless Photos</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Share images at 100% pixel fidelity with built-in interactive cropping and full-screen lightbox preview.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Clock size={22} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>15-Second Message Edits</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Made a typo? Edit sent messages within a 15-second window with instant room updates.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <ShieldCheck size={22} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Friend Request Privacy</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Search users strictly by username without exposing email addresses. 1-on-1 chats require accepted requests.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.2)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Smartphone size={22} color="#ec4899" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Mobile Responsive</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Single-pane view switching, 100dvh viewport fitting, and anti-zoom touch controls for mobile web.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <MessageSquare size={22} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Audio & Unread Alerts</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Web Audio API chime notifications and dynamic browser tab indicators ensure you never miss a message.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
        <LoopInLogo size={24} />
        <p>© 2026 LoopIN. All rights reserved.</p>
      </footer>
    </div>
  );
};
