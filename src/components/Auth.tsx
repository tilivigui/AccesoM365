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
          scopes: 'User.Read User.Read.All Calendars.ReadWrite Place.Read.All',
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
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Sidebar Content (Hero) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#235b73] p-16 text-white relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-xl">
              <CalendarIcon size={36} strokeWidth={2.5} className="text-[#00adef]" />
            </div>
            <span className="text-3xl font-black tracking-tighter">LIVIGUI <span className="opacity-50 font-medium">SALAS</span></span>
          </div>

          <div className="space-y-8">
            <h1 className="text-7xl font-black leading-[1] tracking-tight mb-8">
              Soluciones <br />
              <span className="text-[#00adef]">Rápidas</span> y <br />
              Duraderas.
            </h1>
            <p className="text-xl text-cyan-50/80 max-w-md font-bold leading-relaxed">
              Gestione sus salas de reuniones con la eficiencia de Microsoft 365 y la potencia de LIVIGUI.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 mt-12">
          {[
            { icon: <Zap size={18} />, text: 'Sincronización' },
            { icon: <ShieldCheck size={18} />, text: 'Aprobaciones' },
            { icon: <Clock size={18} />, text: 'Tiempo Real' },
            { icon: <LogIn size={18} />, text: 'Acceso SSO' }
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-3 text-cyan-50 font-black uppercase text-[10px] tracking-widest bg-white/5 px-5 py-4 rounded-2xl backdrop-blur-md border border-white/10">
              <span className="text-[#00adef]">{feat.icon}</span>
              {feat.text}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content (Login) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-16 justify-center">
             <CalendarIcon size={32} className="text-[#235b73]" />
             <span className="text-2xl font-black text-slate-900 tracking-tighter">LIVIGUI <span className="text-[#00adef]">SALAS</span></span>
          </div>

          <header className="mb-12 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 text-[#00adef] text-[10px] font-black uppercase tracking-widest rounded-full ring-1 ring-cyan-100 mb-6">
               Gestión de Espacios Corporativos
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Bienvenido</h2>
            <p className="text-slate-500 font-bold text-lg leading-relaxed">
              Inicie sesión con sus credenciales corporativas para gestionar y reservar salas de reuniones.
            </p>
          </header>

          <div className="space-y-6">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-4 px-6 py-5 bg-[#235b73] hover:bg-[#1a4558] text-white font-black rounded-2xl transition-all shadow-2xl shadow-[#235b73]/20 hover:-translate-y-1 active:scale-[0.98] focus:ring-4 focus:ring-cyan-100 group"
            >
              <img
                src="https://www.microsoft.com/favicon.ico"
                className="w-6 h-6 object-contain"
                alt="Microsoft Logo"
              />
              <span className="text-lg">Continuar con Microsoft</span>
            </button>

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]"><span className="bg-white px-6 text-slate-300">Conexión Segura</span></div>
            </div>

            <p className="text-slate-400 text-center text-xs font-bold leading-relaxed">
              Al continuar, acepta nuestros <a href="#" className="text-[#00adef] hover:underline">Términos de Servicio</a> y la <a href="#" className="text-[#00adef] hover:underline">Política de Privacidad</a>.
            </p>
          </div>
        </div>

        <footer className="absolute bottom-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">
          &copy; 2026 LIVIGUI ENTERPRISE
        </footer>
      </div>
    </div>
  );
};
