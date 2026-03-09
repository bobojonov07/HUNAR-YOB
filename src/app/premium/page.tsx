
"use client"

import { useState, useRef, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, PREMIUM_PRICE } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Crown, 
  Camera, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  CreditCard,
  FileText,
  Clock,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
        const compressed = await compressImage(reader.result as string, 800, 0.7);
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
      price: PREMIUM_PRICE
    };

    try {
      const requestRef = doc(db, "premium_requests", user.uid);
      await setDoc(requestRef, requestData);

      toast({ 
        title: "Дархост фиристода шуд", 
        description: "Пас аз тасдиқи чек, статуси Premium фаъол мешавад." 
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-6 w-6" /> БОЗГАШТ
        </Button>

        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto h-24 w-24 bg-yellow-50 rounded-[2.5rem] flex items-center justify-center shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent animate-pulse" />
              <Crown className="h-12 w-12 text-yellow-500 relative z-10" />
            </div>
            <h1 className="text-4xl font-black text-secondary tracking-tighter uppercase">KORYOB PREMIUM</h1>
            <p className="text-muted-foreground font-medium italic">Имкониятҳои бемаҳдудро фаъол созед</p>
          </div>

          <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
            <CardContent className="p-10">
              {step === 1 ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-yellow-50 p-8 rounded-[2.5rem] border-2 border-dashed border-yellow-200 text-center space-y-4">
                    <h2 className="text-xl font-black text-yellow-700 uppercase">Қадами 1: ПАРДОХТ</h2>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-5xl font-black text-secondary">{PREMIUM_PRICE}</span>
                      <span className="text-xl font-bold text-yellow-600">TJS</span>
                    </div>
                    <div className="pt-4 space-y-2">
                      <p className="text-[10px] font-black uppercase opacity-50">Рақами корт (Душанбе Сити):</p>
                      <p className="text-2xl font-black text-secondary tracking-tighter">975638778</p>
                      <p className="text-sm font-bold text-primary">Ном: А Б</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-1"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                      <p className="text-sm font-bold text-secondary">Нашри то 5 эълон (ба ҷои 1 эълон)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-1"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                      <p className="text-sm font-bold text-secondary">Лимити паёмҳо то 5000 аломат</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-1"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                      <p className="text-sm font-bold text-secondary">Нишони тиллоии (Premium) дар профил</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setStep(2)} 
                    className="w-full bg-primary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                  >
                    МАН ПАРДОХТ КАРДАМ
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-tight">Қадами 2: ТАСДИҚИ ЧЕК</h2>
                    <p className="text-sm text-muted-foreground font-medium">Сурати чеки пардохтро бор кунед:</p>
                  </div>

                  <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline" 
                    className="w-full h-48 border-dashed border-2 rounded-[2.5rem] flex flex-col gap-3 transition-all hover:bg-primary/5"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-10 w-10 animate-spin text-primary" /> : (
                      receipt ? <CheckCircle2 className="h-12 w-12 text-green-500" /> : <Camera className="h-12 w-12 text-muted-foreground" />
                    )}
                    <span className="font-black text-xs uppercase tracking-widest">
                      {receipt ? "ЧЕК БОР ШУД" : "ИЛОВАИ СУРАТИ ЧЕК"}
                    </span>
                  </Button>

                  {receipt && (
                    <div className="h-40 w-full rounded-2xl bg-muted relative overflow-hidden shadow-lg mx-auto max-w-[250px]">
                      <Image src={receipt} fill alt="check" className="object-cover" />
                    </div>
                  )}
                  
                  <div className="p-6 bg-blue-50 rounded-[2rem] border-2 border-dashed border-blue-100 flex gap-4">
                    <Clock className="h-6 w-6 text-blue-500 shrink-0" />
                    <p className="text-[10px] font-black text-blue-600 uppercase leading-relaxed">
                      Мо чеки шуморо дар муддати 24 соат тафтиш карда, статуси Premium-ро фаъол месозем.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest">БОЗГАШТ</Button>
                    <Button 
                      disabled={!receipt || isLoading} 
                      onClick={handleSubmit} 
                      className="flex-[2] bg-secondary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                    >
                      ФИРИСТОДАН
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
