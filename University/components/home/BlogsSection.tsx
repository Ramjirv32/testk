'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface BlogsSectionProps {
  blogs: any[];
}

export default function BlogsSection({ blogs }: BlogsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleCards(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCards(2);
      } else {
        setVisibleCards(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (blogs.length === 0) return;

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [blogs.length, visibleCards]);

  const handlePrevClick = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
    setCurrentIndex((prevIndex) => {
      const totalCards = blogs.length;
      return (prevIndex - visibleCards + totalCards) % totalCards;
    });
  };

  const handleNextClick = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
    setCurrentIndex((prevIndex) => {
      const totalCards = blogs.length;
      return (prevIndex + visibleCards) % totalCards;
    });
  };

  const handleCardClick = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
  };

  const getVisibleBlogs = () => {
    const visibleBlogsArray = [];
    for (let i = 0; i < visibleCards; i++) {
      visibleBlogsArray.push(blogs[(currentIndex + i) % blogs.length]);
    }
    return visibleBlogsArray;
  };

  if (!blogs || blogs.length === 0) {
    return (
      <section className="blog_section" style={{ backgroundColor: '#faf4ec', padding: '60px 0' }}>
        <div className="container">
          <div className="row" style={{ marginBottom: '30px' }}>
            <div className="col-lg-12 col-md-12 col-sm-12">
              <h2 className="sub_heading">BLOGS</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12 text-center">
              <p style={{ color: '#666', fontSize: '16px' }}>Loading blogs...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const visibleBlogsToShow = getVisibleBlogs();

  return (
    <section className="blog_section" style={{ backgroundColor: '#faf4ec' }}>
      <div className="container blog_padding">
        {}
        <div className="row" style={{ marginBottom: '30px' }}>
          <div className="col-lg-12 col-md-12 col-sm-12">
            <h2 className="sub_heading">BLOGS</h2>
          </div>
        </div>

        {}
        <div className="row" style={{ position: 'relative', marginLeft: '0', marginRight: '0' }}>
          <div className="col-lg-12" style={{ padding: '0 60px' }}>
            {}
            <button
              onClick={handlePrevClick}
              className="blog-slider-arrow blog-slider-arrow--prev"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9a3197',
                fontSize: '20px',
              }}
              aria-label="Previous blogs"
            >
              &#x2039;
            </button>

            {}
            <div
              ref={carouselRef}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${visibleCards}, 1fr)`,
                gap: '20px',
                overflow: 'hidden',
                width: '100%',
                minHeight: '440px',
              }}
            >
              {visibleBlogsToShow.map((blog, idx) => {
                if (!blog) return null;
                return (
                  <div key={blog.id || idx}>
                    <Link href={`/blog/${blog.slug || ''}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div
                        className="blog_main"
                        style={{
                          height: '440px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        }}
                      >
                        <div
                          className="home_blog_img"
                          style={{
                            width: '100%',
                            height: '60%',
                            overflow: 'hidden',
                            backgroundColor: '#eee',
                          }}
                        >
                          <img
                            src={blog.image || '/images/blog-1.jpg'}
                            alt={blog.title || 'Blog post'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/blog-1.jpg';
                            }}
                          />
                        </div>
                        <div
                          className="content"
                          style={{
                            padding: '20px',
                            height: '40%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            backgroundColor: '#fff',
                          }}
                        >
                          <h3
                            style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#2d2d2d',
                              marginBottom: '10px',
                              lineHeight: '1.4',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {blog.title || 'Untitled Blog Post'}
                          </h3>
                          <span
                            className="read-more"
                            style={{
                              color: '#9a3197',
                              fontSize: '14px',
                              fontWeight: '600',
                            }}
                          >
                            Read More &rarr;
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {}
            <button
              onClick={handleNextClick}
              className="blog-slider-arrow blog-slider-arrow--next"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9a3197',
                fontSize: '20px',
              }}
              aria-label="Next blogs"
            >
              &#x203A;
            </button>
          </div>
        </div>

        {}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '30px',
          }}
        >
          {Array.from({ length: Math.ceil(blogs.length / visibleCards) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * visibleCards)}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: index * visibleCards === currentIndex ? '#9a3197' : '#ddd',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
              aria-label={`Go to blog set ${index + 1}`}
            />
          ))}
        </div>

        {}
        <div className="row" style={{ marginTop: '30px' }}>
          <div className="col-lg-12 col-md-12 col-sm-12">
            <div className="blog_button" style={{ textAlign: 'center' }}>
              <Link href="/all-blogs">
                <button
                  style={{
                    padding: '10px 30px',
                    backgroundColor: '#9a3197',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e61a8d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#9a3197';
                  }}
                >
                  View More...
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
