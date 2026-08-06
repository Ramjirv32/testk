import FindYourFitSection from '@/components/home/FindYourFitSection';

export const metadata = {
  title: 'Find Your Fit | Top Ranking University',
  description: 'Psychometric-powered guidance to help you discover the right course and college.',
};

export default function FindYourFitPage() {
  return (
    <main className="min-h-screen bg-[#f8f5f0]">
      <section className="pt-16 pb-4 bg-white border-b border-[#ede9e4]">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-[#2d2d2d]">Find Your Fit</h1>
        </div>
      </section>
      <FindYourFitSection />
    </main>
  );
}
