'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsLoading(true);

    const handleLoad = () => {
      setIsLoading(false);
    };

    if (document.readyState === 'complete') {
      setIsLoading(false);
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      router.push('/login');
    }, 1200);
  };

  const handleSignupClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      router.push('/signup');
    }, 1200);
  };

  return (
    <>
      {}
      {isMounted && isLoading && (
        <div id="loader" className="loader">
          <div className="spinner">
            <div className="loading"></div>
            <div id="loading-icon">
              <img src="/images/tru-icon.png" alt="Loading" />
            </div>
          </div>
        </div>
      )}

      {}
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

      <section className="section1" style={{ padding: '0px 0px 0px 0px' }}>
        <div style={{ display: 'flex', justifyContent: 'end', alignItems: 'center', gap: '20px' }}>
        </div>

        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <div className="container-fluid mobile_nav_container">
            <Link className="navbar-brand" href="/">
              <img src="/images/trulogo2.png" alt="TRU Logo" />
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item dropdown">

                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="navbarDropdown1"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ color: "black" }}
                  >
                    TRU AI
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown1">
                    <li><a className="dropdown-item" href="/ranking">TRU Ranking</a></li>
                    <li><a className="dropdown-item" href="/">TRU Connect</a></li>
                    <li><a className="dropdown-item" href="/find_your_fit">TRU AI</a></li>
                  </ul>
                </li>

                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="navbarDropdown2"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    TRU Education
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown2">
                    <li><a className="dropdown-item" href="/school_solution">School Solutions</a></li>
                    <li><a className="dropdown-item" href="/academic_institution">Academic Institutions</a></li>
                  </ul>
                </li>

                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="navbarDropdown3"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    About TRU
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown3">
                    <li><a className="dropdown-item" href="/our_story">Our Story</a></li>
                    <li><a className="dropdown-item" href="/core_team">Core Team</a></li>
                  </ul>
                </li>

                <li className="nav-item">
                  <a className="nav-link" href="/filter_university">
                    TRU Overseas
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/all-blogs">
                    TRU Blog
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/learning_hub">
                    TRU Learning
                  </a>
                </li>
              </ul>
            </div>

            {user ? (
              <div className="dropdown login_button ml-3" id="login-button">
                <button
                  className="btn dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img src="/images/login-white.png" alt="Login" className="ml-3" />
                </button>
                <ul
                  className="dropdown-menu"
                  style={{
                    minWidth: '200px',
                    right: 0,
                    left: 'auto',
                    zIndex: 1050,
                    backgroundColor: '#fff',
                    border: '1px solid rgba(0,0,0,.15)',
                    borderRadius: '0.25rem',
                    boxShadow: '0 0.5rem 1rem rgba(0,0,0,.175)'
                  }}
                >
                  {user.role === 'admin' ? (
                    <li>
                      <a
                        className="dropdown-item"
                        href="/admin"
                        style={{
                          padding: '0.5rem 1rem',
                          color: '#212529',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <i className="fas fa-user-shield me-2"></i>
                        Admin Dashboard
                      </a>
                    </li>
                  ) : (
                    <li>
                      <a
                        className="dropdown-item"
                        href="/user-dashboard"
                        style={{
                          padding: '0.5rem 1rem',
                          color: '#212529',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <i className="fas fa-user me-2"></i>
                        Student Dashboard
                      </a>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <a
                      className="dropdown-item"
                      id="logout"
                      style={{
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        color: '#dc3545',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </a>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex align-items-center justify-content-end" style={{ marginLeft: '10px' }}>
                <div className="mobile_login">
                  <Link href="/login" onClick={handleLoginClick}>
                    <img src="/images/login-white.png" alt="Login" className="ml-3" />
                  </Link>
                </div>
                <div className="login_button">
                  <button className="btn">
                    <Link href="/login" onClick={handleLoginClick}>Login</Link>
                  </button>
                  <button className="btn signup-btn">
                    <Link href="/signup" onClick={handleSignupClick}>Signup</Link>
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </section>
    </>
  );
}
