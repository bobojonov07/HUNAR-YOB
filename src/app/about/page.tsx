"use client"

import { Navbar } from "@/components/navbar";
import { Hammer, ShieldCheck, Zap, Users, Globe, ChevronLeft, Instagram, Send as TelegramIcon, FileText, Lock, Scale, UserCheck, Sparkles, Heart, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Navigation */}
        <div className="mb-12">
          <Button variant="ghost" onClick={() => router.back()} className="hover:text-primary p-0 font-black text-lg transition-transform hover:-translate-x-2">
            <ChevronLeft className="mr-2 h-8 w-8" />
            БОЗГАШТ
          </Button>
        </div>

        {/* Hero Section */}
        <section className="text-center space-y-10 mb-32 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10" />
          <div className="mx-auto h-32 w-32 bg-white rounded-[3rem] flex items-center justify-center shadow-3xl border border-primary/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <Hammer className="h-14 w-14 text-primary relative z-10 transition-transform group-hover:rotate-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-7xl md:text-9xl font-headline font-black text-secondary tracking-tighter leading-none uppercase drop-shadow-sm">HUNAR-YOB</h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-primary/30" />
              <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px]">Version 1.1.0 — 2026</p>
              <div className="h-px w-12 bg-primary/30" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-tight italic">
            "Платформаи рақами яки Тоҷикистон барои пайдо кардани устоҳои моҳир ва пешниҳоди хидматҳои ҳунармандӣ."
          </p>
        </section>

        {/* DEVELOPER INFO - NEW DESIGN */}
        <section className="mb-32">
          <div className="p-12 md:p-16 bg-secondary text-white rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(43,21,9,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-white/5 to-transparent -skew-x-12 translate-x-1/4 transition-transform group-hover:translate-x-1/3 duration-1000" />
            <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-8 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
                    <UserCheck className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-[0.3em] text-primary">ТАҲИЯГАР ВА БАРНОМАСОЗ</h2>
                </div>
                
                <div className="space-y-2">
                  <p className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                    Бобоҷонзода <br />
                    <span className="text-primary">Аминҷон</span>
                  </p>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic">МУҲИМ:</p>
                  <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-white/90">
                    "Вебсайт танҳо ба хотири кумак ба ҳамватанон сохта шудааст. Барномасоз барои сифати кор ва муомилаи байни тарафҳо ҷавобгарӣ ба уҳда намегирад."
                  </p>
                </div>
              </div>
              
              <div className="md:col-span-4 flex flex-col items-center justify-center space-y-6">
                <div className="h-48 w-48 bg-white/5 rounded-[3.5rem] border border-white/10 flex items-center justify-center backdrop-blur-3xl shadow-3xl">
                  <div className="text-center">
                    <p className="text-4xl font-black text-primary leading-none">2026</p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Created</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-primary transition-colors cursor-pointer group/icon">
                    <Sparkles className="h-6 w-6 text-white group-hover/icon:animate-spin-slow" />
                  </div>
                  <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-primary transition-colors cursor-pointer group/icon">
                    <Rocket className="h-6 w-6 text-white group-hover/icon:animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ШАРТҲОИ ИСТИФОДА */}
        <section id="terms" className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-12 bg-white rounded-[3.5rem] shadow-2xl border-none space-y-8 group hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-black text-secondary uppercase tracking-tighter">ШАРТҲОИ <br /> ИСТИФОДА</h2>
            </div>
            <div className="space-y-6 text-muted-foreground font-medium leading-relaxed">
              <div className="flex gap-4">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-1">1</span>
                <p><b>Умумият:</b> Платформаи "HUNAR-YOB" танҳо барои шахсони аз 16-сола боло пешбинӣ шудааст.</p>
              </div>
              <div className="flex gap-4">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-1">2</span>
                <p><b>Масъулият:</b> Мо сифати кори устоҳоро назорат намекунем, шартномаи ниҳоӣ байни мизоҷ ва усто баста мешавад.</p>
              </div>
              <div className="flex gap-4">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-1">3</span>
                <p><b>Одоби муошират:</b> Истифодаи калимаҳои қабеҳ ва ҳақорат боиси баста шудани (block) акаунт мегардад.</p>
              </div>
            </div>
          </div>

          <div id="privacy" className="p-12 bg-white rounded-[3.5rem] shadow-2xl border-none space-y-8 group hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-green-100 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-black text-secondary uppercase tracking-tighter">СИЁСАТИ <br /> МАХФИЯТ</h2>
            </div>
            <div className="space-y-6 text-muted-foreground font-medium leading-relaxed">
              <div className="flex gap-4">
                <span className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-1">1</span>
                <p><b>Ҷамъоварии маълумот:</b> Мо ном ва рақами телефони шуморо барои таъмини алоқа ҷамъоварӣ мекунем.</p>
              </div>
              <div className="flex gap-4">
                <span className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-1">2</span>
                <p><b>Ҳифзи маълумот:</b> Маълумоти шумо дар серверҳои ҳифзшудаи Firebase нигоҳ дошта мешавад.</p>
              </div>
              <div className="flex gap-4">
                <span className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-1">3</span>
                <p><b>Ҳуқуқҳои шумо:</b> Шумо метавонед маълумоти худро таҳрир кунед ё акаунтатонро пурра нест кунед.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center space-y-12 mb-32 pt-20">
          <div className="space-y-4">
            <h2 className="text-5xl font-headline font-black text-secondary uppercase tracking-tighter">БО МО ДАР ТАМОС БОШЕД</h2>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Тавассути шабакаҳои иҷтимоӣ</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Button asChild variant="outline" className="h-20 px-12 rounded-[2rem] border-4 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white font-black text-lg transition-all shadow-xl hover:scale-105 active:scale-95">
              <a href="https://instagram.com/taj.web" target="_blank"><Instagram className="mr-3 h-8 w-8" /> INSTAGRAM</a>
            </Button>
            <Button asChild variant="outline" className="h-20 px-12 rounded-[2rem] border-4 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-black text-lg transition-all shadow-xl hover:scale-105 active:scale-95">
              <a href="https://t.me/+992200702032" target="_blank"><TelegramIcon className="mr-3 h-8 w-8" /> TELEGRAM</a>
            </Button>
          </div>
        </section>

        <footer className="text-center py-10 opacity-30">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-20 bg-muted" />
            <Heart className="h-6 w-6 text-red-500 animate-pulse fill-red-500" />
            <div className="h-px w-20 bg-muted" />
          </div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.6em]">
            &copy; 2026 HUNAR-YOB. ТАҲИЯШУДА ТАВАССУТИ TAJ.WEB
          </p>
        </footer>
      </main>
    </div>
  );
}
