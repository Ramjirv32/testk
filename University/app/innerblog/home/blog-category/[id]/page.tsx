'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Blog {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string;
  date: string;
  category_id: number;
}

interface Category {
  id: number;
  category_name: string;
  image: string;
  status: number;
}

export default function BlogCategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const mockCategories: Category[] = [
      {
        id: 1,
        category_name: 'New Technology / Research',
        image: '/images/newtechnology.png',
        status: 1
      },
      {
        id: 2,
        category_name: 'Education',
        image: '/images/education.png',
        status: 1
      },
      {
        id: 3,
        category_name: 'Industry Connect',
        image: '/images/indusrry.png',
        status: 1
      },
      {
        id: 4,
        category_name: 'No Message',
        image: '/images/nomessage.png',
        status: 1
      }
    ];

    const mockBlogs: Blog[] = [

      {
        id: 1,
        title: 'How University Rankings Influence Students\' Study Abroad Decisions',
        slug: 'university-rankings-influence-study-abroad',
        description: 'Studying abroad is a life-changing decision that involves numerous factors. One of the most critical...',
        image: '/images/blog-1.jpg',
        date: '2024-10-07',
        category_id: 1
      },
      {
        id: 2,
        title: 'AI and Machine Learning: Transforming Education',
        slug: 'ai-machine-learning-transforming-education',
        description: 'Artificial intelligence is revolutionizing the way we learn and teach. Discover how AI technologies are shaping...',
        image: '/images/blog-2.jpg',
        date: '2024-10-15',
        category_id: 1
      },

      {
        id: 3,
        title: 'Best Medical Colleges in the World | Admission Info',
        slug: 'best-medical-colleges-world-admission',
        description: 'Find the best medical colleges in the world. Learn about admissions, eligibility, and costs to...',
        image: '/images/blog-3.jpg',
        date: '2025-11-10',
        category_id: 2
      },
      {
        id: 4,
        title: 'Top Engineering Universities Worldwide',
        slug: 'top-engineering-universities-worldwide',
        description: 'Discover the leading engineering programs and universities that are shaping the future of technology...',
        image: '/images/blog-4.jpg',
        date: '2024-11-08',
        category_id: 2
      },
      {
        id: 5,
        title: 'Business Schools: Global MBA Rankings',
        slug: 'business-schools-global-mba-rankings',
        description: 'Explore top business schools offering MBA programs with excellent career outcomes and networking...',
        image: '/images/blog-5.jpg',
        date: '2024-11-05',
        category_id: 2
      },
      {
        id: 6,
        title: 'Computer Science Programs: Best Universities',
        slug: 'computer-science-best-universities',
        description: 'Find the best computer science programs worldwide with cutting-edge research and industry connections...',
        image: '/images/blog-1.jpg',
        date: '2024-11-03',
        category_id: 2
      },
      {
        id: 7,
        title: 'Law Schools Excellence: International Rankings',
        slug: 'law-schools-excellence-international',
        description: 'Explore the top law schools globally offering prestigious legal education and career opportunities...',
        image: '/images/blog-2.jpg',
        date: '2024-10-28',
        category_id: 2
      },
      {
        id: 8,
        title: 'Psychology & Social Sciences: Best Programs',
        slug: 'psychology-social-sciences-programs',
        description: 'Discover leading psychology and social sciences programs that offer comprehensive education...',
        image: '/images/blog-3.jpg',
        date: '2024-10-20',
        category_id: 2
      },

      {
        id: 9,
        title: 'Industry Partnerships in Higher Education',
        slug: 'industry-partnerships-higher-education',
        description: 'Learn how universities collaborate with industries to provide practical experience and career opportunities...',
        image: '/images/blog-4.jpg',
        date: '2024-11-01',
        category_id: 3
      },

      {
        id: 10,
        title: 'Global Education Trends 2025',
        slug: 'global-education-trends-2025',
        description: 'Explore the latest trends and innovations in global education that are shaping the future...',
        image: '/images/blog-5.jpg',
        date: '2024-10-25',
        category_id: 4
      }
    ];

    const filteredBlogs = mockBlogs.filter(blog => blog.category_id === parseInt(categoryId));

    setCategories(mockCategories);
    setBlogs(filteredBlogs);
    setLoading(false);
  }, [categoryId]);

  return (
    <>
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 col-sm-12 subpage_coloum">
              <div className="subpage_heading">
                <h1>BLOGS</h1>
              </div>
              <div className="search_box">
                <input
                  type="text"
                  placeholder="Search..."
                  onChange={(e) => {

                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blog_detail">
        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="blog_list_cards">
                {loading ? (
                  <p className="text-center">Loading...</p>
                ) : blogs.length === 0 ? (
                  <p className="text-center fs-2">No records found</p>
                ) : (
                  blogs.map((blog) => (
                    <Link
                      key={blog.id}
                      href={`/blog/${blog.slug}`}
                      className="blog_list_card"
                      style={{ backgroundColor: '#fff' }}
                    >
                      <div className="blog_list_card_img">
                        <Image
                          src={blog.image}
                          alt={blog.title}
                          width={100}
                          height={80}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="blog_list_card_content">
                        <span className="blog_date">{blog.date}</span>
                        <h3 className="blog_title">{blog.title}</h3>
                        <p className="blog_description">{blog.description}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div className="col-lg-3">
              {categories.map((category) => (
                <Link key={category.id} href={`/innerblog/home/blog-category/${category.id}`}>
                  <div className="blog_right_img">
                    <Image
                      src={category.image}
                      alt={category.category_name}
                      width={300}
                      height={200}
                      style={{ width: '100%', height: 'auto' }}
                    />
                    <div className="blog_h5">
                      <h5 className="text-white">{category.category_name}</h5>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
