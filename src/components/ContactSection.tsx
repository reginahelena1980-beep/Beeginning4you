import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import {
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  HelpCircle
} from 'lucide-react';
import { ContactFormData } from '../types';

interface ContactSectionProps {
  prefilledNeed?: string;
  prefilledSolution?: string;
}

export default function ContactSection({ prefilledNeed = '', prefilledSolution = '' }: ContactSectionProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    businessName: '',
    segment: 'comercio',
    contactMethod: 'whatsapp',
    contactValue: '',
    biggestNeed: '',
    projectStage: 'rodando'
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefilledNeed || prefilledSolution) {
      const combined = [
        prefilledSolution ? `Interesse em: ${prefilledSolution}` : '',
        prefilledNeed ? `Desafio principal: ${prefilledNeed}` : ''
      ]
        .filter(Boolean)
        .join('. ');

      setFormData((prev) => ({
        ...prev,
        biggestNeed: prev.biggestNeed ? `${prev.biggestNeed}\n\n${combined}` : combined
      }));
    }
  }, [prefilledNeed, prefilledSolution]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Smooth user feedback
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  const generateWhatsAppUrl = () => {
    const stageMap: Record<string, string> = {
      ideia: 'Tenho uma ideia que quero tirar do papel',
      rodando: 'Já tenho o negócio rodando e quero melhorar',
      urgente: 'Preciso organizar meus processos com urgência'
    };

    const text = encodeURIComponent(
      `Olá, Beeginning 4 You! Gostaria de conversar sobre uma solução digital para o meu negócio.\n\n` +
      `👤 *Meu Nome:* ${formData.name || 'Não informado'}\n` +
      `🏢 *Negócio:* ${formData.businessName || 'Não informado'} (${formData.segment})\n` +
      `🎯 *Momento:* ${stageMap[formData.projectStage] || formData.projectStage}\n` +
      `💡 *O que realmente preciso:* ${formData.biggestNeed || 'Quero entender as possibilidades'}\n\n` +
      `Poderiam me orientar com os próximos passos?`
    );

    // Friendly placeholder support contact
    return `https://wa.me/5511999999999?text=${text}`;
  };

  return (
    <section id="contato" className="py-20 sm:py-28 bg-[#FFFFFF] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Brand Context & Warm Invitation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5A93B]/15 text-[#8F6413] text-xs font-bold uppercase tracking-wider">
              <span>Primeiro Passo</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1A1A] tracking-tight">
              Vamos descobrir o que seu negócio{' '}
              <span className="text-[#D99B26]">realmente precisa?</span>
            </h2>

            <p className="text-base text-[#4A4A48] leading-relaxed">
              Sem compromisso e sem apresentações corporativas de 50 páginas. Você nos conta onde o
              sapato aperta e nós desenhamos uma rota simples, viável e com preço honesto.
            </p>

            {/* Guarantees Box */}
            <div className="p-6 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E5] space-y-4">
              <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide">
                Nosso compromisso com você:
              </h3>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#E5A93B]/20 text-[#8F6413] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Resposta em até 24h úteis</p>
                  <p className="text-xs text-[#666666]">
                    Falamos diretamente com você no WhatsApp ou e-mail de forma rápida.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#1E3A47]/10 text-[#1E3A47] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Proposta transparente</p>
                  <p className="text-xs text-[#666666]">
                    Sem custos ocultos. Cada ferramenta sugerida terá um propósito claro.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#E5A93B]/20 text-[#8F6413] flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Diagnóstico honesto</p>
                  <p className="text-xs text-[#666666]">
                    Se uma solução gratuita já resolver o seu caso, nós te diremos isso.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Contact info */}
            <div className="pt-2 text-xs text-[#666666] space-y-2">
              <p className="font-semibold text-[#1A1A1A]">Prefere falar direto por mensagem?</p>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#1E3A47] hover:text-[#D99B26] font-medium transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D99B26]" />
                  <span>WhatsApp: (11) 99999-9999</span>
                </a>
                <a
                  href="mailto:contato@beeginning4you.com.br"
                  className="inline-flex items-center gap-1.5 text-[#1E3A47] hover:text-[#D99B26] font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#D99B26]" />
                  <span>contato@beeginning4you.com.br</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Friendly Form */}
          <div className="lg:col-span-7">
            <div className="bg-[#F9F9F8] border border-[#E5E5E2] rounded-2xl p-6 sm:p-10 shadow-xs relative">
              {isSubmitted ? (
                <div className="py-8 text-center space-y-5 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-[#E5A93B]/20 text-[#8F6413] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-[#D99B26]" />
                  </div>

                  <h3 className="text-2xl font-display font-black text-[#1A1A1A]">
                    Mensagem recebida com sucesso!
                  </h3>

                  <p className="text-sm text-[#555555] max-w-md mx-auto leading-relaxed">
                    Obrigado pelo seu contato, <strong>{formData.name || 'Empreendedor'}</strong>!
                    Já começamos a analisar a sua situação para preparar um retorno objetivo e acolhedor.
                  </p>

                  <div className="p-4 rounded-xl bg-white border border-[#E5E5E2] text-xs text-left max-w-md mx-auto space-y-1">
                    <span className="font-bold text-[#1E3A47]">Resumo do que você enviou:</span>
                    <p className="text-[#444444]">
                      <strong>Negócio:</strong> {formData.businessName || 'Em planejamento'}
                    </p>
                    <p className="text-[#444444] line-clamp-2">
                      <strong>Desafio:</strong> {formData.biggestNeed}
                    </p>
                  </div>

                  {/* Immediate WhatsApp jump option */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={generateWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Agilizar atendimento no WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: '',
                          businessName: '',
                          segment: 'comercio',
                          contactMethod: 'whatsapp',
                          contactValue: '',
                          biggestNeed: '',
                          projectStage: 'rodando'
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white border border-[#D5D5D0] text-[#444444] hover:text-[#1A1A1A] text-xs font-semibold transition-colors"
                    >
                      Enviar outra mensagem
                    </button>
                  </div>
                </div>
              ) : (
                <form id="contact-budget-form" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="input-name"
                        className="block text-xs font-bold uppercase tracking-wider text-[#333333] mb-1.5"
                      >
                        Seu Nome *
                      </label>
                      <input
                        type="text"
                        id="input-name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Como você prefere ser chamado?"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/30 text-sm text-[#1A1A1A] placeholder-[#999999] outline-none transition-all"
                      />
                    </div>

                    {/* Business Name */}
                    <div>
                      <label
                        htmlFor="input-business"
                        className="block text-xs font-bold uppercase tracking-wider text-[#333333] mb-1.5"
                      >
                        Nome do Negócio ou Marca
                      </label>
                      <input
                        type="text"
                        id="input-business"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Ex: Confeitaria Doce Mel (ou ainda no papel)"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/30 text-sm text-[#1A1A1A] placeholder-[#999999] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Segment */}
                    <div>
                      <label
                        htmlFor="select-segment"
                        className="block text-xs font-bold uppercase tracking-wider text-[#333333] mb-1.5"
                      >
                        Segmento de Atuação
                      </label>
                      <select
                        id="select-segment"
                        name="segment"
                        value={formData.segment}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/30 text-sm text-[#1A1A1A] outline-none transition-all"
                      >
                        <option value="comercio">Comércio Local / Varejo</option>
                        <option value="servicos">Prestação de Serviços / Consultoria</option>
                        <option value="alimentacao">Alimentação &amp; Confeitaria</option>
                        <option value="marca-autoral">Marca Autoral / Artesanato</option>
                        <option value="saude">Saúde &amp; Estética</option>
                        <option value="outro">Outro ramo</option>
                      </select>
                    </div>

                    {/* Stage */}
                    <div>
                      <label
                        htmlFor="select-stage"
                        className="block text-xs font-bold uppercase tracking-wider text-[#333333] mb-1.5"
                      >
                        Momento Atual
                      </label>
                      <select
                        id="select-stage"
                        name="projectStage"
                        value={formData.projectStage}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/30 text-sm text-[#1A1A1A] outline-none transition-all"
                      >
                        <option value="ideia">Ideia que quero tirar do papel</option>
                        <option value="rodando">Já tenho o negócio e quero melhorar</option>
                        <option value="urgente">Preciso organizar com urgência</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Preferred */}
                  <div>
                    <label
                      htmlFor="input-contact"
                      className="block text-xs font-bold uppercase tracking-wider text-[#333333] mb-1.5"
                    >
                      WhatsApp ou E-mail para retorno *
                    </label>
                    <input
                      type="text"
                      id="input-contact"
                      name="contactValue"
                      required
                      value={formData.contactValue}
                      onChange={handleChange}
                      placeholder="Ex: (11) 98765-4321 ou seuemail@exemplo.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/30 text-sm text-[#1A1A1A] placeholder-[#999999] outline-none transition-all"
                    />
                  </div>

                  {/* The Core Question: What does this business really need? */}
                  <div>
                    <label
                      htmlFor="textarea-biggest-need"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1E3A47] mb-1.5"
                    >
                      O que o seu negócio realmente precisa hoje? *
                    </label>
                    <textarea
                      id="textarea-biggest-need"
                      name="biggestNeed"
                      rows={4}
                      required
                      value={formData.biggestNeed}
                      onChange={handleChange}
                      placeholder="Conte com suas palavras: o que está tomando seu tempo hoje? Qual processo você gostaria de ver rodando sozinho ou mais organizado? Não precisa se preocupar em usar termos técnicos."
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/30 text-sm text-[#1A1A1A] placeholder-[#999999] outline-none transition-all resize-y"
                    />
                    <p className="text-[11px] text-[#777777] mt-1.5">
                      Dica: fale sobre sua rotina real (ex: "perco tempo no WhatsApp", "preciso de um site simples", "planilhas me deixam perdido").
                    </p>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-[#666666]">
                      🔒 Seus dados ficam 100% seguros. Zero spam.
                    </p>

                    <button
                      type="submit"
                      id="btn-submit-budget"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#1A1A1A] bg-[#E5A93B] hover:bg-[#D99B26] active:scale-98 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Enviando...</span>
                      ) : (
                        <>
                          <span>Pedir Diagnóstico Prático</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
