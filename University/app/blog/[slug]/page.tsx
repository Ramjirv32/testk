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
  content: string;
  image: string;
  date: string;
  category_id: number;
}

const categories = {
  1: 'New Technology / Research',
  2: 'Education',
  3: 'Industry Connect',
  4: 'No Message'
};

const allBlogs: Blog[] = [
  {
    id: 1,
    slug: 'university-rankings-influence-study-abroad',
    title: 'How University Rankings Influence Students\' Study Abroad Decisions',
    description: 'Studying abroad is a life-changing decision that involves numerous factors. One of the most critical...',
    content: `
      <h3>Introduction</h3>
      <p>Studying abroad is a life-changing decision that involves numerous factors. One of the most critical criteria for selecting a study-abroad destination is the university's ranking. University rankings have become increasingly influential in shaping students' perceptions and choices. While rankings provide a general overview, they should not be the sole determinant for choosing a study abroad destination.</p>
      
      <h3>Understanding University Rankings</h3>
      <p>University rankings gauge the performance of institutions based on several factors, including classroom performance, research impact, faculty quality, student satisfaction, and international standards. Students can use global university ranking platforms such as Times Higher Education, U.S. News & World Report, QS World University Rankings, and Forbes to compare different universities and programs based on these indicators.</p>
      
      <h3>The Role of Rankings in Decision-Making</h3>
      <p>Rankings provide a quick snapshot of universities, making them appealing to international students unfamiliar with foreign education systems. They offer an objective measure of quality, helping students assess an institution's prestige, reputation, and network connections.</p>
      
      <h3>Types of Rankings and Their Influence</h3>
      <p><strong>Global Rankings:</strong> Global rankings, such as QS and Times Higher Education, evaluate universities on a worldwide scale. These rankings often emphasize research output and international reputation.</p>
      <p><strong>Subject-Specific Rankings:</strong> Subject-specific rankings focus on particular fields of study, offering a more precise evaluation for students interested in specialized programs.</p>
      
      <h3>National Rankings</h3>
      <p>National ranking systems, such as those in the U.S. or India, cater to regional preferences and educational standards. They are particularly helpful for students aiming to study within a specific country.</p>
      
      <h3>Beyond the Numbers: What Rankings Miss</h3>
      <p>While rankings are valuable, they don't capture every important aspect of university life. Campus culture, location, program fit, cost considerations, and student support services are equally important factors to consider.</p>
      
      <h3>Conclusion</h3>
      <p>University rankings are a useful starting point for students exploring study-abroad options, but they should complement, not replace, thorough research. By considering rankings alongside personal priorities, students can make informed decisions that align with their academic and career goals.</p>
    `,
    image: '/images/blog-1.jpg',
    date: '2024-10-07',
    category_id: 1
  },
  {
    id: 2,
    slug: 'ai-machine-learning-transforming-education',
    title: 'AI and Machine Learning: Transforming Education',
    description: 'Artificial intelligence is revolutionizing the way we learn and teach. Discover how AI technologies are shaping...',
    content: `
      <h3>The AI Revolution in Education</h3>
      <p>Artificial intelligence is revolutionizing the way we learn and teach. Discover how AI technologies are shaping the future of education worldwide.</p>
      
      <h3>Personalized Learning Experiences</h3>
      <p>AI-powered adaptive learning systems can tailor educational content to individual student needs, learning pace, and style. These systems analyze student performance in real-time and adjust the difficulty and content accordingly.</p>
      
      <h3>Intelligent Tutoring Systems</h3>
      <p>AI tutors provide 24/7 support to students, answering questions, explaining concepts, and offering practice problems. These systems can identify knowledge gaps and provide targeted interventions.</p>
      
      <h3>Automated Grading and Assessment</h3>
      <p>Machine learning algorithms can grade assignments, essays, and exams with increasing accuracy, freeing up teachers to focus on personalized instruction and student engagement.</p>
      
      <h3>Predictive Analytics</h3>
      <p>Educational institutions use AI to predict student outcomes, identify at-risk students, and intervene early to prevent dropouts. These systems analyze various data points including attendance, grades, and engagement metrics.</p>
      
      <h3>Natural Language Processing</h3>
      <p>NLP technologies enable language learning apps, writing assistants, and translation tools that help students improve their communication skills and access educational content in multiple languages.</p>
      
      <h3>Challenges and Considerations</h3>
      <p>While AI offers tremendous potential, challenges include data privacy concerns, the need for digital infrastructure, ensuring equitable access, and maintaining the human element in education.</p>
      
      <h3>The Future of AI in Education</h3>
      <p>As AI technology continues to advance, we can expect even more sophisticated applications including virtual reality classrooms, AI-powered research assistants, and lifelong learning platforms that adapt to changing career needs.</p>
    `,
    image: '/images/blog-2.jpg',
    date: '2024-10-15',
    category_id: 1
  },
  {
    id: 3,
    slug: 'best-medical-colleges-world-admission',
    title: 'Best Medical Colleges in the World | Admission Info',
    description: 'Find the best medical colleges in the world. Learn about admissions, eligibility, and costs to...',
    content: `
      <h3>Top Medical Schools Worldwide</h3>
      <p>Find the best medical colleges in the world. Learn about admissions, eligibility, and costs to pursue your dream of becoming a doctor.</p>
      
      <h3>Leading Medical Institutions</h3>
      <ul>
        <li><strong>Harvard Medical School</strong> - United States</li>
        <li><strong>Johns Hopkins University School of Medicine</strong> - United States</li>
        <li><strong>University of Oxford Medical School</strong> - United Kingdom</li>
        <li><strong>Stanford University School of Medicine</strong> - United States</li>
        <li><strong>University of Cambridge School of Clinical Medicine</strong> - United Kingdom</li>
        <li><strong>Karolinska Institute</strong> - Sweden</li>
        <li><strong>Yale School of Medicine</strong> - United States</li>
        <li><strong>University College London Medical School</strong> - United Kingdom</li>
      </ul>
      
      <h3>Admission Requirements</h3>
      <p><strong>Academic Prerequisites:</strong> Most medical schools require a bachelor's degree with strong performance in biology, chemistry, physics, and mathematics. Minimum GPA requirements typically range from 3.5 to 4.0.</p>
      <p><strong>Standardized Tests:</strong> MCAT (Medical College Admission Test) for US and Canadian schools, UCAT or BMAT for UK schools, and specific entrance exams for other countries.</p>
      <p><strong>Clinical Experience:</strong> Volunteer work, internships, or shadowing experiences in healthcare settings.</p>
      
      <h3>Application Process</h3>
      <p>The application process typically includes submitting academic transcripts, standardized test scores, letters of recommendation, personal statements, and attending multiple interviews. Many schools also require demonstration of research experience and community service.</p>
      
      <h3>Cost Considerations</h3>
      <p>Medical education costs vary significantly by country and institution. US medical schools average $250,000-$350,000 for total degree cost, while UK and European schools may range from £9,000-£38,000 per year. Scholarships, grants, and loan programs are available.</p>
      
      <h3>Specialized Programs</h3>
      <p>Many top medical schools offer combined MD-PhD programs, global health tracks, research opportunities, and specialized training in areas like surgery, pediatrics, oncology, and neurology.</p>
      
      <h3>Career Prospects</h3>
      <p>Graduates from top medical schools have excellent career prospects with high placement rates in competitive residency programs and diverse career paths including clinical practice, research, public health, and healthcare administration.</p>
    `,
    image: '/images/blog-3.jpg',
    date: '2025-11-10',
    category_id: 2
  },
  {
    id: 4,
    slug: 'top-engineering-universities-worldwide',
    title: 'Top Engineering Universities Worldwide',
    description: 'Discover the leading engineering programs and universities that are shaping the future of technology...',
    content: `
      <h3>Leading Engineering Programs</h3>
      <p>Discover the leading engineering programs and universities that are shaping the future of technology and innovation.</p>
      
      <h3>Top Engineering Schools</h3>
      <ol>
        <li><strong>Massachusetts Institute of Technology (MIT)</strong> - Renowned for mechanical, electrical, and computer engineering</li>
        <li><strong>Stanford University</strong> - Leader in computer science and innovation</li>
        <li><strong>University of Cambridge</strong> - Excellence in engineering research</li>
        <li><strong>ETH Zurich</strong> - Top European engineering institution</li>
        <li><strong>California Institute of Technology (Caltech)</strong> - Elite STEM education</li>
        <li><strong>Imperial College London</strong> - Premier UK engineering school</li>
        <li><strong>National University of Singapore (NUS)</strong> - Leading Asian institution</li>
      </ol>
    `,
    image: '/images/blog-4.jpg',
    date: '2024-11-08',
    category_id: 2
  },
  {
    id: 5,
    slug: 'business-schools-global-mba-rankings',
    title: 'Business Schools: Global MBA Rankings',
    description: 'Explore top business schools offering MBA programs with excellent career outcomes and networking...',
    content: `
      <h3>Top MBA Programs</h3>
      <p>Explore top business schools offering MBA programs with excellent career outcomes and networking opportunities.</p>
      
      <h3>Premier Business Schools</h3>
      <ol>
        <li><strong>Harvard Business School</strong> - United States</li>
        <li><strong>Stanford Graduate School of Business</strong> - United States</li>
        <li><strong>INSEAD</strong> - France/Singapore</li>
        <li><strong>Wharton School, University of Pennsylvania</strong> - United States</li>
        <li><strong>London Business School</strong> - United Kingdom</li>
        <li><strong>MIT Sloan School of Management</strong> - United States</li>
        <li><strong>Columbia Business School</strong> - United States</li>
        <li><strong>IE Business School</strong> - Spain</li>
      </ol>
    `,
    image: '/images/blog-5.jpg',
    date: '2024-11-05',
    category_id: 2
  },
  {
    id: 6,
    slug: 'computer-science-best-universities',
    title: 'Computer Science Programs: Best Universities',
    description: 'Find the best computer science programs worldwide with cutting-edge research and industry connections...',
    content: `
      <h3>Computer Science Excellence</h3>
      <p>Find the best computer science programs worldwide with cutting-edge research and industry connections.</p>
    `,
    image: '/images/blog-1.jpg',
    date: '2024-11-03',
    category_id: 2
  },
  {
    id: 7,
    slug: 'law-schools-excellence-international',
    title: 'Law Schools Excellence: International Rankings',
    description: 'Explore the top law schools globally offering prestigious legal education and career opportunities...',
    content: `
      <h3>Top Law Schools</h3>
      <p>Explore the top law schools globally offering prestigious legal education and career opportunities.</p>
    `,
    image: '/images/blog-2.jpg',
    date: '2024-10-28',
    category_id: 2
  },
  {
    id: 8,
    slug: 'psychology-social-sciences-programs',
    title: 'Psychology & Social Sciences: Best Programs',
    description: 'Discover leading psychology and social sciences programs that offer comprehensive education...',
    content: `
      <h3>Social Sciences Excellence</h3>
      <p>Discover leading psychology and social sciences programs that offer comprehensive education in human behavior, society, and mental health.</p>
    `,
    image: '/images/blog-3.jpg',
    date: '2024-10-20',
    category_id: 2
  },
  {
    id: 9,
    slug: 'industry-partnerships-higher-education',
    title: 'Industry Partnerships in Higher Education',
    description: 'Learn how universities collaborate with industries to provide practical experience and career opportunities...',
    content: `
      <h3>Industry Collaboration</h3>
      <p>Learn how universities collaborate with industries to provide practical experience and career opportunities for students.</p>
    `,
    image: '/images/blog-4.jpg',
    date: '2024-11-01',
    category_id: 3
  },
  {
    id: 10,
    slug: 'global-education-trends-2025',
    title: 'Global Education Trends 2025',
    description: 'Explore the latest trends and innovations in global education that are shaping the future...',
    content: `
      <h3>Education in 2025</h3>
      <p>Explore the latest trends and innovations in global education that are shaping the future of learning and teaching.</p>
    `,
    image: '/images/blog-5.jpg',
    date: '2024-10-25',
    category_id: 4
  },
];

