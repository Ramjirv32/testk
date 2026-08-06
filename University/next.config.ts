import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.toprankinguniversity.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
    ],
  },
  async rewrites() {
    return [

      {
        source: '/blog/university-rankings-influence-study-abroad',
        destination: '/blog/university-rankings-influence-study-abroad',
      },
      {
        source: '/blog/ai-machine-learning-transforming-education',
        destination: '/blog/ai-machine-learning-transforming-education',
      },
      {
        source: '/blog/best-medical-colleges-world-admission',
        destination: '/blog/best-medical-colleges-world-admission',
      },
      {
        source: '/blog/top-engineering-universities-worldwide',
        destination: '/blog/top-engineering-universities-worldwide',
      },
      {
        source: '/blog/business-schools-global-mba-rankings',
        destination: '/blog/business-schools-global-mba-rankings',
      },
      {
        source: '/blog/computer-science-best-universities',
        destination: '/blog/computer-science-best-universities',
      },
      {
        source: '/blog/law-schools-excellence-international',
        destination: '/blog/law-schools-excellence-international',
      },
      {
        source: '/blog/psychology-social-sciences-programs',
        destination: '/blog/psychology-social-sciences-programs',
      },
      {
        source: '/blog/industry-partnerships-higher-education',
        destination: '/blog/industry-partnerships-higher-education',
      },
      {
        source: '/blog/global-education-trends-2025',
        destination: '/blog/global-education-trends-2025',
      },

      {
        source: '/all-blogs',
        destination: '/footer/all-blogs',
      },
      {
        source: '/allblogs',
        destination: '/footer/all-blogs',
      },
      {
        source: '/academic_institution',
        destination: '/footer/academic_institution',
      },
      {
        source: '/contact',
        destination: '/footer/contact',
      },
      {
        source: '/career',
        destination: '/footer/career',
      },
      {
        source: '/terms_condition',
        destination: '/footer/terms_condition',
      },
      {
        source: '/privacy_policy',
        destination: '/footer/privacy_policy',
      },
      {
        source: '/school_solution',
        destination: '/footer/school_solution',
      },
      {
        source: '/learning_hub',
        destination: '/footer/learning_hub',
      },

      {
        source: '/blogs/category/new-technology',
        destination: '/footer/all-blogs',
      },
      {
        source: '/blogs/category/education',
        destination: '/footer/all-blogs',
      },
      {
        source: '/blogs/category/industry-connect',
        destination: '/footer/all-blogs',
      },
      {
        source: '/blogs/category/no-message',
        destination: '/footer/all-blogs',
      },
    ];
  },

};

export default nextConfig;
