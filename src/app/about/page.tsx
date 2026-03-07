
"use client"

import { Navbar } from "@/components/navbar";
import { Hammer, ShieldCheck, Zap, Users, Globe, ChevronLeft, Instagram, Send as TelegramIcon, FileText, Lock, Scale } from "lucide-react";
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
          <h1 className="text-6xl md:text-8xl font-headline font-black text-secondary tracking-tighter leading-none uppercase">KORYOB @</h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Аввалин ва бузургтарин платформаи рақами яки Тоҷикистон "KORYOB @" барои пайдо кардани устоҳои моҳир ва пешниҳоди хидматҳои ҳунармандӣ.
          </p>
        </section>

        {/* ШАРТҲОИ ИСТИФОДА */}
        <section id="terms" className="mb-20 p-10 bg-white rounded-[3rem] shadow-xl border-none space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Scale className="h-10 w-10 text-primary" />
            <h2 className="text-3xl font-black text-secondary uppercase tracking-tighter">ШАРТҲОИ ИСТИФОДА</h2>
          </div>
          <div className="space-y-4 text-muted-foreground font-medium leading-relaxed">
            <p>1. <b>Умумият:</b> Платформаи "KORYOB @" танҳо барои шахсони аз 16-сола боло пешбинӣ шудааст.</p>
            <p>2. <b>Масъулият:</b> Мо сифати кори устоҳоро назорат мекунем, аммо шартномаи ниҳоӣ байни мизоҷ ва усто баста мешавад.</p>
            <p>3. <b>Амният:</b> Истифодаи "Шартномаи Амниятӣ" барои ҳифзи маблағҳои шумо тавсия дода мешавад.</p>
            <p>4. <b>Манъкунӣ:</b> Интишори маълумоти бардурӯғ, ҳақорат ва кӯшиши фиреб боиси баста шудани (block) акаунт мегардад.</p>
          </div>
        </section>

        {/* СИЁСАТИ МАХФИЯТ */}
        <section id="privacy" className="mb-20 p-10 bg-white rounded-[3rem] shadow-xl border-none space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Lock className="h-10 w-10 text-green-500" />
            <h2 className="text-3xl font-black text-secondary uppercase tracking-tighter">СИЁСАТИ МАХФИЯТ</h2>
          </div>
          <div className="space-y-4 text-muted-foreground font-medium leading-relaxed">
            <p>1. <b>Ҷамъоварии маълумот:</b> Мо ном, рақами телефон ва макони зисти шуморо барои таъмини кори платформа ҷамъоварӣ мекунем.</p>
            <p>2. <b>Ҳифзи маълумот:</b> Маълумоти шумо ба шахсони сеюм фурӯхта намешавад ва дар серверҳои ҳифзшудаи Firebase нигоҳ дошта мешавад.</p>
            <p>3. <b>Идентификатсия:</b> Сурати шиносномаи шумо танҳо барои тасдиқи шахсият истифода шуда, пас аз санҷиш ба таври рамзгузорӣ (encrypted) нигоҳ дошта мешавад.</p>
            <p>4. <b>Ҳуқуқҳои шумо:</b> Шумо ҳуқуқ доред дар ҳар вақт маълумоти худро таҳрир кунед ё акаунтатонро пурра нест кунед.</p>
          </div>
        </section>

        <section className="space-y-12 bg-secondary text-white p-12 md:p-20 rounded-[4rem] shadow-3xl overflow-hidden relative mb-24">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-headline font-black tracking-tighter uppercase">ҲАДАФИ МО</h2>
            <p className="text-lg md:text-xl opacity-80 leading-relaxed font-medium">
              Мақсади асосии лоиҳаи "KORYOB @" — дастгирии ҳунармандони ватанӣ ва осон кардани ҳаёти мардуми Тоҷикистон мебошад. Мо боварӣ дорем, ки ҳар як маҳорат арзиш дорад ва ҳар як мушкилӣ бояд устои худро ёбад.
            </p>
            <div className="flex flex-wrap gap-8 pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-7 w-7 text-primary" />
                <span className="font-black uppercase tracking-widest text-xs">10,000+ КОРБАРОН</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-7 w-7 text-primary" />
                <span className="font-black uppercase tracking-widest text-xs">ТАМОМИ ТОҶИКИСТОН</span>
              </div>
            </div>
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
            &copy; 2026 KORYOB @. ТАҲИЯШУДА ТАВАССУТИ TAJ.WEB
          </p>
        </section>
      </main>
    </div>
  );
}