export default function BlogDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);

  useEffect(() => {

    const currentBlog = allBlogs.find(b => b.slug === slug) || null;
    
    if (currentBlog) {
      setBlog(currentBlog);
      

      const sortedByDate = [...allBlogs].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setLatestBlogs(sortedByDate.slice(0, 3));
      

      const related = allBlogs.filter(
        b => b.category_id === currentBlog.category_id && b.id !== currentBlog.id
      ).slice(0, 3);
      setRelatedBlogs(related);
    }
    
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h2>Blog not found</h2>
        <p>Sorry, we couldn't find the blog you're looking for.</p>
        <Link href="/all-blogs" style={{ color: '#9a3197', fontWeight: '600' }}>
          ← Back to All Blogs
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 col-sm-12">
              <div className="subpage_heading">
                <h1>BLOG DETAILS</h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blog_detail">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 col-md-8 col-sm-12">
              <div className="blog_detail_img">
                <div className="blog_comments">
                  <h2>{blog.title}</h2>
                  <div className="blog_icon">
                    <span style={{ color: '#9a3197', fontWeight: '500', marginRight: '16px' }}>
                       {new Date(blog.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span style={{ color: '#e084cd', fontWeight: '600' }}>
                       {categories[blog.category_id as keyof typeof categories] || 'Uncategorized'}
                    </span>
                  </div>
                </div>
                <div className="blog_img mt-2 mb-4">
                  <Image 
                    src={blog.image} 
                    alt={blog.title}
                    width={800}
                    height={500}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </div>
                <blockquote>" {blog.description} "</blockquote>
                <div className="blog_detail_content">
                  <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                </div>

                {}
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ede9e4' }}>
                  <Link href="/all-blogs" style={{ color: '#9a3197', fontWeight: '600', textDecoration: 'none' }}>
                    ← Back to All Blogs
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-4 col-sm-12">
              {}
              {latestBlogs.length > 0 && (
                <div className="blog_latest_content" style={{ marginBottom: '40px' }}>
                  <h4 style={{ color: '#070642', marginBottom: '16px', fontWeight: '700' }}> Latest Updates</h4>
                  <ul className="blog_detail_ul_li">
                    {latestBlogs.map((latestBlog) => (
                      <li key={latestBlog.id}>
                        <Link href={`/blog/${latestBlog.slug}`} style={{ color: '#9a3197', textDecoration: 'none' }}>
                          {latestBlog.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {}
              {relatedBlogs.length > 0 && (
                <div className="blog_latest_content">
                  <h4 style={{ color: '#070642', marginBottom: '16px', fontWeight: '700' }}> Related Articles</h4>
                  <ul className="blog_detail_ul_li">
                    {relatedBlogs.map((relatedBlog) => (
                      <li key={relatedBlog.id}>
                        <Link href={`/blog/${relatedBlog.slug}`} style={{ color: '#e084cd', textDecoration: 'none' }}>
                          {relatedBlog.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
