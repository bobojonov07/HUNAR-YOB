"use client"

import { useState, useRef, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, PREMIUM_PRICE, REGULAR_LISTING_LIMIT, PREMIUM_LISTING_LIMIT, REGULAR_CHAR_LIMIT, PREMIUM_CHAR_LIMIT } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Crown, 
  Camera, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Award,
  Star,
  MessageSquare,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { compressImage, cn } from "@/lib/utils";

export default function PremiumPurchasePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [step, setStep] = useState(1);
  const [receipt, setReceipt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (profile?.isPremium) router.push("/profile");
  }, [user, authLoading, profile, router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 1200, 1.0);
        setReceipt(compressed);
      } catch (err) {
        console.error("Image compression error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    
    const requestData = {
      userId: user.uid,
      userName: profile.name,
      receiptImage: receipt,
      submittedAt: serverTimestamp(),
      status: 'Pending',
      price: PREMIUM_PRICE,
      durationMonths: 3
    };

    try {
      const requestRef = doc(db, "premium_requests", user.uid);
      await setDoc(requestRef, requestData);

      toast({ 
        title: "Дархост фиристода шуд", 
        description: "Пас аз тасдиқи чек, статуси Premium барои 3 моҳ фаъол мешавад." 
      });
      router.push("/profile");
    } catch (err: any) {
      toast({ title: "Хатогӣ ҳангоми фиристодан", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const benefits = [
    { icon: TrendingUp, title: `ЛИМИТИ ${PREMIUM_LISTING_LIMIT} ЭЪЛОН`, desc: "Ҳамзамон 5 хизматрасониро таблиғ кунед", color: "bg-blue-500" },
    { icon: MessageSquare, title: "ЧАТИ БЕМАҲДУД", desc: `Лимити паёмҳо аз ${REGULAR_CHAR_LIMIT} то ${PREMIUM_CHAR_LIMIT} аломат`, color: "bg-green-500" },
    { icon: Award, title: "ДИЗАЙНИ ТИЛЛОӢ", desc: "Профили шумо бо нишони Premium медурахшад", color: "bg-yellow-500" },
    { icon: Zap, title: "VIP STATUS", desc: "Эълонҳои шумо дар аввали рӯйхат мебароянд", color: "bg-purple-500" },
    { icon: ShieldCheck, title: "ЭЪТИМОДИ МИЗОҶОН", desc: "Корбарон ба Premium бештар боварӣ доранд", color: "bg-orange-500" },
    { icon: Star, title: "ЭФФЕКТҲОИ МАХСУС", desc: "Суратҳои шумо бо эффектҳои ҷолиб нишон дода мешаванд", color: "bg-pink-500" }
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 pb-20 overflow-x-hidden">
      <Navbar />
      
      {/* Decorative Circles */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-yellow-400/5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 py-12 max-w-6xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-12 hover:text-primary p-0 font-black text-lg transition-transform hover:-translate-x-2">
          <ChevronLeft className="mr-2 h-8 w-8" /> БОЗГАШТ
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Column: Benefits Content */}
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-yellow-400/10 rounded-full border border-yellow-400/20 text-yellow-600">
                <Crown className="h-5 w-5 fill-yellow-500" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Хизматрасонии махсус</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-secondary tracking-tighter uppercase leading-[0.9] drop-shadow-sm">
                HUNAR-YOB <br />
                <span className="text-primary italic">PREMIUM</span>
              </h1>
              <p className="text-2xl font-bold text-muted-foreground leading-tight max-w-lg">
                Имкониятҳои бемаҳдуд барои пешрафти касбии шумо ва ҷалби бештари мизоҷон.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {benefits.map((item, i) => (
                <div key={i} className="group p-8 bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-transparent hover:border-primary/10">
                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110", item.color)}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-black text-secondary uppercase text-xs tracking-widest mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-8 bg-secondary rounded-[3rem] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="h-20 w-20 bg-primary rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-2xl group-hover:rotate-12 transition-transform">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter">ШУМО БЕҲТАРИН ХОҲЕД БУД</h4>
                  <p className="text-white/60 font-medium italic">"Premium-корбарон назар ба дигарон 10 баробар бештар занг мегиранд."</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Purchase Form */}
          <div className="lg:col-span-5 sticky top-24">
            <Card className="border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] rounded-[3.5rem] overflow-hidden bg-white/90 backdrop-blur-xl">
              <div className="h-4 w-full bg-gradient-to-r from-yellow-400 via-primary to-yellow-400 animate-shimmer bg-[length:200%_100%]" />
              
              <div className="p-10 md:p-12">
                {step === 1 ? (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="text-center space-y-3">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em]">ОБУНАИ 3-МОҲА</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-9xl font-black text-secondary tracking-tighter leading-none">{PREMIUM_PRICE}</span>
                        <div className="text-left">
                          <p className="text-2xl font-black text-primary leading-none">TJS</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Total</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-muted-foreground italic">Ҳамагӣ ~8 сомонӣ дар як моҳ</p>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-muted to-transparent w-full" />

                    <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase text-center opacity-40 tracking-widest">ИНТИҚОЛ БА КОРТИ МИЛЛӢ:</p>
                      <div className="p-8 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-primary/20 space-y-3 text-center group cursor-pointer hover:bg-muted/30 transition-all">
                        <p className="text-4xl font-black text-secondary tracking-tighter group-active:scale-95 transition-transform">975638778</p>
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <p className="text-sm font-bold text-primary">Соҳиби корт: А Б</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button 
                        onClick={() => setStep(2)} 
                        className="w-full bg-primary h-20 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(255,127,80,0.4)] hover:scale-[1.02] active:scale-95 transition-all text-lg"
                      >
                        МАН ПАРДОХТ КАРДАМ
                      </Button>
                      <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-widest leading-relaxed">
                        Пайванди чеки пардохтро дар қадами навбатӣ бор кунед.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-700">
                    <div className="space-y-3 text-center">
                      <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Camera className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-black text-secondary uppercase tracking-tighter">ТАСДИҚИ ПАРДОХТ</h2>
                      <p className="text-sm text-muted-foreground font-medium italic">Лутфан сурати чекро барои санҷиш бор кунед:</p>
                    </div>

                    <div className="space-y-6">
                      <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        variant="outline" 
                        className={cn(
                          "w-full h-56 border-dashed border-4 rounded-[3rem] flex flex-col gap-4 transition-all hover:bg-primary/5",
                          receipt ? "border-green-500 bg-green-50/10" : "border-muted-foreground/20"
                        )}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        ) : receipt ? (
                          <div className="relative h-40 w-full px-8">
                            <Image src={receipt} fill alt="receipt preview" className="object-contain rounded-2xl" />
                          </div>
                        ) : (
                          <>
                            <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <span className="font-black text-[10px] uppercase tracking-[0.3em]">Боргузории сурати чек</span>
                          </>
                        )}
                      </Button>

                      {receipt && (
                        <div className="flex items-center justify-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-widest animate-pulse">
                          <CheckCircle2 className="h-4 w-4" /> ЧЕК БО МУВАФФАҚИЯТ БОР ШУД
                        </div>
                      )}
                    </div>

                    <div className="p-6 bg-red-50 rounded-3xl border-2 border-dashed border-red-100 flex gap-4">
                      <ShieldAlert className="h-6 w-6 text-red-500 shrink-0" />
                      <p className="text-[9px] font-black text-red-600 uppercase leading-relaxed">
                        ҲУШДОР: Дар ҳолати чеки қалбакӣ акаунти шумо барои ҳамеша масдуд мегардад.
                      </p>
                    </div>
                    
                    <div className="flex gap-4">
                      <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-16 rounded-2xl font-black uppercase text-xs tracking-widest">БОЗГАШТ</Button>
                      <Button 
                        disabled={!receipt || isLoading} 
                        onClick={handleSubmit} 
                        className="flex-[2] bg-secondary h-16 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-secondary/90 transition-all"
                      >
                        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "ФИРИСТОДАНИ ДАРХОСТ"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="mt-8 flex items-center justify-center gap-4 text-muted-foreground opacity-40">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-[10px] font-black uppercase tracking-widest">Secure Payments by HUNAR-YOB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Upload(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="12" />
    </svg>
  )
}
