"use client";

import React from "react";

export function MobileFrameWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center p-0 md:p-8 overflow-x-hidden relative font-sans">
      {/* Decorative background gradients for desktop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/30 via-[#030712] to-[#030712] -z-10 hidden md:block" />
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 hidden md:block" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 hidden md:block" />

      {/* Desktop Info Panel on the left side */}
      <div className="hidden lg:flex flex-col gap-4 text-white max-w-sm mr-16 select-none">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground">A</div>
          <span className="font-heading font-bold text-lg tracking-wider text-emerald-400">AURELIUS ERP</span>
        </div>
        <h1 className="text-3xl font-heading font-bold leading-tight">
          Gestão Agrícola Inteligente na Palma da Mão
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Acesse o dashboard de talhões, controle a frota com telemetria em tempo real, gerencie safras e utilize a IA de comando por voz.
        </p>
        <div className="flex flex-col gap-2 mt-4 text-xs text-slate-500 font-semibold border-t border-slate-900 pt-4">
          <p>📱 Interface Otimizada para Mobile</p>
          <p>⚡ Modo Desktop: Exibição no simulador ativo</p>
        </div>
      </div>

      {/* Centered Mobile Device Mockup Frame */}
      <div className="w-full min-h-screen bg-background md:w-[412px] md:h-[844px] md:min-h-0 md:rounded-[48px] md:border-[10px] md:border-slate-900 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] md:relative md:overflow-hidden md:flex md:flex-col md:ring-1 md:ring-slate-800">
        
        {/* Phone Dynamic Island Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-full z-[110] hidden md:flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-950 rounded-full mr-2" />
          <div className="w-3.5 h-3.5 bg-slate-950 rounded-full relative">
            <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-blue-900 rounded-full opacity-60" />
          </div>
        </div>

        {/* Device Content Screen */}
        <div className="flex-1 flex flex-col h-full overflow-hidden md:rounded-[38px] relative">
          {children}
        </div>
      </div>
    </div>
  );
}
