'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      router.push(href);
    }, 1200);
  };

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && (window as any).Swal) {
      (window as any).Swal.fire({
        title: 'Coming Soon!',
        text: 'This feature is currently under development.',
        icon: 'info',
        confirmButtonColor: '#070642'
      });
    } else {
      alert('Coming Soon! This feature is currently under development.');
    }
  };

  return (
    <>
      {isNavigating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            position: 'relative',
            width: '200px',
            height: '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {}
            <div className="spinner-ring" style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              border: '8px solid #f3f3f3',
              borderTop: '8px solid #070642',
              borderRadius: '50%'
            }}></div>
            {}
            <Image
              src="/images/tru-icon.png"
              alt="Loading"
              width={100}
              height={100}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '100px',
                zIndex: 1
              }}
              priority
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner-ring {
          animation: spin 1s linear infinite;
        }
      `}} />

      <footer className="footer_section">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-3 col-sm-12">
              <div className="footer_link">
                <h5>TRU.COM</h5>
                <ul className="footer_ul_li">
                  <li>
                    <Link href="/all-blogs">Blogs</Link>
                  </li>
                  <li>
                    <Link href="/academic_institution">Academic Institutions</Link>
                  </li>
                  <li>
                    <Link href="/contact">Contact Us</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-3 col-md-3 col-sm-12">
              <div className="footer_link">
                <h5>Help</h5>
                <ul className="footer_ul_li">
                  <li>
                    <Link href="/career">Career</Link>
                  </li>
                  <li>
                    <a href="/login" onClick={(e) => handleLinkClick(e, '/login')}>Membership Details</a>
                  </li>
                  <li>
                    <Link href="/terms_condition">Terms & Conditions</Link>
                  </li>
                  <li>
                    <Link href="/contact">Customer Support</Link>
                  </li>
                  <li>
                    <Link href="/privacy_policy">Privacy Policy</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-2 col-md-2 col-sm-12">
              <div className="footer_link">
                <h5>Resources</h5>
                <ul className="footer_ul_li">
                  <li>
                    <Link href="/all-university">University</Link>
                  </li>
                  <li>
                    <a href="/login" onClick={(e) => handleLinkClick(e, '/login')}>Students</a>
                  </li>
                  <li>
                    <a href="#" onClick={handleComingSoon}>College Solution</a>
                  </li>
                  <li>
                    <a href="#" onClick={handleComingSoon}>Learning Hub</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-12">
              <div className="footer_img">
                <Image src="/images/footer-img.png" alt="Footer" width={400} height={200} />
              </div>
            </div>
          </div>
        </div>

        <div className="container copy_write_container">
          <div className="row">
            <div className="col-lg-8 col-md-8 col-sm-12 p-0">
              <div className="footer_copyright">
                <p>Copyright  Top Ranking University 2025 - All Rights Reserved.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-12">
              <div className="footer_icons">
                <ul className="footer_ul_li_icon">
                  <li>
                    <a
                      href="https://www.facebook.com/toprankinguniiversity"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Follow us on Facebook"
                    >
                      <i className="fa-brands fa-facebook-f"></i>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.instagram.com/toprankinguniiversity"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Follow us on Instagram"
                    >
                      <i className="fa-brands fa-instagram"></i>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.youtube.com/@toprankinguniiversity"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Subscribe on YouTube"
                    >
                      <i className="fa-brands fa-youtube"></i>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.twitter.com/toprankinguni"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Follow us on Twitter"
                    >
                      <i className="fa-brands fa-twitter"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
