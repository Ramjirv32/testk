

const expectedResponse = {
  college_name: 'IIT Bombay',
  country: 'India',
  location: 'Mumbai, Maharashtra',
  summary:
    'IIT Bombay is one of the leading technical institutes in India...',
  about: 'Premier engineering institution established in 1958',

  ug_programs: ['B.Tech in Computer Science', 'B.Tech in Electrical Engineering', '...'],
  pg_programs: ['M.Tech in Computer Science', 'M.Tech in Data Science', '...'],
  phd_programs: ['PhD in Engineering', 'PhD in Sciences', '...'],

  fees: {
    ug_yearly_min: 200000,
    ug_yearly_max: 250000,
    pg_yearly_min: 150000,
    pg_yearly_max: 500000,
    phd_yearly_min: 50000,
    phd_yearly_max: 100000,
  },

  scholarships: ['Merit-cum-Means Scholarship', 'SC/ST Scholarship', '...'],

  student_gender_ratio: {
    male_percentage: 77,
    female_percentage: 23,
  },

  faculty_staff: 650,
  international_students: 450,
  global_ranking: 152,

  departments: [
    {
      name: 'Computer Science',
      faculty_count: 45,
      students: 1200,
      programs: ['B.Tech in CSE', 'M.Tech in CS', 'PhD in CS'],
      description: 'Leading department focused on cutting-edge technology...',
      specializations: [
        'Artificial Intelligence',
        'Machine Learning',
        'Cybersecurity',
        'Cloud Computing',
      ],
    },
    {
      name: 'Electrical Engineering',
      faculty_count: 38,
      students: 950,
      programs: ['B.Tech in EE', 'M.Tech in Power Systems', 'PhD in EE'],
      description: 'Excellence in electrical engineering education and research...',
      specializations: ['Power Systems', 'Control Systems', 'Electronics', 'Renewable Energy'],
    },

  ],

  student_statistics: [
    {
      year: '2022-23',
      total_students: 10500,
      ug_students: 4500,
      pg_students: 4000,
      phd_students: 2000,
      male_students: 8085,
      female_students: 2415,
      international_students: 400,
      total_placed: 3800,
      ug_4year_placed: 2200,
      ug_5year_placed: 300,
      pg_2year_placed: 1300,
      placement_rate_ug4: 92,
    },
    {
      year: '2023-24',
      total_students: 11200,
      ug_students: 4800,
      pg_students: 4200,
      phd_students: 2200,
      male_students: 8624,
      female_students: 2576,
      international_students: 425,
      total_placed: 4100,
      ug_4year_placed: 2400,
      ug_5year_placed: 320,
      pg_2year_placed: 1380,
      placement_rate_ug4: 94,
    },
    {
      year: '2024-25',
      total_students: 11800,
      ug_students: 5000,
      pg_students: 4500,
      phd_students: 2300,
      male_students: 9086,
      female_students: 2714,
      international_students: 450,
      total_placed: 4450,
      ug_4year_placed: 2600,
      ug_5year_placed: 350,
      pg_2year_placed: 1500,
      placement_rate_ug4: 95,
    },
  ],

  additional_details: {
    nirf_ranking: 3,
    the_ranking: 401,
    student_faculty_ratio: 18,
    median_ctc_overall: 1800000,
    median_ctc_ug4: 2000000,
    median_ctc_ug5: 1900000,
    median_ctc_pg2: 1700000,
  },

  approval_status: 'approved',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2025-01-28T00:00:00Z',
};

export {};
