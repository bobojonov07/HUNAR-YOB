
"use client"

import { useState, useRef, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, KYC_PRICE } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Camera, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  CreditCard,
  FileText,
  Clock,
  RefreshCw
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, updateDoc, serverTimestamp, setDoc, arrayUnion } from "firebase/firestore";
import { compressImage, cn } from "@/lib/utils";

export default function VerifyPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [receipt, setReceipt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRejected = profile?.identificationStatus === 'Rejected';
  const isPending = profile?.identificationStatus === 'Pending';

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (profile?.identificationStatus === 'Verified') router.push("/profile");
  }, [user, authLoading, profile, router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 800, 0.7);
        if (step === 1) {
          setPhotos(prev => [...prev, compressed]);
        } else {
          setReceipt(compressed);
        }
      } catch (err) {
        console.error("Image compression error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!userProfileRef || !profile || !user) return;
    setIsLoading(true);
    
    const userUpdateData = {
      identificationStatus: 'Pending'
    };

    // Маълумоти дархост (бе 'photos', зеро мо arrayUnion-ро истифода мебарем)
    const requestData = {
      id: user.uid,
      userId: user.uid,
      userName: profile.name,
      userPhone: profile.phone || "Номаълум",
      receipt: isRejected && !receipt ? "Re-submitted" : receipt,
      submittedAt: serverTimestamp(),
      status: 'Pending',
      errorReason: "" 
    };

    try {
      // 1. Навсозии ҳолати корбар дар ҳуҷҷати 'users'
      await updateDoc(userProfileRef, userUpdateData);
      
      // 2. Сабти маълумоти верификатсия дар коллексияи 'verification_requests'
      // Истифодаи arrayUnion барои илова кардани суратҳои нав ба рӯйхати мавҷуда
      const requestRef = doc(db, "verification_requests", user.uid);
      await setDoc(requestRef, {
        ...requestData,
        photos: arrayUnion(...photos)
      }, { merge: true });

      toast({ 
        title: "Дархост фиристода шуд", 
        description: "Мо дар муддати 24 соат маълумоти шуморо баррасӣ мекунем." 
      });
      router.push("/profile");
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userProfileRef.path,
        operation: 'update',
        requestResourceData: userUpdateData
      }));
      toast({ title: "Хатогӣ ҳангоми фиристодан", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && photos.length >= 3) {
      if (isRejected) {
        setStep(3); 
      } else {
        setStep(2);
      }
    } else if (step < 3) {
      setStep(step + 1);
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 max-w-2xl text-center space-y-8">
          <div className="mx-auto h-32 w-32 bg-yellow-50 rounded-[3rem] flex items-center justify-center shadow-inner relative">
            <Clock className="h-16 w-16 text-yellow-500 animate-pulse" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-secondary tracking-tighter uppercase">ДАР ҲОЛИ БАРРАСӢ</h1>
            <p className="text-xl font-medium text-muted-foreground leading-relaxed italic px-6">
              "Мо дар муддати 24 соат маълумоти шуморо баррасӣ ва фаъол месозем."
            </p>
          </div>
          <Button onClick={() => router.push("/profile")} className="bg-secondary h-16 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl">
            БА ПРОФИЛ БАРГАРДЕД
          </Button>
        </div>
      </div>
    );
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
            <div className="mx-auto h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center shadow-inner">
              {isRejected ? <RefreshCw className="h-10 w-10 text-orange-500 animate-spin-slow" /> : <ShieldCheck className="h-10 w-10 text-primary" />}
            </div>
            <h1 className="text-4xl font-black text-secondary tracking-tighter uppercase">
              {isRejected ? "ТАҶДИДИ МАЪЛУМОТ" : "ТАСДИҚИ ШАХСИЯТ"}
            </h1>
            {isRejected && (
              <div className="bg-orange-50 p-4 rounded-2xl border-2 border-dashed border-orange-200">
                <p className="text-xs font-black text-orange-700 uppercase tracking-widest">
                  МАЪЛУМОТРО ДУБОРА ФИРИСТЕД. СУРАТҲОРО БО СИФАТИ ХУБ БОР КУНЕД.
                </p>
              </div>
            )}
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={cn(
                    "h-2 w-12 rounded-full transition-all duration-500",
                    step >= s ? "bg-primary" : "bg-muted",
                    isRejected && s === 2 && "hidden"
                  )} 
                />
              ))}
            </div>
          </div>

          <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
            <CardContent className="p-10">
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-tight">Қадами 1: Ҳуҷҷатҳо</h2>
                    <p className="text-sm text-muted-foreground font-medium">Лутфан 3 сурати зеринро бор кунед:</p>
                    <ul className="text-[11px] font-bold text-muted-foreground space-y-1 uppercase opacity-70">
                      <li>1. Пеши шиноснома</li>
                      <li>2. Пушти шиноснома</li>
                      <li>3. Селфи бо шиноснома дар даст</li>
                    </ul>
                  </div>

                  <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline" 
                    className="w-full h-40 border-dashed border-2 rounded-[2rem] flex flex-col gap-3 transition-all hover:bg-primary/5"
                    disabled={photos.length >= 3 || isLoading}
                  >
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Camera className="h-8 w-8 text-muted-foreground" />}
                    <span className="font-black text-xs uppercase tracking-widest">
                      {photos.length}/3 СУРАТ БОР ШУД
                    </span>
                  </Button>

                  <div className="grid grid-cols-3 gap-4">
                    {photos.map((p, i) => (
                      <div key={i} className="aspect-square rounded-2xl bg-muted relative overflow-hidden shadow-md">
                        <Image src={p} fill alt="kyc" className="object-cover" />
                      </div>
                    ))}
                  </div>

                  <Button 
                    disabled={photos.length < 3} 
                    onClick={nextStep} 
                    className="w-full bg-primary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                  >
                    ҚАДАМИ НАВБАТӢ <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}

              {step === 2 && !isRejected && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-tight">Қадами 2: Пардохт</h2>
                    <p className="text-2xl font-black text-primary">{KYC_PRICE} TJS</p>
                  </div>

                  <div className="p-8 bg-secondary/5 rounded-[2.5rem] border-2 border-dashed border-secondary/20 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <CreditCard className="h-6 w-6 text-secondary" />
                      </div>
                      <div className="font-black text-xs uppercase tracking-tighter">ДУШАНБЕ СИТИ / СПИТАМЕН</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase opacity-50">Рақами ҳамён:</p>
                      <p className="text-3xl font-black text-secondary tracking-tighter">975638778</p>
                      <p className="text-sm font-bold text-primary">Ном: А Б</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setStep(3)} 
                    className="w-full bg-primary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                  >
                    МАН ПАРДОХТ КАРДАМ
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-xl font-black text-secondary uppercase tracking-tight">Қадами Охирин: Чек</h2>
                    <p className="text-sm text-muted-foreground font-medium">Сурати чеки пардохтро бор кунед:</p>
                  </div>

                  <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline" 
                    className="w-full h-40 border-dashed border-2 rounded-[2rem] flex flex-col gap-3 transition-all hover:bg-primary/5"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <FileText className="h-8 w-8 text-muted-foreground" />}
                    <span className="font-black text-xs uppercase tracking-widest">
                      {receipt ? "ЧЕК БОР ШУД" : "ИЛОВАИ СУРАТИ ЧЕК"}
                    </span>
                  </Button>

                  {receipt && (
                    <div className="h-32 w-full rounded-2xl bg-muted relative overflow-hidden shadow-lg mx-auto max-w-[200px]">
                      <Image src={receipt} fill alt="check" className="object-cover" />
                    </div>
                  )}
                  
                  <div className="p-6 bg-red-50 rounded-[2rem] border-2 border-dashed border-red-100 flex gap-4">
                    <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
                    <p className="text-[10px] font-black text-red-600 uppercase leading-relaxed">
                      ДИҚҚАТ: Дар ҳолати чеки қалбакӣ мо акаунти шуморо барои ҳамеша БЛОК мекунем.
                    </p>
                  </div>

                  <Button 
                    disabled={(!receipt && !isRejected) || isLoading} 
                    onClick={handleSubmit} 
                    className="w-full bg-secondary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                  >
                    ФИРИСТОДАН
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
