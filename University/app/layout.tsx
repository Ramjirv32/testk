import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, Raleway, Roboto, Montserrat, Open_Sans, Poppins, Noto_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import NavigationReloader from "@/components/layout/NavigationReloader";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  weight: ['200', '400', '600'],
  subsets: ['latin'],
  variable: '--font-nunito',
});

const raleway = Raleway({
  weight: ['200', '400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-raleway',
});

const notoSans = Noto_Sans({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-noto-sans',
});

export const metadata: Metadata = {
  title: "Top Ranking University",
  description: "Find your perfect university with TRU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {}
        <link rel="shortcut icon" type="image/x-icon" href="/images/tru-icon.png" />

        {}
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" rel="stylesheet" />

        {}
        <link href="https://fonts.googleapis.com/css?family=Material+Icons+Outlined" rel="stylesheet" />

        {}
        <link href="https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/css/select2.min.css" rel="stylesheet" />

        {}
        <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet" />

        {}
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />

        <link rel="stylesheet" href="/css/includes/all.min.css" />
        <link rel="stylesheet" href="/css/includes/bootstrap.min.css" />
        <link rel="stylesheet" href="/css/includes/owl.carousel.min.css" />
        <link rel="stylesheet" href="/css/includes/style.css" />
        <link rel="stylesheet" href="/css/includes/aos.css" />
        <link rel="stylesheet" href="/css/includes/toastr.min.css" />
        <link rel="stylesheet" href="/css/includes/animate.css" />
        <link rel="stylesheet" href="/css/auth/login.css" />
        <link rel="stylesheet" href="/css/includes/blue-theme.css" />
        <link rel="stylesheet" href="/css/includes/bordered-theme.css" />
        <link rel="stylesheet" href="/css/includes/main.css" />
        <link rel="stylesheet" href="/css/includes/responsive.css" />
        <link rel="stylesheet" href="/css/includes/semi-dark.css" />
        <link rel="stylesheet" href="/css/includes/pace.min.css" />
        <link rel="stylesheet" href="/css/includes/font-awesome.css" />
        <link rel="stylesheet" href="/css/includes/bootstrap-extended.css" />

        {}
        <link rel="stylesheet" href="/css/blog/blog-page.css" />
        <link rel="stylesheet" href="/css/blog/blog-list.css" />
        <link rel="stylesheet" href="/css/blog/blog-category.css" />
        <link rel="stylesheet" href="/css/blog/blog-detail.css" />

        {}
        <link rel="stylesheet" href="/css/includes/institute.css" />
        <link rel="stylesheet" href="/css/includes/all-university.css" />
      </head>
      <body className={`custom-cursor ${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${raleway.variable} ${notoSans.variable}`}>
        <div className="custom-cursor__cursor"></div>
        <div className="custom-cursor__cursor-two"></div>

        <AuthProvider>
          <NavigationReloader />
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>

        {}
        <Script src="https://code.jquery.com/jquery-3.7.1.min.js" strategy="beforeInteractive" />

        {}
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />

        {}
        <Script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-beta.1/dist/js/select2.min.js" strategy="afterInteractive" />

        {}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js" strategy="afterInteractive" />

        {}
        <Script src="https://cdn.quilljs.com/1.3.6/quill.js" strategy="afterInteractive" />

        {}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.19.3/jquery.validate.min.js" strategy="afterInteractive" />

        {}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js" strategy="afterInteractive" />

        {}
        <Script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js" strategy="afterInteractive" />

        {}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/js/all.min.js" strategy="afterInteractive" />

        {}
        <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels" strategy="afterInteractive" />

        {}
        <Script src="/js/plugins/owl.carousel.min.js" strategy="afterInteractive" />
        <Script src="/js/plugins/aos.js" strategy="afterInteractive" />
        <Script src="/js/custom.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
