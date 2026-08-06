'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Blog {
  id: number;
  title: string;
  description: string;
  content: string;
  image: string;
  date: string;
  category_id: number;
}

export default function BlogDetailsPage() {
  const params = useParams();
  const blogId = params.id as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const allBlogs: { [key: number]: Blog } = {
      1: {
        id: 1,
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
      2: {
        id: 2,
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
      3: {
        id: 3,
        title: 'Best Medical Colleges in the World | Admission Info',
        description: 'Find the best medical colleges in the world. Learn about admissions, eligibility, and costs to...',
        content: `
          <h3>Top Medical Schools Worldwide</h3>
          <p>Find the best medical colleges in the world. Learn about admissions, eligibility, and costs to pursue your dream of becoming a doctor.</p>
          
          <h3>Leading Medical Institutions</h3>
          <ul class="my-custom-ul">
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
      4: {
        id: 4,
        title: 'Top Engineering Universities Worldwide',
        description: 'Discover the leading engineering programs and universities that are shaping the future of technology...',
        content: `
          <h3>Leading Engineering Programs</h3>
          <p>Discover the leading engineering programs and universities that are shaping the future of technology and innovation.</p>
          
          <h3>Top Engineering Schools</h3>
          <ol class="my-custom-ul">
            <li><strong>Massachusetts Institute of Technology (MIT)</strong> - Renowned for mechanical, electrical, and computer engineering</li>
            <li><strong>Stanford University</strong> - Leader in computer science and innovation</li>
            <li><strong>University of Cambridge</strong> - Excellence in engineering research</li>
            <li><strong>ETH Zurich</strong> - Top European engineering institution</li>
            <li><strong>California Institute of Technology (Caltech)</strong> - Elite STEM education</li>
            <li><strong>Imperial College London</strong> - Premier UK engineering school</li>
            <li><strong>National University of Singapore (NUS)</strong> - Leading Asian institution</li>
          </ol>
          
          <h3>Engineering Specializations</h3>
          <p><strong>Computer Engineering:</strong> Focus on software, hardware, and systems design</p>
          <p><strong>Mechanical Engineering:</strong> Design and manufacturing of mechanical systems</p>
          <p><strong>Electrical Engineering:</strong> Electronics, power systems, and telecommunications</p>
          <p><strong>Civil Engineering:</strong> Infrastructure, construction, and urban planning</p>
          <p><strong>Chemical Engineering:</strong> Process design and materials science</p>
          
          <h3>Industry Connections</h3>
          <p>Top engineering schools maintain strong partnerships with leading tech companies, providing students with internship opportunities, research funding, and direct pathways to employment at companies like Google, Apple, Tesla, and SpaceX.</p>
          
          <h3>Research Opportunities</h3>
          <p>Students have access to cutting-edge research facilities, working on projects in artificial intelligence, robotics, sustainable energy, nanotechnology, and space exploration.</p>
          
          <h3>Career Outcomes</h3>
          <p>Engineering graduates from top universities command starting salaries ranging from $70,000 to $120,000, with exceptional opportunities in technology hubs like Silicon Valley, London, Singapore, and emerging tech centers worldwide.</p>
        `,
        image: '/images/blog-4.jpg',
        date: '2024-11-08',
        category_id: 2
      },
      5: {
        id: 5,
        title: 'Business Schools: Global MBA Rankings',
        description: 'Explore top business schools offering MBA programs with excellent career outcomes and networking...',
        content: `
          <h3>Top MBA Programs</h3>
          <p>Explore top business schools offering MBA programs with excellent career outcomes and networking opportunities.</p>
          
          <h3>Premier Business Schools</h3>
          <ol class="my-custom-ul">
            <li><strong>Harvard Business School</strong> - United States</li>
            <li><strong>Stanford Graduate School of Business</strong> - United States</li>
            <li><strong>INSEAD</strong> - France/Singapore</li>
            <li><strong>Wharton School, University of Pennsylvania</strong> - United States</li>
            <li><strong>London Business School</strong> - United Kingdom</li>
            <li><strong>MIT Sloan School of Management</strong> - United States</li>
            <li><strong>Columbia Business School</strong> - United States</li>
            <li><strong>IE Business School</strong> - Spain</li>
          </ol>
          
          <h3>MBA Program Types</h3>
          <p><strong>Full-Time MBA:</strong> Traditional two-year program with immersive learning experience</p>
          <p><strong>Executive MBA:</strong> Designed for working professionals with significant management experience</p>
          <p><strong>Part-Time MBA:</strong> Flexible schedule allowing students to continue working</p>
          <p><strong>Online MBA:</strong> Distance learning programs with virtual classrooms</p>
          
          <h3>Admission Requirements</h3>
          <p>Most top MBA programs require 3-5 years of work experience, GMAT/GRE scores (typically 700+ for GMAT), strong undergraduate GPA, compelling essays, and impressive leadership experiences.</p>
          
          <h3>Specializations</h3>
          <ul class="my-custom-ul">
            <li>Finance and Investment Banking</li>
            <li>Consulting and Strategy</li>
            <li>Entrepreneurship and Innovation</li>
            <li>Marketing and Brand Management</li>
            <li>Operations and Supply Chain</li>
            <li>Healthcare Management</li>
            <li>Technology Management</li>
          </ul>
          
          <h3>Return on Investment</h3>
          <p>Top MBA graduates see average salary increases of 50-100%, with starting salaries often exceeding $150,000 including bonuses. The strong alumni networks provide lifelong career benefits and business opportunities.</p>
          
          <h3>Global Opportunities</h3>
          <p>Leading business schools offer international exchange programs, global consulting projects, and diverse cohorts, preparing students for leadership roles in multinational corporations and global markets.</p>
        `,
        image: '/images/blog-5.jpg',
        date: '2024-11-05',
        category_id: 2
      },
      6: {
        id: 6,
        title: 'Computer Science Programs: Best Universities',
        description: 'Find the best computer science programs worldwide with cutting-edge research and industry connections...',
        content: `
          <h3>Computer Science Excellence</h3>
          <p>Find the best computer science programs worldwide with cutting-edge research and industry connections.</p>
          
          <h3>Top Computer Science Programs</h3>
          <ol class="my-custom-ul">
            <li><strong>Carnegie Mellon University</strong> - Leading in AI and robotics</li>
            <li><strong>MIT</strong> - Pioneer in computer science education</li>
            <li><strong>Stanford University</strong> - Silicon Valley connections</li>
            <li><strong>UC Berkeley</strong> - Open-source innovation hub</li>
            <li><strong>University of Oxford</strong> - UK's top CS program</li>
            <li><strong>ETH Zurich</strong> - European leader in computing</li>
          </ol>
          
          <h3>Curriculum Highlights</h3>
          <p>Top programs cover algorithms, data structures, software engineering, artificial intelligence, machine learning, cybersecurity, computer networks, and database systems.</p>
          
          <h3>Research Areas</h3>
          <ul class="my-custom-ul">
            <li>Artificial Intelligence and Machine Learning</li>
            <li>Quantum Computing</li>
            <li>Cybersecurity and Cryptography</li>
            <li>Human-Computer Interaction</li>
            <li>Distributed Systems and Cloud Computing</li>
          </ul>
          
          <h3>Industry Partnerships</h3>
          <p>Leading CS programs maintain partnerships with tech giants like Google, Microsoft, Amazon, Facebook, and emerging startups, offering internships, research funding, and recruitment pipelines.</p>
          
          <h3>Career Opportunities</h3>
          <p>Graduates pursue careers as software engineers, data scientists, AI researchers, cybersecurity specialists, and tech entrepreneurs, with starting salaries often exceeding $100,000 at top companies.</p>
        `,
        image: '/images/blog-1.jpg',
        date: '2024-11-03',
        category_id: 2
      },
      7: {
        id: 7,
        title: 'Law Schools Excellence: International Rankings',
        description: 'Explore the top law schools globally offering prestigious legal education and career opportunities...',
        content: `
          <h3>Top Law Schools</h3>
          <p>Explore the top law schools globally offering prestigious legal education and career opportunities.</p>
          
          <h3>Leading Law Schools</h3>
          <ol class="my-custom-ul">
            <li><strong>Yale Law School</strong> - United States</li>
            <li><strong>Harvard Law School</strong> - United States</li>
            <li><strong>University of Oxford Faculty of Law</strong> - United Kingdom</li>
            <li><strong>University of Cambridge Faculty of Law</strong> - United Kingdom</li>
            <li><strong>Stanford Law School</strong> - United States</li>
            <li><strong>NYU School of Law</strong> - United States</li>
          </ol>
          
          <h3>Legal Specializations</h3>
          <ul class="my-custom-ul">
            <li>Corporate and Commercial Law</li>
            <li>International Law and Human Rights</li>
            <li>Criminal Law and Justice</li>
            <li>Environmental Law</li>
            <li>Intellectual Property Law</li>
            <li>Constitutional Law</li>
          </ul>
          
          <h3>Career Paths</h3>
          <p>Law graduates pursue careers in prestigious law firms, corporate legal departments, government agencies, international organizations, judiciary, academia, and public interest law.</p>
        `,
        image: '/images/blog-2.jpg',
        date: '2024-10-28',
        category_id: 2
      },
      8: {
        id: 8,
        title: 'Psychology & Social Sciences: Best Programs',
        description: 'Discover leading psychology and social sciences programs that offer comprehensive education...',
        content: `
          <h3>Social Sciences Excellence</h3>
          <p>Discover leading psychology and social sciences programs that offer comprehensive education in human behavior, society, and mental health.</p>
          
          <h3>Top Programs</h3>
          <ol class="my-custom-ul">
            <li><strong>Stanford University</strong> - Psychology and Behavioral Sciences</li>
            <li><strong>Harvard University</strong> - Social Sciences</li>
            <li><strong>University of Cambridge</strong> - Psychology</li>
            <li><strong>LSE (London School of Economics)</strong> - Social Sciences</li>
          </ol>
          
          <h3>Research Areas</h3>
          <p>Clinical psychology, cognitive neuroscience, developmental psychology, social psychology, organizational behavior, and public policy research.</p>
          
          <h3>Career Opportunities</h3>
          <p>Graduates work as clinical psychologists, researchers, counselors, human resources professionals, policy analysts, and social workers.</p>
        `,
        image: '/images/blog-3.jpg',
        date: '2024-10-20',
        category_id: 2
      },
      9: {
        id: 9,
        title: 'Industry Partnerships in Higher Education',
        description: 'Learn how universities collaborate with industries to provide practical experience and career opportunities...',
        content: `
          <h3>Industry Collaboration</h3>
          <p>Learn how universities collaborate with industries to provide practical experience and career opportunities for students.</p>
          
          <h3>Types of Partnerships</h3>
          <ul class="my-custom-ul">
            <li>Internship and Co-op Programs</li>
            <li>Research Collaborations</li>
            <li>Guest Lectures and Workshops</li>
            <li>Sponsored Projects and Labs</li>
            <li>Career Development Programs</li>
          </ul>
          
          <h3>Benefits for Students</h3>
          <p>Industry partnerships provide hands-on experience, networking opportunities, mentorship, enhanced employability, and insights into real-world applications of academic learning.</p>
          
          <h3>Success Stories</h3>
          <p>Many universities have established innovation hubs and incubators in partnership with tech companies, fostering entrepreneurship and startup culture among students.</p>
        `,
        image: '/images/blog-4.jpg',
        date: '2024-11-01',
        category_id: 3
      },
      10: {
        id: 10,
        title: 'Global Education Trends 2025',
        description: 'Explore the latest trends and innovations in global education that are shaping the future...',
        content: `
          <h3>Education in 2025</h3>
          <p>Explore the latest trends and innovations in global education that are shaping the future of learning and teaching.</p>
          
          <h3>Key Trends</h3>
          <ul class="my-custom-ul">
            <li>Hybrid and Flexible Learning Models</li>
            <li>Micro-credentials and Digital Badges</li>
            <li>Competency-Based Education</li>
            <li>Gamification and Interactive Learning</li>
            <li>Focus on Soft Skills and Emotional Intelligence</li>
            <li>Sustainability and Climate Education</li>
          </ul>
          
          <h3>Technology Integration</h3>
          <p>Virtual reality classrooms, AI-powered learning assistants, blockchain for credential verification, and immersive learning experiences are becoming mainstream in education.</p>
          
          <h3>Future Outlook</h3>
          <p>Education is becoming more personalized, accessible, and aligned with rapidly changing job markets, preparing students for careers that may not yet exist.</p>
        `,
        image: '/images/blog-5.jpg',
        date: '2024-10-25',
        category_id: 4
      }
    };

    const currentBlog = allBlogs[parseInt(blogId)] || null;

    const mockLatestBlogs: Blog[] = [
      allBlogs[3],
      allBlogs[4],
      allBlogs[5]
    ].filter(Boolean);

    setBlog(currentBlog);
    setLatestBlogs(mockLatestBlogs);
    setLoading(false);
  }, [blogId]);

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
        <p>Blog not found</p>
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
                <h1>BLOGS DETAILS</h1>
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
                    {}
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
              <div className="blog_latest_content">
                <h4>Latest Update</h4>
                <ul className="blog_detail_ul_li">
                  {latestBlogs.map((latestBlog) => (
                    <li key={latestBlog.id}>
                      <Link href={`/innerblog/blog/${latestBlog.id}`}>
                        {latestBlog.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
