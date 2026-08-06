

export const API_URL = (process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:7000').replace(/\/$/, '');
export const GRE_API_URL = (process.env.NEXT_PUBLIC_GRE_API_URL || 'http://localhost:11000').replace(/\/$/, '');
export const WS_URL = API_URL.replace(/^http/, 'ws');

// Python Serper API URL for college search and statistics (AI Server)
export const SERPER_API_URL = process.env.NEXT_PUBLIC_SERPER_API_URL || 'http://localhost:5000';
export const SERPER_WS_URL = SERPER_API_URL.replace(/^http/, 'ws');

// Python Scraper pipeline API (server.py — port 5000) proxied through Go backend in production
export const SCRAPER_API_URL = (process.env.NEXT_PUBLIC_SCRAPER_API_URL || 'http://localhost:5000').replace(/\/$/, '');
export const SCRAPER_WS_URL = SCRAPER_API_URL.replace(/^http/, 'ws');

export const NEXT_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000').replace(/\/$/, '');

export const API_ENDPOINTS = {

    auth: {
        login: `${API_URL}/api/login`,
        register: `${API_URL}/api/register`,
        verifyEmail: `${API_URL}/api/verify-email`,
        logout: `${API_URL}/api/logout`,
        me: `${API_URL}/api/me`,
    },

    users: {
        list: `${API_URL}/api/users`,
        byId: (id: string) => `${API_URL}/api/users/${id}`,
        update: (id: string) => `${API_URL}/api/users/${id}`,
        delete: (id: string) => `${API_URL}/api/users/${id}`,
    },

    colleges: {
        list: `${API_URL}/api/all-colleges`,
        byName: (name: string) => `${API_URL}/api/college/${encodeURIComponent(name)}`,
        create: `${API_URL}/api/college`,
        update: (name: string) => `${API_URL}/api/college/${encodeURIComponent(name)}`,
        delete: (name: string) => `${API_URL}/api/college/${encodeURIComponent(name)}`,
        pending: `${API_URL}/api/pending-colleges`,
        approved: `${API_URL}/api/approved-colleges`,
        approve: (name: string) => `${API_URL}/api/college/${encodeURIComponent(name)}/approve`,
        reject: (name: string) => `${API_URL}/api/college/${encodeURIComponent(name)}/reject`,
    },

    tests: {
        mvti: {
            questions: `${API_URL}/api/mvti/questions`,
            submit: `${API_URL}/api/mvti/submit`,
            results: `${API_URL}/api/mvti/results`,
            userResults: `${API_URL}/api/mvti/user-results`,
        },
        cognitive: {
            questions: `${API_URL}/api/cognitive/questions`,
            submit: `${API_URL}/api/cognitive/submit`,
            results: `${API_URL}/api/cognitive/results`,
            userResults: `${API_URL}/api/cognitive/user-results`,
        },
        psychometric: {
            questions: `${API_URL}/api/psychometric/questions`,
            submit: `${API_URL}/api/psychometric/submit`,
            results: `${API_URL}/api/psychometric/results`,
            userResults: `${API_URL}/api/psychometric/user-results`,
        },
        allResults: `${API_URL}/api/test-results`,
    },

    admin: {
        dashboard: `${API_URL}/api/admin/dashboard`,
        stats: `${API_URL}/api/admin/stats`,

        colleges: {
            pending: `${API_URL}/api/admin/pending-colleges`,
            approved: `${API_URL}/api/admin/approved-colleges`,
            approve: (name: string) => `${API_URL}/api/admin/approve/${encodeURIComponent(name)}`,
            reject: (name: string) => `${API_URL}/api/admin/reject/${encodeURIComponent(name)}`,
            delete: (name: string) => `${API_URL}/api/admin/delete/${encodeURIComponent(name)}`,
            update: `${API_URL}/api/admin/update-college`,
        },

        redis: {
            stats: `${API_URL}/api/admin/redis/stats`,
            colleges: `${API_URL}/api/admin/redis/colleges`,
            populate: `${API_URL}/api/admin/redis/populate`,
            clear: `${API_URL}/api/admin/redis/clear`,
            sync: (name: string) => `${API_URL}/api/admin/redis/sync/${encodeURIComponent(name)}`,
            delete: (name: string) => `${API_URL}/api/admin/redis/delete/${encodeURIComponent(name)}`,
        },

        users: {
            list: `${API_URL}/api/admin/users`,
            delete: (email: string) => `${API_URL}/api/admin/users/${encodeURIComponent(email)}`,
        },

        tests: {
            results: `${API_URL}/api/admin/test-results`,
            resultById: (id: string) => `${API_URL}/api/admin/test-result/${id}`,
        },

        psychometric: {
            registrations: (status?: string) => `${API_URL}/api/admin/psychometric/registrations${status ? `?status=${status}` : ''}`,
            approve: (id: string) => `${API_URL}/api/admin/psychometric/approve/${id}`,
            reject: (id: string) => `${API_URL}/api/admin/psychometric/reject/${id}`,
            results: `${API_URL}/api/admin/psychometric/results`,
            resultById: (id: string) => `${API_URL}/api/admin/psychometric/result/${id}`,
        },

        mbti: {
            registrations: (status?: string) => `${API_URL}/api/admin/mbti/registrations${status ? `?status=${status}` : ''}`,
            approve: (id: string) => `${API_URL}/api/admin/mbti/approve/${id}`,
            reject: (id: string) => `${API_URL}/api/admin/mbti/reject/${id}`,
            results: `${API_URL}/api/admin/mbti/results`,
            resultById: (id: string) => `${API_URL}/api/admin/mbti/result/${id}`,
        },

        cognitive: {
            registrations: (status?: string) => `${API_URL}/api/admin/cognitive/registrations${status ? `?status=${status}` : ''}`,
            approve: (id: string) => `${API_URL}/api/admin/cognitive/approve/${id}`,
            reject: (id: string) => `${API_URL}/api/admin/cognitive/reject/${id}`,
            results: `${API_URL}/api/admin/cognitive/results`,
            resultById: (id: string) => `${API_URL}/api/admin/cognitive/result/${id}`,
        },

        pescio: {
            registrations: (status?: string) => `${API_URL}/api/admin/pescio/registrations${status ? `?status=${status}` : ''}`,
            approve: (id: string) => `${API_URL}/api/admin/pescio/approve/${id}`,
            reject: (id: string) => `${API_URL}/api/admin/pescio/reject/${id}`,
            results: `${API_URL}/api/admin/pescio/results`,
            resultById: (id: string) => `${API_URL}/api/admin/pescio/result/${id}`,
        },

        gre: {
            dashboard: `${GRE_API_URL}/api/admin/gre/dashboard`,
            tickets: `${GRE_API_URL}/api/admin/tickets`,
            ticketById: (id: string) => `${GRE_API_URL}/api/admin/tickets/${id}`,
            approveTicket: (id: string) => `${GRE_API_URL}/api/admin/tickets/${id}/approve`,
            rejectTicket: (id: string) => `${GRE_API_URL}/api/admin/tickets/${id}/reject`,
            auditTrail: `${GRE_API_URL}/api/admin/gre/audit-trail`,
            questions: `${GRE_API_URL}/api/admin/questions`,
            questionById: (id: string) => `${GRE_API_URL}/api/admin/questions/${id}`,
            createQuestion: `${GRE_API_URL}/api/admin/questions`,
            updateQuestion: (id: string) => `${GRE_API_URL}/api/admin/questions/${id}`,
            deleteQuestion: (id: string) => `${GRE_API_URL}/api/admin/questions/${id}`,
            allocations: `${GRE_API_URL}/api/allocations`,
            myAllocations: `${GRE_API_URL}/api/allocations/my-allocations`,
            schedule: `${GRE_API_URL}/api/allocations/schedule`,
            results: `${GRE_API_URL}/api/results`,
            myResults: `${GRE_API_URL}/api/results/my-results`,
        },
    },

    stats: {
        colleges: `${API_URL}/api/stats/colleges`,
        users: `${API_URL}/api/stats/users`,
    },

    // Serper API endpoints for college search and statistics
    serper: {
        countries: `${SERPER_API_URL}/api/countries`,
        collegesByCountry: (country: string) => `${SERPER_API_URL}/api/colleges-by-country?country=${encodeURIComponent(country)}`,
        collegeStatistics: `${SERPER_API_URL}/api/college-statistics`,
        mostSearched: (limit: number = 6) => `${SERPER_API_URL}/api/most-searched?limit=${limit}`,
        health: `${SERPER_API_URL}/health`,
        wsCountries: `${SERPER_WS_URL}/ws/countries`,
        wsColleges: `${SERPER_WS_URL}/ws/colleges`,
    },

    // Scraper pipeline endpoints (server.py port 5000)
    scraper: {
        checkOrStart: `${SCRAPER_API_URL}/api/check-or-start`,
        stream: (runId: string) => `${SCRAPER_API_URL}/api/stream/${runId}`,
        status: `${SCRAPER_API_URL}/api/status`,
        data: (college: string, country: string) =>
            `${SCRAPER_API_URL}/api/data?college_name=${encodeURIComponent(college)}&country=${encodeURIComponent(country)}`,
        countries: `${SCRAPER_API_URL}/api/countries`,
        collegesByCountry: (country: string) =>
            `${SCRAPER_API_URL}/api/colleges-by-country?country=${encodeURIComponent(country)}`,
        universities: `${SCRAPER_API_URL}/api/universities`,
        incrementalData: `${SCRAPER_API_URL}/api/incremental-data`,
    },
};

export const config = {
    apiUrl: API_URL,
    serperApiUrl: SERPER_API_URL,
    scraperApiUrl: SCRAPER_API_URL,
    nextApiUrl: NEXT_API_URL,
    endpoints: API_ENDPOINTS,

    features: {
        enableTests: true,
        enableCollegeSubmission: true,
        enableAdminPanel: true,
    },

    app: {
        name: 'University Portal',
        version: '1.0.0',
    },
};

export function buildUrl(baseUrl: string, params?: Record<string, string | number | boolean>): string {
    if (!params) return baseUrl;

    const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export default config;
