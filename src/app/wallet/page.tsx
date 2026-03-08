
"use client"

import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, Plus, ArrowLeft, ShieldCheck, Lock, ArrowDownRight, CheckCircle2, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function WalletPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [amount, setAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSecureDialogOpen, setIsSecureDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');

  const isVerified = profile?.identificationStatus === 'Verified';

  useEffect(() => {
    if (profile && profile.identificationStatus !== 'Verified') {
      toast({
        title: "Верификатсия лозим аст",
        description: "Аввал шахсияти худро тасдиқ кунед.",
        variant: "destructive"
      });
      router.push("/profile");
    }
  }, [profile, router, toast]);

  const handleOpenSecure = (e: React.FormEvent, m: 'deposit' | 'withdraw') => {
    e.preventDefault();
    if (!profile) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Хатогӣ", description: "Маблағро дуруст ворид кунед", variant: "destructive" });
      return;
    }

    if (m === 'deposit') {
      if (cardNumber.length < 16 || !cardExpiry || cardCVC.length < 3) {
        toast({ title: "Хатогии корт", description: "Маълумоти кортро пурра ворид кунед", variant: "destructive" });
        return;
      }
    }

    if (m === 'withdraw') {
      if (profile.balance < numAmount) {
        toast({ title: "Хатогӣ", description: "Маблағ нокифоя аст", variant: "destructive" });
        return;
      }
    }
    setMode(m);
    setIsSecureDialogOpen(true);
  };

  const handleActionSecure = async () => {
    if (!userProfileRef || !profile || !user) return;
    setLoading(true);
    const numAmount = parseFloat(amount);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const updateData = { balance: increment(mode === 'deposit' ? numAmount : -numAmount) };
      await updateDoc(userProfileRef, updateData);

      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: numAmount,
        type: mode === 'deposit' ? 'Deposit' : 'Withdrawal',
        status: 'Completed',
        createdAt: serverTimestamp()
      });

      setIsSecureDialogOpen(false);
      setIsSuccessDialogOpen(true);
      setAmount("");
    } catch (err: any) {
      toast({ title: "Хатогӣ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile || !isVerified) return <div className="min-h-screen flex items-center justify-center">Боргузорӣ...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8 hover:text-primary p-0 font-black">
          <ArrowLeft className="mr-2 h-6 w-6" /> БОЗГАШТ
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-none shadow-3xl bg-gradient-to-br from-secondary via-secondary to-primary/90 text-white overflow-hidden relative rounded-[3rem] p-10">
              <div className="relative z-10">
                <div className="flex items-center gap-3 opacity-80 mb-6 bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-md">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Ҳисоби тасдиқшуда</span>
                </div>
                <h2 className="text-2xl font-black mb-2 opacity-70">Тавозун:</h2>
                <div className="flex items-baseline gap-4">
                  <span className="text-8xl font-black tracking-tighter">{(profile.balance || 0).toLocaleString()}</span>
                  <span className="text-3xl font-bold opacity-60">TJS</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-none shadow-3xl rounded-[3.5rem] overflow-hidden bg-white">
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="w-full h-20 bg-muted/20 rounded-none p-2 gap-2">
                  <TabsTrigger value="deposit" className="flex-1 h-full rounded-[2rem] font-black text-xs uppercase">ПУР КАРДАН</TabsTrigger>
                  <TabsTrigger value="withdraw" className="flex-1 h-full rounded-[2rem] font-black text-xs uppercase">БОЗХОНД</TabsTrigger>
                </TabsList>

                <TabsContent value="deposit" className="p-10 space-y-8">
                  <div className="space-y-6">
                    <Label className="font-black text-[10px] uppercase opacity-60">Маблағ (TJS)</Label>
                    <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-20 font-black text-5xl rounded-3xl" />
                    <Input placeholder="Рақами корт" maxLength={16} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="h-14 rounded-2xl" />
                  </div>
                  <Button onClick={(e) => handleOpenSecure(e, 'deposit')} className="w-full bg-primary h-20 rounded-[2.5rem] text-xl font-black uppercase shadow-2xl">ПУР КАРДАН</Button>
                </TabsContent>

                <TabsContent value="withdraw" className="p-10 space-y-8">
                  <Input type="number" placeholder="Маблағ" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-20 font-black text-5xl rounded-3xl" />
                  <Button onClick={(e) => handleOpenSecure(e, 'withdraw')} className="w-full bg-secondary h-20 rounded-[2.5rem] text-xl font-black uppercase shadow-2xl">ГИРИФТАН</Button>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isSecureDialogOpen} onOpenChange={setIsSecureDialogOpen}>
        <DialogContent className="rounded-[3rem] p-12 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-secondary uppercase">ТАСДИҚ</DialogTitle>
            <DialogDescription>Рамзи акаунтро ворид кунед.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <Input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="h-16 rounded-2xl text-center text-3xl font-black tracking-widest" />
            <Button onClick={handleActionSecure} disabled={loading} className="w-full bg-primary h-16 rounded-2xl font-black uppercase">{loading ? "ДАР ҲОЛИ ИҶРО..." : "ТАСДИҚ"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="rounded-[4rem] p-16 max-w-md text-center">
          <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-6" />
          <h3 className="text-3xl font-black uppercase">МУВАФФАҚИЯТ!</h3>
          <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full bg-secondary h-14 rounded-2xl font-black uppercase mt-8">ФАҲМО</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
