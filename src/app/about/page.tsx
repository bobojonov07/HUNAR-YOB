
"use client"

import { Navbar } from "@/components/navbar";
import { Hammer, ShieldCheck, Zap, Users, Globe, ChevronLeft, Instagram, Send as TelegramIcon, FileText, Lock, Scale, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-10 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-6 w-6" />
          БОЗГАШТ
        </Button>

        <section className="text-center space-y-8 mb-24">
          <div className="mx-auto h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
            <Hammer className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-6xl md:text-8xl font-headline font-black text-secondary tracking-tighter leading-none uppercase">HUNAR-YOB</h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Платформаи рақами яки Тоҷикистон барои пайдо кардани устоҳои моҳир ва пешниҳоди хидматҳои ҳунармандӣ.
          </p>
        </section>

        {/* DEVELOPER INFO */}
        <section className="mb-20 p-10 bg-secondary text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 -skew-x-12 translate-x-1/4" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <UserCheck className="h-10 w-10 text-primary" />
              <h2 className="text-3xl font-black uppercase tracking-tighter">БАРНОМАСОЗ</h2>
            </div>
            <p className="text-4xl font-black tracking-tight uppercase">Бобоҷонзода Аминҷон</p>
            <div className="pt-6 border-t border-white/10">
              <p className="text-sm font-bold text-white/60 uppercase tracking-widest mb-2 italic">Огоҳинома:</p>
              <p className="text-lg font-medium leading-relaxed italic">
                "Вебсайт танҳо ба хотири кумак ба ҳамватанон сохта шудааст. Барномасоз барои сифати кор ва муомилаи байни тарафҳо ҷавобгарӣ ба уҳда намегирад."
              </p>
            </div>
          </div>
        </section>

        {/* ШАРТҲОИ ИСТИФОДА */}
        <section id="terms" className="mb-20 p-10 bg-white rounded-[3rem] shadow-xl border-none space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Scale className="h-10 w-10 text-primary" />
            <h2 className="text-3xl font-black text-secondary uppercase tracking-tighter">ШАРТҲОИ ИСТИФОДА</h2>
          </div>
          <div className="space-y-4 text-muted-foreground font-medium leading-relaxed">
            <p>1. <b>Умумият:</b> Платформаи "HUNAR-YOB" танҳо барои шахсони аз 16-сола боло пешбинӣ шудааст.</p>
            <p>2. <b>Масъулият:</b> Мо сифати кори устоҳоро назорат намекунем, шартномаи ниҳоӣ байни мизоҷ ва усто баста мешавад.</p>
            <p>3. <b>Одоби муошират:</b> Истифодаи калимаҳои қабеҳ ва ҳақорат боиси баста шудани (block) акаунт мегардад.</p>
            <p>4. <b>Хидматҳои Premium:</b> Маблағҳои барои Premium пардохтшуда баргардонида намешаванд.</p>
          </div>
        </section>

        {/* СИЁСАТИ МАХФИЯТ */}
        <section id="privacy" className="mb-20 p-10 bg-white rounded-[3rem] shadow-xl border-none space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Lock className="h-10 w-10 text-green-500" />
            <h2 className="text-3xl font-black text-secondary uppercase tracking-tighter">СИЁСАТИ МАХФИЯТ</h2>
          </div>
          <div className="space-y-4 text-muted-foreground font-medium leading-relaxed">
            <p>1. <b>Ҷамъоварии маълумот:</b> Мо ном ва рақами телефони шуморо барои таъмини алоқа ҷамъоварӣ мекунем.</p>
            <p>2. <b>Ҳифзи маълумот:</b> Маълумоти шумо дар серверҳои ҳифзшудаи Firebase нигоҳ дошта мешавад.</p>
            <p>3. <b>Суратҳо:</b> Суратҳои эълон ва профил барои ҳамаи корбарон дастрас мебошанд.</p>
            <p>4. <b>Ҳуқуқҳои шумо:</b> Шумо метавонед маълумоти худро таҳрир кунед ё акаунтатонро пурра нест кунед.</p>
          </div>
        </section>

        <section className="text-center space-y-10 mb-20">
          <h2 className="text-4xl font-headline font-black text-secondary uppercase tracking-tighter">БО МО ДАР ТАМОС БОШЕД</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <Button asChild variant="outline" className="h-16 px-10 rounded-2xl border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white font-black transition-all">
              <a href="https://instagram.com/taj.web" target="_blank"><Instagram className="mr-3 h-6 w-6" /> INSTAGRAM</a>
            </Button>
            <Button asChild variant="outline" className="h-16 px-10 rounded-2xl border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white font-black transition-all">
              <a href="https://t.me/+992200702032" target="_blank"><TelegramIcon className="mr-3 h-6 w-6" /> TELEGRAM</a>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.5em] pt-10">
            &copy; 2026 HUNAR-YOB. ТАҲИЯШУДА ТАВАССУТИ TAJ.WEB
          </p>
        </section>
      </main>
    </div>
  );
}
