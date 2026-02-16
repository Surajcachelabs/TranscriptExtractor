import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Providers from './providers';
import AuthButton from './components/AuthButton';

export const metadata: Metadata = {
  title: 'Drive Video Transcriber',
  description: 'Transcribe Google Drive videos with Whisper',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'rgba(6, 10, 20, 0.82)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div
              style={{
                maxWidth: '1100px',
                margin: '0 auto',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1ed6b5, #45c4ff)',
                  }}
                />
                <span style={{ fontWeight: 700, fontSize: 18 }}>Drive Video Transcriber</span>
              </div>
              <AuthButton />
            </div>
          </header>
          <main className="main-shell">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
