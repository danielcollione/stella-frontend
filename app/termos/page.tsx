import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, SupportLink } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/termos" },
  title: "Termos de uso · Stella",
  description: "As regras de uso da Stella: planos, teste grátis, cobrança, cancelamento e responsabilidades.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Stella"
      title="Termos de uso"
      updatedAt="13 de outubro de 2026"
      intro={
        <>
          <p>
            Estes termos explicam como a Stella funciona e o que combinamos com você ao usar o app. Ao criar uma conta ou usar a
            Stella, você concorda com eles e com a nossa <Link href="/privacidade" className="font-medium text-stone-900 underline underline-offset-4 hover:text-stone-600">Política de Privacidade</Link>.
          </p>
          <p>Se algo não ficar claro, envie um e-mail para o <SupportLink />.</p>
        </>
      }
    >
      <LegalSection title="1. O que é a Stella">
        <p>
          A Stella é uma estilista pessoal com inteligência artificial. Você cadastra as suas roupas, conversa com a Stella e
          recebe sugestões de looks, de combinações e de peças, além de planejar o que vestir em eventos.
        </p>
        <p>
          O serviço é oferecido no site usestella.app. O responsável pelo serviço é Daniel Collione Fais Christino, pessoa física,
          com atendimento exclusivamente pelo e-mail do <SupportLink />.
        </p>
      </LegalSection>

      <LegalSection title="2. Quem pode usar">
        <ul>
          <li>Você precisa ter 18 anos ou mais.</li>
          <li>As informações do cadastro devem ser verdadeiras e suas. Não crie conta com o e-mail de outra pessoa.</li>
          <li>A conta é pessoal. Você é responsável por manter a sua senha em segredo e por tudo o que for feito na sua conta.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. As respostas da Stella são sugestões">
        <p>
          A Stella usa inteligência artificial para analisar textos e fotos. As respostas são sugestões de estilo e podem conter
          erros: uma peça pode ser identificada de forma incorreta, uma combinação pode não agradar e a previsão do tempo usada
          nos looks pode mudar.
        </p>
        <p>
          A decisão sobre o que vestir e o que comprar é sempre sua. A Stella não substitui orientação profissional de qualquer
          outra área.
        </p>
      </LegalSection>

      <LegalSection title="4. Planos e limites">
        <ul>
          <li>A Stella tem um plano gratuito (Provador) e planos pagos (Atelier e Couture).</li>
          <li>
            Cada plano tem limites de uso, como mensagens por mês, fotos no chat por mês e peças no guarda-roupa. Os limites e os
            preços atuais estão sempre na página de planos do app.
          </li>
          <li>Os limites mensais se renovam a cada ciclo da assinatura (ou a cada mês, no plano gratuito) e não se acumulam.</li>
          <li>
            Para proteger o serviço, podemos limitar pedidos feitos em sequência muito rápida e pausar temporariamente recursos
            automáticos quando identificarmos uso fora do normal.
          </li>
          <li>
            Preços, limites e recursos podem mudar. Mudanças de preço em assinaturas em andamento são avisadas com antecedência e
            só valem a partir do ciclo seguinte.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Teste grátis">
        <ul>
          <li>Quando disponível, o teste grátis dura 7 dias, vale uma vez por pessoa e exige o cadastro de um cartão.</li>
          <li>Se você cancelar antes do fim do teste, nada é cobrado.</li>
          <li>Se não cancelar, a primeira cobrança acontece ao fim do teste e a assinatura segue ativa.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Cobrança, cancelamento e reembolso">
        <ul>
          <li>As assinaturas são mensais ou anuais, cobradas antecipadamente e renovadas automaticamente até você cancelar.</li>
          <li>
            Os pagamentos são processados pela Stripe. A Stella não recebe nem guarda os dados completos do seu cartão.
          </li>
          <li>
            Você pode cancelar a qualquer momento, na área de assinatura do seu perfil. Ao cancelar, você mantém os recursos do
            plano até o fim do período já pago e depois volta ao plano gratuito, sem novas cobranças.
          </li>
          <li>
            <strong>Não há reembolso de períodos já pagos</strong>, inteiros ou parciais. O teste grátis de 7 dias existe para você
            conhecer o plano antes da primeira cobrança.
          </li>
          <li>
            Fica preservado o direito de arrependimento previsto no Código de Defesa do Consumidor: quando a contratação for
            feita sem teste grátis, você pode desistir em até 7 dias da contratação e receber de volta o valor pago. Para isso,
            envie um e-mail para o <SupportLink />.
          </li>
          <li>Se uma cobrança falhar, tentaremos novamente por alguns dias. Sem pagamento, a conta volta ao plano gratuito.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. O que você envia para a Stella">
        <ul>
          <li>As fotos, mensagens e informações que você envia continuam sendo suas.</li>
          <li>
            Você nos autoriza a guardar e processar esse conteúdo apenas para fazer a Stella funcionar para você, o que inclui o
            envio para o serviço de inteligência artificial que gera as respostas. Os detalhes estão na Política de Privacidade.
          </li>
          <li>Envie apenas fotos que você tem o direito de usar. Não envie fotos de outras pessoas sem a autorização delas.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Uso que não é permitido">
        <ul>
          <li>Enviar conteúdo ilegal, ofensivo, com nudez ou que envolva menores de idade.</li>
          <li>Tentar burlar os limites do plano, automatizar o uso com robôs ou sobrecarregar o serviço.</li>
          <li>Acessar contas ou dados de outras pessoas, ou explorar falhas de segurança.</li>
          <li>Revender ou oferecer a Stella a terceiros como se fosse um serviço seu.</li>
        </ul>
        <p>Contas que descumprirem estas regras podem ser limitadas, suspensas ou encerradas.</p>
      </LegalSection>

      <LegalSection title="9. Links de parceiros">
        <p>
          Quando a Stella sugere uma peça para comprar, pode mostrar um botão de busca em lojas parceiras. O botão “Buscar
          online” é um link de parceiro: como Associada da Amazon, a Stella ganha com compras qualificadas, sem custo adicional
          para você.
        </p>
        <p>
          As compras são feitas diretamente com a loja. Preço, entrega, troca e qualidade dos produtos são de responsabilidade
          da loja, e não da Stella.
        </p>
      </LegalSection>

      <LegalSection title="10. Disponibilidade do serviço">
        <p>
          Trabalhamos para a Stella estar sempre disponível, mas o serviço pode ficar fora do ar ou lento por manutenção, falhas
          técnicas ou problemas em serviços de terceiros. Não garantimos funcionamento ininterrupto.
        </p>
        <p>
          Na medida permitida pela lei, a nossa responsabilidade por problemas no serviço se limita ao valor pago por você nos
          últimos 12 meses. Nada aqui reduz os direitos que a lei garante a você como consumidor.
        </p>
      </LegalSection>

      <LegalSection title="11. Encerramento da conta">
        <p>
          Você pode pedir a exclusão da sua conta e dos seus dados a qualquer momento, enviando um e-mail para o <SupportLink />.
          Se houver assinatura ativa, cancele-a antes na área de assinatura do perfil.
        </p>
      </LegalSection>

      <LegalSection title="12. Mudanças nestes termos">
        <p>
          Podemos atualizar estes termos. Quando a mudança for relevante, avisaremos no app ou por e-mail. A data da última
          atualização fica sempre no topo desta página.
        </p>
      </LegalSection>

      <LegalSection title="13. Lei aplicável">
        <p>
          Estes termos seguem as leis do Brasil. Em caso de conflito, vale o foro do domicílio do consumidor, como prevê o
          Código de Defesa do Consumidor.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
