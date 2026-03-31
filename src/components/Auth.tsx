import React from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Calendar as CalendarIcon, ShieldCheck, Clock, Zap } from 'lucide-react';

export const Auth: React.FC = () => {
  const handleLogin = async () => {
    console.log('Iniciando proceso de login con Microsoft...');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'User.Read User.Read.All Calendars.ReadWrite Calendars.ReadWrite.Shared Place.Read.All',
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        },
      });

      if (error) {
        console.error('Error de Supabase Auth:', error.message);
        alert('Error de inicio de sesión: ' + error.message);
      } else {
        console.log('Respuesta de Auth (redirigiendo...):', data);
      }
    } catch (err: any) {
      console.error('Error inesperado durante el login:', err);
      alert('Error inesperado: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Sidebar Content (Hero) */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] bg-[#235b73] p-12 text-white relative">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
              <CalendarIcon size={24} strokeWidth={2.5} className="text-[#00adef]" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">Livigui <span className="opacity-40 font-medium">Salas</span></span>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-black leading-[1.1] tracking-tight mb-6">
              Gestión de <br />
              Espacios <br />
              <span className="text-[#00adef]">Premium.</span>
            </h1>
            <p className="text-base text-cyan-50/70 max-w-sm font-medium leading-relaxed">
              Optimice la colaboración en su organización con nuestra plataforma de reserva de salas de alto rendimiento.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3 mt-12">
          {[
            { icon: <Zap size={14} />, text: 'Sincronización' },
            { icon: <ShieldCheck size={14} />, text: 'Aprobaciones' },
            { icon: <Clock size={14} />, text: 'Tiempo Real' },
            { icon: <LogIn size={14} />, text: 'Acceso SSO' }
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-2.5 text-cyan-50 font-bold uppercase text-[9px] tracking-wider bg-white/5 px-4 py-3 rounded-xl backdrop-blur-md border border-white/5">
              <span className="text-[#00adef]">{feat.icon}</span>
              {feat.text}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content (Login) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-20 bg-white relative">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
             <CalendarIcon size={28} className="text-[#235b73]" />
             <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">Livigui <span className="text-[#00adef]">Salas</span></span>
          </div>

          <header className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 text-[#235b73] text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100 mb-6">
               Enterprise Solution
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Acceso</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">
              Utilice su cuenta corporativa de Microsoft 365 para ingresar al sistema.
            </p>
          </header>

          <div className="space-y-5">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3.5 px-6 py-4 bg-[#235b73] hover:bg-[#1a4558] text-white font-black rounded-xl transition-all shadow-xl shadow-[#235b73]/10 hover:-translate-y-0.5 active:scale-[0.98] focus:ring-4 focus:ring-slate-100 group"
            >
              <img
                src="https://www.microsoft.com/favicon.ico"
                className="w-5 h-5 object-contain"
                alt="Microsoft Logo"
              />
              <span className="text-base">Continuar con Microsoft</span>
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-50"></div></div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.2em]"><span className="bg-white px-4 text-slate-200">Seguridad M365</span></div>
            </div>

            <p className="text-slate-300 text-center text-[10px] font-medium leading-relaxed px-4">
              Protegido por políticas corporativas y <a href="#" className="text-[#00adef] hover:underline">términos de privacidad</a>.
            </p>
          </div>
        </div>

        <footer className="absolute bottom-10 text-slate-200 text-[8px] font-black uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} LIVIGUI ENTERPRISE
        </footer>
      </div>
    </div>
  );
};
