import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type Step = 'welcome' | 'email' | 'password' | 'signup';

export function LoginScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [val, setVal] = useState('');

  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const roadRef = useRef<SVGPathElement>(null);
  const famRef = useRef<SVGGElement>(null);
  const doorRef = useRef<SVGRectElement>(null);
  const litRef = useRef<SVGRectElement>(null);
  const smkRef = useRef<SVGGElement>(null);
  const smkInnerRef = useRef<SVGGElement>(null);

  // Animação narrativa em loop contínuo: carro chega → família entra → reinicia
  useEffect(() => {
    const c = gsap.context(() => {
      // Entrada da cena: uma única vez, fora do loop
      gsap.from(svgRef.current, { scale: 0.85, opacity: 0, duration: 0.9, ease: 'power3.out' });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.15, defaults: { ease: 'power2.inOut' } });

      // Estado inicial de cada ciclo: carro bem fora do viewBox (que começa em -110)
      tl.set(carRef.current, { x: -175, opacity: 1 })
        .set(roadRef.current, { opacity: 1, strokeDashoffset: 150, attr: { 'stroke-dashoffset': 150 } })
        .set(doorRef.current, { opacity: 1, attr: { width: 16 } })
        .set(litRef.current, { opacity: 0 })
        .set(famRef.current, { opacity: 0, x: -25, y: 78, scale: 1 })
        .set(smkRef.current, { opacity: 0.3, y: 0 });

      // Carro entra de longe; a estrada é desenhada no mesmo ritmo e apaga conforme ele se aproxima
      tl.to(carRef.current, { x: -25, duration: 3, ease: 'power1.inOut' }, '+=0.3')
        .to(roadRef.current, { strokeDashoffset: 0, duration: 3, ease: 'power1.inOut' }, '<')
        .to(roadRef.current, { opacity: 0, duration: 1.8, ease: 'power2.in' }, '<1.1');

      // Família sai do carro e caminha até a porta
      tl.to(famRef.current, { opacity: 1, duration: 0.3 })
        .to(famRef.current, { x: 42, duration: 2.2, ease: 'power1.inOut' })
        .to(doorRef.current, { attr: { width: 1 }, duration: 0.4, ease: 'power2.out' })
        .to(litRef.current, { opacity: 0.9, duration: 0.3 }, '-=0.2')
        .to(famRef.current, { x: 50, scale: 0.1, opacity: 0, duration: 0.5, ease: 'power1.in' })
        .to(doorRef.current, { attr: { width: 16 }, duration: 0.3, ease: 'power2.in' })
        .to(litRef.current, { opacity: 0, duration: 0.2 }, '<')
        .to(smkRef.current, { opacity: 0.8, y: -12, duration: 1.2, ease: 'sine.out' });

      // Fim do ciclo: o carro some (o rastro já apagou na chegada), sem pausa vazia antes de recomeçar
      tl.to(carRef.current, { opacity: 0, duration: 0.5, ease: 'sine.in' }, '+=0.4')
        .to(smkRef.current, { opacity: 0.3, y: 0, duration: 0.5, ease: 'sine.inOut' }, '<');

      // Idle: fumaça flutua continuamente (grupo interno, sem brigar com a timeline)
      gsap.to(smkInnerRef.current, {
        y: -3,
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }, boxRef);
    return () => c.revert();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setVal(v);
    if (step === 'email') setEmail(v);
    else if (step === 'password') setPassword(v);
    else setDisplayName(v);
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Verifica se o e-mail já tem conta cadastrada sem fazer login real
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: '' });
      if (data?.user) {
        setStep('password');
      } else if (err) {
        const m = err.message.toLowerCase();
        // Se retornar "invalid login" ou similar, o e-mail existe mas a senha está vazia → pede senha
        // Se retornar "email not confirmed", avisa o usuário
        if (m.includes('email not confirmed')) {
          setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.');
          setStep('password');
        } else if (m.includes('invalid login') || m.includes('wrong password') || m.includes('bad credentials')) {
          setStep('password');
        } else {
          // Qualquer outro erro: manda para signup (e-mail provavelmente não existe)
          setStep('signup');
        }
      } else {
        setStep('signup');
      }
    } catch {
      setError('Não foi possível conectar. Verifique sua internet.');
    }
    setVal('');
    setLoading(false);
  };

  const submitPw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const r = await signInWithEmail(email, password);
    if (r.error) setError(r.error.message);
    setLoading(false);
  };

  const submitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const r = await signUpWithEmail(email, password, displayName);
    if (r.error) setError(r.error.message);
    setLoading(false);
  };

  const ph = {
    email: 'seu@email.com ou telefone',
    password: '••••••••',
    signup: 'Como podemos te chamar?',
  };
  const ti = {
    welcome: 'Bem-vindo à sua casa',
    email: 'Bem-vindo à sua casa',
    password: 'Que bom te ver de volta',
    signup: 'Vamos montar sua casa',
  };
  const sub = {
    welcome: 'Sua vida financeira organizada em um só lugar',
    email: 'Digite seu e-mail ou número para começar',
    password: 'Agora, sua senha secreta',
    signup: 'Crie sua conta em segundos',
  };
  const tp = step === 'password' ? 'password' : step === 'email' ? 'text' : 'text';
  const onSubmit = step === 'email' ? submitEmail : step === 'password' ? submitPw : submitSignup;

  return (
    <div ref={boxRef} className="min-h-screen flex items-center justify-center overflow-hidden relative bg-[#f7f4ef]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(196,112,75,0.06) 0%, transparent 70%)' }}
      />
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6">
        {/* SVG narrativo com animação em loop */}
        <svg
          ref={svgRef}
          viewBox="-110 -5 260 130"
          className="w-full max-w-[340px] h-auto mb-6 drop-shadow-lg"
          fill="none"
        >
          {/* Chão e vegetação */}
          <ellipse cx="50" cy="100" rx="95" ry="12" fill="#d1fae5" />
          <circle cx="8" cy="86" r="9" fill="#34d399" />
          <circle cx="92" cy="86" r="9" fill="#34d399" />

          {/* Casa */}
          <rect x="25" y="52" width="50" height="42" rx="2" fill="#fbbf24" />
          <path d="M18 55L50 26L82 55H18Z" fill="#f97316" stroke="#ea580c" strokeWidth="2" strokeLinejoin="round" />
          <rect x="62" y="33" width="6" height="13" rx="1" fill="#f97316" />

          {/* Fumaça */}
          <g ref={smkRef} opacity="0.3">
            <g ref={smkInnerRef}>
              <circle cx="65" cy="27" r="3" fill="#94a3b8" />
              <circle cx="68" cy="19" r="4" fill="#94a3b8" />
              <circle cx="64" cy="11" r="5" fill="#94a3b8" />
            </g>
          </g>

          {/* Janelas */}
          <rect x="30" y="59" width="11" height="11" rx="1" fill="#bae6fd" stroke="#fff" strokeWidth="1.5" />
          <line x1="35.5" y1="59" x2="35.5" y2="70" stroke="#fff" strokeWidth="1.5" />
          <line x1="30" y1="64.5" x2="41" y2="64.5" stroke="#fff" strokeWidth="1.5" />
          <rect x="59" y="59" width="11" height="11" rx="1" fill="#bae6fd" stroke="#fff" strokeWidth="1.5" />
          <line x1="64.5" y1="59" x2="64.5" y2="70" stroke="#fff" strokeWidth="1.5" />
          <line x1="59" y1="64.5" x2="70" y2="64.5" stroke="#fff" strokeWidth="1.5" />

          {/* Fundo escuro da porta (visível quando aberta) */}
          <rect x="42" y="68" width="16" height="26" fill="#1e293b" />
          <rect ref={litRef} x="42" y="68" width="16" height="26" fill="#fef3c7" opacity="0" />
          {/* Porta: rect simples que encolhe para a esquerda (simula dobradiça sem transform-origin) */}
          <rect ref={doorRef} x="42" y="68" width="16" height="26" rx="1" fill="#475569" />

          {/* Estrada */}
          <path
            ref={roadRef}
            d="M-175 97L-25 97"
            stroke="#d4c4b0"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="150"
            strokeDashoffset="150"
          />

          {/* Carro - começa fora da cena à esquerda */}
          <g ref={carRef} transform="translate(-175, 0)">
            <rect x="-13" y="84" width="26" height="11" rx="3" fill="#c4704b" />
            <rect x="-9" y="78" width="18" height="8" rx="2" fill="#e8a87c" />
            <circle cx="-7" cy="96" r="3.5" fill="#475569" />
            <circle cx="7" cy="96" r="3.5" fill="#475569" />
            <rect x="11" y="87" width="3" height="3" rx="1" fill="#fbbf24" />
          </g>

          {/* Família (oculta até carro chegar) */}
          <g ref={famRef} opacity="0">
            <circle cx="0" cy="0" r="3" fill="#475569" />
            <rect x="-2" y="3" width="4" height="10" rx="2" fill="#475569" />
            <circle cx="8" cy="2" r="2.5" fill="#64748b" />
            <rect x="6.5" y="4.5" width="3" height="7" rx="1.5" fill="#64748b" />
            <ellipse cx="16" cy="8" rx="4" ry="2.5" fill="#f59e0b" />
            <circle cx="19" cy="6" r="2" fill="#f59e0b" />
          </g>
        </svg>

        {/* Título e subtítulo */}
        <h1 className="text-xl font-bold text-[#5c4030] tracking-tight mb-1 text-center">{ti[step]}</h1>
        <p className="text-xs text-[#8b5e3c]/70 mb-6 text-center">{sub[step]}</p>

        {/* Step welcome: apenas botão Continuar */}
        {step === 'welcome' && (
          <button
            onClick={() => setStep('email')}
            className="w-full max-w-[280px] py-3 rounded-full bg-[#c4704b] text-white font-medium shadow-md hover:bg-[#b06040] active:scale-[0.98] transition-all text-sm"
          >
            Continuar
          </button>
        )}

        {/* Steps email/password/signup: input + botão */}
        {step !== 'welcome' && (
          <form onSubmit={onSubmit} className="w-full max-w-[280px] space-y-3">
            <input
              id="loginInput"
              ref={(el) => {
                if (el && !loading) el.focus();
              }}
              type={tp}
              required
              value={val}
              onChange={onChange}
              placeholder={ph[step]}
              autoComplete={
                step === 'password' ? 'current-password' : step === 'email' ? 'email' : 'name'
              }
              className="w-full text-center text-base text-[#5c4030] placeholder-[#b8a898]/60 bg-transparent border-0 border-b-2 border-[#d4c4b0] focus:border-[#c4704b] focus:ring-0 focus:outline-none pb-2 transition-colors"
              style={{
                background: 'transparent',
                boxShadow: 'none',
                WebkitAppearance: 'none',
                borderRadius: 0,
              }}
            />
            <button
              type="submit"
              disabled={loading || !val}
              className="w-full py-3 rounded-full bg-[#c4704b] text-white font-medium shadow-md hover:bg-[#b06040] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
            >
              {loading ? '...' : step === 'email' ? 'Continuar' : step === 'password' ? 'Entrar na casa' : 'Criar minha casa ✨'}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-pulse w-full max-w-[280px] text-center">
            {error}
          </div>
        )}

        {step !== 'welcome' && (
          <button
            type="button"
            onClick={() => {
              setStep('welcome');
              setVal('');
              setError(null);
            }}
            className="mt-4 text-xs text-[#8b5e3c]/60 hover:text-[#c4704b] transition-colors"
          >
            ← Voltar
          </button>
        )}

        <p className="mt-8 text-xs text-[#b8a898]">Seus dados ficam seguros no Supabase 🔒</p>
      </div>
    </div>
  );
}