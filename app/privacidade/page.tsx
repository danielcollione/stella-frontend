import type { Metadata } from "next";
import { LegalPage, LegalSection, SupportLink } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/privacidade" },
  title: "Política de privacidade · Stella",
  description: "Quais dados a Stella guarda, para que usa, com quem compartilha e como você controla os seus dados.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Stella"
      title="Política de privacidade"
      updatedAt="13 de outubro de 2026"
      intro={
        <>
          <p>
            Esta política explica, em linguagem direta, quais dados a Stella guarda, para que usa, com quem compartilha e como
            você pode ver, corrigir ou apagar os seus dados. Ela segue a Lei Geral de Proteção de Dados (LGPD).
          </p>
          <p>Para qualquer dúvida ou pedido sobre os seus dados, envie um e-mail para o <SupportLink />.</p>
        </>
      }
    >
      <LegalSection title="1. Quem cuida dos seus dados">
        <p>
          O responsável pelo tratamento dos dados (controlador) é Daniel Collione Fais Christino, pessoa física, que opera a
          Stella. O contato para assuntos de privacidade é o e-mail do <SupportLink />.
        </p>
      </LegalSection>

      <LegalSection title="2. Quais dados guardamos">
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail e, se você criar conta com senha, a senha protegida por criptografia (não
            conseguimos ler a sua senha). Se você entrar com o Google, recebemos do Google o seu nome e o seu e-mail.
          </li>
          <li>
            <strong>Perfil de estilo:</strong> preferência de vestuário, estilos de vida, tom de conversa escolhido, cidade,
            ano de nascimento e telefone, quando informados.
          </li>
          <li>
            <strong>Guarda-roupa:</strong> as fotos das peças que você cadastra e as informações de cada uma (categoria, cor,
            estilo, marca, nome).
          </li>
          <li>
            <strong>Conversas:</strong> as mensagens e as fotos que você envia no chat, as respostas da Stella e as suas
            avaliações (gostei, não gostei e o motivo).
          </li>
          <li>
            <strong>O que a Stella aprende sobre você:</strong> a sua paleta de cores, só se você escolher salvá-la depois de uma
            análise (você pode apagá-la a qualquer momento no Perfil), e um resumo das suas preferências, usado para melhorar
            as próximas sugestões.
          </li>
          <li><strong>Eventos:</strong> os compromissos que você cadastra (título, data, local, cidade, observações) e os looks planejados.</li>
          <li>
            <strong>Assinatura:</strong> o plano, a situação da assinatura e as datas de cobrança. Os dados do cartão ficam
            somente com a Stripe.
          </li>
          <li>
            <strong>Uso do serviço:</strong> quantidade de mensagens, fotos e peças (para aplicar os limites do plano) e
            registros técnicos das chamadas à inteligência artificial (data, tipo de pedido e volume de texto processado).
          </li>
        </ul>
        <p>
          Não usamos ferramentas de publicidade nem rastreamos você entre sites. Medimos apenas as visitas às páginas, de
          forma agregada e anônima, sem cookies (veja o item 5).
        </p>
      </LegalSection>

      <LegalSection title="3. Para que usamos">
        <ul>
          <li>Fazer a Stella funcionar: montar looks, analisar peças e fotos, lembrar do seu estilo e planejar os seus eventos.</li>
          <li>Considerar o clima da sua cidade e da cidade dos seus eventos nas sugestões.</li>
          <li>Cobrar a assinatura e aplicar os limites de cada plano.</li>
          <li>Manter o serviço seguro e estável, evitar abusos e corrigir falhas.</li>
          <li>Falar com você sobre a sua conta, quando necessário.</li>
        </ul>
        <p>
          As bases legais são a execução do contrato com você (os termos de uso), o cumprimento de obrigações legais e o
          legítimo interesse em manter o serviço seguro. Não vendemos os seus dados e não os usamos para publicidade de
          terceiros.
        </p>
      </LegalSection>

      <LegalSection title="4. Inteligência artificial e as suas fotos">
        <p>
          Para responder, a Stella envia para a OpenAI, empresa que fornece a inteligência artificial, o conteúdo necessário a
          cada pedido: as suas mensagens, as fotos enviadas no chat ou no cadastro de peças, a descrição das peças do seu
          guarda-roupa, informações do seu perfil de estilo (como preferências, cidade e faixa de idade) e os seus eventos.
        </p>
        <ul>
          <li>Esse envio acontece apenas para gerar as respostas para você.</li>
          <li>O seu nome e o seu e-mail não fazem parte do que é enviado para gerar as respostas.</li>
          <li>
            Evite enviar fotos ou mensagens com informações que você não quer compartilhar, como documentos, endereços ou
            imagens de outras pessoas.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Com quem compartilhamos">
        <p>Compartilhamos dados apenas com os serviços que fazem a Stella funcionar, cada um com o mínimo necessário:</p>
        <ul>
          <li><strong>OpenAI:</strong> inteligência artificial, como explicado acima.</li>
          <li><strong>Cloudflare:</strong> armazenamento das fotos.</li>
          <li>
            <strong>Railway e Vercel:</strong> hospedagem do sistema, do banco de dados e do site. A Vercel também conta as
            visitas às páginas, de forma agregada e anônima, sem cookies e sem identificar você.
          </li>
          <li>
            <strong>Brevo:</strong> envio dos e-mails da conta (código de confirmação e de nova senha). Recebe o seu nome e o
            seu e-mail.
          </li>
          <li><strong>GitHub:</strong> execução da rotina diária de cópia de segurança do banco de dados, guardada na Cloudflare.</li>
          <li><strong>Stripe:</strong> pagamentos. Recebe os dados de cobrança que você informa diretamente a ela.</li>
          <li><strong>Google:</strong> login, se você escolher entrar com a sua conta Google.</li>
          <li>
            <strong>Open-Meteo, Nominatim (OpenStreetMap) e Photon:</strong> previsão do tempo, busca de cidades e
            identificação da cidade quando você usa a localização do aparelho. Recebem apenas a localização ou o texto
            digitado na busca, sem identificar você.
          </li>
          <li>
            <strong>Lojas parceiras e mapas:</strong> só quando você clica em “Buscar online” ou “Ver lojas perto”. O site
            aberto recebe o termo da busca e passa a seguir a política de privacidade dele.
          </li>
        </ul>
        <p>
          Alguns desses serviços ficam fora do Brasil, então os seus dados podem ser processados em outros países. Também
          podemos compartilhar dados quando a lei ou uma ordem judicial exigir.
        </p>
      </LegalSection>

      <LegalSection title="6. Como protegemos">
        <ul>
          <li>A comunicação com a Stella é sempre criptografada (HTTPS).</li>
          <li>Os dados de localização embutidos nas fotos (como o GPS da câmera) são removidos antes de guardarmos a imagem.</li>
          <li>As fotos enviadas no chat são guardadas criptografadas.</li>
          <li>As fotos ficam em armazenamento privado e só são exibidas por links temporários, gerados para a sua conta.</li>
          <li>As senhas são guardadas de forma que não podem ser lidas, nem por nós.</li>
        </ul>
        <p>
          Nenhum sistema é totalmente imune a falhas. Se ocorrer um incidente de segurança que possa afetar você, avisaremos
          como determina a lei.
        </p>
      </LegalSection>

      <LegalSection title="7. Por quanto tempo guardamos">
        <ul>
          <li>Guardamos os seus dados enquanto a sua conta existir.</li>
          <li>
            Você pode apagar peças, conversas e eventos pelo próprio app a qualquer momento. Ao apagar uma conversa, as fotos
            enviadas nela também são apagadas.
          </li>
          <li>
            Você pode excluir a sua conta a qualquer momento, no fim da tela de perfil (“Excluir minha conta”). Na hora,
            apagamos o seu guarda-roupa, as suas fotos, conversas e eventos e encerramos a assinatura, se houver. Fica apenas
            o que a lei nos obriga a manter (por exemplo, os registros de cobrança, guardados pela Stripe).
          </li>
          <li>
            Mantemos cópias de segurança do banco de dados por até 30 dias. Dados apagados podem permanecer nessas cópias
            até elas serem eliminadas, e não são usados para nenhuma outra finalidade.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Os seus direitos">
        <p>Pela LGPD, você pode, a qualquer momento:</p>
        <ul>
          <li>saber se guardamos dados seus e receber uma cópia deles;</li>
          <li>corrigir dados incompletos ou desatualizados (a maior parte você mesmo altera no perfil);</li>
          <li>excluir os seus dados e a sua conta (pelo próprio perfil ou por e-mail);</li>
          <li>pedir a portabilidade dos dados ou informações sobre com quem foram compartilhados;</li>
          <li>retirar um consentimento que tenha dado.</li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, envie um e-mail para o <SupportLink />, usando o mesmo e-mail da sua conta.
          Respondemos em até 15 dias. Você também pode procurar a Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies e dados no seu aparelho">
        <p>
          A Stella não usa cookies de rastreamento nem de publicidade. Para funcionar, ela guarda no seu navegador apenas o
          necessário: o seu login e algumas preferências do app (por exemplo, se as fotos do chat devem ser salvas no
          guarda-roupa). Esses dados ficam no seu aparelho e somem quando você sai da conta ou limpa os dados do navegador.
        </p>
        <p>
          O pagamento e o login com Google acontecem em páginas da Stripe e do Google, que podem usar os próprios cookies,
          conforme as políticas deles.
        </p>
      </LegalSection>

      <LegalSection title="10. Menores de idade">
        <p>
          A Stella é para maiores de 18 anos. Não coletamos intencionalmente dados de menores. Se soubermos que uma conta
          pertence a um menor, ela será encerrada e os dados apagados.
        </p>
      </LegalSection>

      <LegalSection title="11. Mudanças nesta política">
        <p>
          Podemos atualizar esta política. Quando a mudança for relevante, avisaremos no app ou por e-mail. A data da última
          atualização fica sempre no topo desta página.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
