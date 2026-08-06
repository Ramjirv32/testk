'use client';

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);

      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
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
            <div className="spinner-ring" style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              border: '8px solid #f3f3f3',
              borderTop: '8px solid #070642',
              borderRadius: '50%'
            }}></div>
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

      <div className="min-h-screen relative overflow-hidden" style={{ backgroundImage: 'url(/images/login-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        {}
        <Link href="/" className="absolute top-5 left-5 z-20 border-2 border-white rounded-full p-3 hover:bg-white/10 transition">
          <Image
            src="/images/back-to-home.png"
            alt="Back to Home"
            width={30}
            height={30}
            className="object-contain"
          />
        </Link>

        {}
        <Link href="/" className="absolute top-5 right-5 z-20">
          <Image
            src="/images/trulogo-bg-remove.png"
            alt="TRU Logo"
            width={150}
            height={60}
            className="object-contain"
          />
        </Link>

        {}
        <div className="container-fluid">
          <div className="row vh-100">
            <div className="col-lg-5 d-flex mx-auto col-sm-12">
              <div className="w-full max-w-md mx-auto d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <div className="w-full px-4">
                  <h2 className="text-center text-white mb-5" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Login</h2>

                  {error && (
                    <div className="alert alert-danger mb-4" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {}
                    <div className="mb-4 position-relative">
                      <input
                        type="email"
                        name="email"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-control rounded-pill px-4 py-3"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          fontSize: '1rem'
                        }}
                        required
                        disabled={isLoading}
                      />
                      <i className="fa fa-envelope position-absolute" style={{ right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }}></i>
                    </div>

                    {}
                    <div className="mb-4 position-relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Your password"
                        value={formData.password}
                        onChange={handleChange}
                        className="form-control rounded-pill px-4 py-3"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          fontSize: '1rem'
                        }}
                        required
                        disabled={isLoading}
                      />
                      <i
                        className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-lock'} position-absolute`}
                        style={{ right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', cursor: 'pointer' }}
                        onClick={() => setShowPassword(!showPassword)}
                      ></i>
                    </div>

                    {}
                    <div className="text-center mb-4">
                      <Link href="#forgot" className="text-white text-decoration-none" style={{ fontSize: '0.9rem' }}>
                        Forgot password?
                      </Link>
                    </div>

                    {}
                    <button
                      type="submit"
                      className="btn btn-primary w-100 rounded-pill py-3 mb-4"
                      style={{
                        background: 'linear-gradient(to right, #9a3197, #E084CD)',
                        border: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                    </button>

                    {}
                    <div className="text-center">
                      <p className="text-white mb-2">Don't Have an Account Yet?</p>
                      <Link href="/signup" className="text-decoration-none" style={{ color: '#E084CD', fontWeight: 'bold' }}>
                        Create an Account
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
