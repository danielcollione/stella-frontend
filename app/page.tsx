import { Closing } from "@/components/landing/sections";
import { Faq } from "@/components/landing/Faq";
import { FAQ_QUESTIONS } from "@/components/landing/faqData";
import { Features } from "@/components/landing/Features";
import { Hero, TrustRow } from "@/components/landing/Hero";
import { LandingNav } from "@/components/landing/LandingNav";
import { Pricing } from "@/components/landing/Pricing";
import { NumbersReveal, PhotoFilm, PlannerSpotlight } from "@/components/landing/Showcase";
import { Skills } from "@/components/landing/Skills";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/utils/site";

// Dados estruturados (schema.org): dizem aos buscadores o que é o site, o produto e as perguntas frequentes
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      image: `${SITE_URL}/opengraph-image.jpg`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL", description: "Plano gratuito, sem cartão" },
      featureList: [
        "Guarda-roupa virtual por foto",
        "Looks do dia com a previsão do tempo",
        "Planejador de looks para eventos",
        "Coloração pessoal",
        "Painéis de uso do guarda-roupa",
        "Sugestões de compra com critério",
      ],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ_QUESTIONS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function Home() {
  return (
    // overflow-x-clip (e não hidden): "hidden" criaria uma área de rolagem e quebraria as seções presas (sticky)
    <div className="min-h-screen overflow-x-clip font-sans selection:bg-stone-300/60">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }} />
      <LandingNav />
      <main>
        <Hero />
        <TrustRow />
        <Skills />
        <PlannerSpotlight />
        <NumbersReveal />
        <PhotoFilm />
        <Features />
        <Pricing />
        <Faq />
        <Closing />
      </main>
    </div>
  );
}
