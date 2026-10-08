"use client";

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { PhoneMockup } from '@/components/features/PhoneMockup';
import { PageContent } from '@/components/layout/PageContent';

export default function Home() {
  return (
    <div className="min-h-screen font-sans selection:bg-stone-200 pb-20 overflow-x-hidden">
      <Navbar />

      <main>
        <PageContent stagger fadeOnly>
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center px-4 pt-16 pb-12">
          <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-stone-900 leading-[1.15]">
            A sua personal stylist com IA, <br />
            <span className="italic font-light">sempre no seu bolso.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-stone-600 max-w-xl mx-auto font-light leading-relaxed">
            Tire uma foto das suas roupas. A Stella organiza o seu guarda-roupa virtual e cria combinações elegantes para qualquer ocasião.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/login" className="bg-stone-900 text-stone-50 px-8 py-3.5 rounded-full text-sm font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
              Experimentar a Stella
            </Link>
          </div>
        </section>

        {/* Mockup Section */}
        <section className="flex justify-center px-4">
          <PhoneMockup />
        </section>
        </PageContent>
      </main>
    </div>
  );
}