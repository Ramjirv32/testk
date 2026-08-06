'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './allBlogs.module.css';

const categories = [
  {
    id: 1,
    name: 'New Technology / Research',
    image: '/images/newtechnology.png',
    href: '/innerblog/home/blog-category/1'
  },
  {
    id: 2,
    name: 'Education',
    image: '/images/education.png',
    href: '/innerblog/home/blog-category/2'
  },
  {
    id: 3,
    name: 'Industry Connect',
    image: '/images/indusrry.png',
    href: '/innerblog/home/blog-category/3'
  },
  {
    id: 4,
    name: 'No Message',
    image: '/images/nomessage.png',
    href: '/innerblog/home/blog-category/4'
  }
];

const allBlogs = [
  { id: 1, title: 'How University Rankings Influence Students\' Study Abroad Decisions', slug: 'university-rankings-influence-study-abroad', category_id: 1, image: '/images/blog-1.jpg', date: '2024-10-07' },
  { id: 2, title: 'AI and Machine Learning: Transforming Education', slug: 'ai-machine-learning-transforming-education', category_id: 1, image: '/images/blog-2.jpg', date: '2024-10-15' },
  { id: 3, title: 'Best Medical Colleges in the World | Admission Info', slug: 'best-medical-colleges-world-admission', category_id: 2, image: '/images/blog-3.jpg', date: '2025-11-10' },
  { id: 4, title: 'Top Engineering Universities Worldwide', slug: 'top-engineering-universities-worldwide', category_id: 2, image: '/images/blog-4.jpg', date: '2024-11-08' },
  { id: 5, title: 'Business Schools: Global MBA Rankings', slug: 'business-schools-global-mba-rankings', category_id: 2, image: '/images/blog-5.jpg', date: '2024-11-05' },
  { id: 6, title: 'Computer Science Programs: Best Universities', slug: 'computer-science-best-universities', category_id: 2, image: '/images/blog-1.jpg', date: '2024-11-03' },
  { id: 7, title: 'Law Schools Excellence: International Rankings', slug: 'law-schools-excellence-international', category_id: 2, image: '/images/blog-2.jpg', date: '2024-10-28' },
  { id: 8, title: 'Psychology & Social Sciences: Best Programs', slug: 'psychology-social-sciences-programs', category_id: 2, image: '/images/blog-3.jpg', date: '2024-10-20' },
  { id: 9, title: 'Industry Partnerships in Higher Education', slug: 'industry-partnerships-higher-education', category_id: 3, image: '/images/blog-4.jpg', date: '2024-11-01' },
  { id: 10, title: 'Global Education Trends 2025', slug: 'global-education-trends-2025', category_id: 4, image: '/images/blog-5.jpg', date: '2024-10-25' },
];

export default function AllBlogsClient() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [visibleBlogs, setVisibleBlogs] = useState<boolean[]>(new Array(allBlogs.length).fill(false));
  const [hoveredBlog, setHoveredBlog] = useState<number | null>(null);

  const filteredBlogs = useMemo(() => {
    return allBlogs.filter(blog => {
      const matchesSearch = blog.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !selectedCategory || blog.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [query, selectedCategory]);

  useEffect(() => {
    const observers = filteredBlogs.map((blog, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleBlogs((prev) => {
              const newVisible = [...prev];
              newVisible[allBlogs.findIndex(b => b.id === blog.id)] = true;
              return newVisible;
            });
          }
        },
        { threshold: 0.2 }
      );

      const element = document.getElementById(`blog-card-${blog.id}`);
      if (element) {
        observer.observe(element);
      }

      return { observer, element };
    });

    return () => {
      observers.forEach(({ observer, element }) => {
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [filteredBlogs]);

  return (
    <div className={styles.pageWrapper}>
      {}
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-12 subpage_coloum">
              <div className="subpage_heading">
                <h1>BLOGS & INSIGHTS</h1>
              </div>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder=" Search articles, topics, or keywords"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    className={styles.clearBtn}
                    onClick={() => setQuery('')}
                  >
                    
                  </button>
                )}
              </div>
              {query && (
                <div className={styles.resultCount}>
                  Found <strong>{filteredBlogs.length}</strong> article{filteredBlogs.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {}
      <section className={styles.categorySection}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h3 className={styles.sectionTitle}>EXPLORE BY CATEGORY</h3>
              <div className={styles.categoryGrid}>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={category.href}
                    className={`${styles.categoryCard} ${selectedCategory === category.id ? styles.categoryActive : ''}`}
                  >
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={420}
                      height={300}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className={styles.categoryOverlay}>
                      <h4>{category.name}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className={styles.blogsSection}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h3 className={styles.sectionTitle}>
                {selectedCategory ? 'FILTERED BLOGS' : 'ALL BLOGS'}
              </h3>
              {filteredBlogs.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No blogs found matching your search.</p>
                  <button
                    className={styles.resetBtn}
                    onClick={() => {
                      setQuery('');
                      setSelectedCategory(null);
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className={styles.blogsGrid}>
                  {filteredBlogs.map((blog) => (
                    <div
                      key={blog.id}
                      id={`blog-card-${blog.id}`}
                      className={`${styles.blogCard} ${visibleBlogs[allBlogs.findIndex(b => b.id === blog.id)] ? styles.blogVisible : ''}`}
                      onMouseEnter={() => setHoveredBlog(blog.id)}
                      onMouseLeave={() => setHoveredBlog(null)}
                      onClick={() => router.push(`/blog/${blog.slug}`)}
                    >
                      <div className={styles.blogImageWrapper}>
                        <Image
                          src={blog.image}
                          alt={blog.title}
                          width={400}
                          height={250}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className={styles.blogOverlay} />
                        <Link
                          href={`/blog/${blog.slug}`}
                          className={`${styles.readBtn} ${hoveredBlog === blog.id ? styles.readBtnActive : ''}`}
                        >
                          Read Article →
                        </Link>
                      </div>

                      <div className={styles.blogContent}>
                        <div className={styles.blogMeta}>
                          <span className={styles.blogDate}>
                             {new Date(blog.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className={styles.blogCategory}>
                            {categories.find(c => c.id === blog.category_id)?.name}
                          </span>
                        </div>

                        <h4 className={styles.blogTitle}>{blog.title}</h4>

                        <Link
                          href={`/blog/${blog.slug}`}
                          className={styles.blogLink}
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
