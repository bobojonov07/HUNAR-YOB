
"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ChevronLeft, Phone } from "lucide-react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth, useFirestore } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: "Огоҳӣ", description: "Лутфан бо шартҳои истифода ва сиёсати амният розӣ шавед", variant: "destructive" });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Хуш омадед", description: "Шумо бо муваффақият ворид шудед." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Хатогии воридшавӣ", description: "Почта ё рамзи нодуруст.", variant: "destructive" });
    }
  };

  const handleGoogleLogin = async () => {
    if (!agreed) {
      toast({ title: "Огоҳӣ", description: "Лутфан бо шартҳои истифода ва сиёсати амният розӣ шавед", variant: "destructive" });
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          name: user.displayName || "Корбари Google",
          email: user.email || "",
          role: 'Client',
          balance: 0,
          identificationStatus: 'None',
          createdAt: serverTimestamp()
        });
      }

      toast({ title: "Хуш омадед", description: "Воридшавӣ бо Google муваффақ буд." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Хатогӣ", description: "Воридшавӣ бо Google нашуд.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mb-6">
           <Button variant="ghost" onClick={() => router.back()} className="hover:text-primary p-0 font-black">
            <ChevronLeft className="mr-2 h-5 w-5" /> БОЗГАШТ
          </Button>
        </div>
        
        <Card className="w-full max-w-md border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="text-center pt-16 pb-10 bg-muted/10">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-4xl font-black font-headline text-secondary tracking-tighter uppercase">ВОРИДШУДАН</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-10 px-10">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={handleGoogleLogin} variant="outline" className="rounded-2xl h-14 font-bold border-2 shadow-sm transition-all hover:bg-muted/50">
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                GOOGLE
              </Button>
              <Button variant="outline" className="rounded-2xl h-14 font-bold border-2 shadow-sm">
                <Phone className="mr-2 h-5 w-5" /> ТЕЛЕФОН
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-4 text-muted-foreground font-black tracking-widest">ё бо почта</span></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-xs uppercase tracking-widest opacity-60">Почтаи электронӣ</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                  <Input type="email" placeholder="example@mail.tj" className="pl-12 h-14 rounded-2xl bg-muted/20 border-muted font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Рамзи махфӣ</Label>
                  <Link href="/forgot-password" size="sm" className="text-[10px] font-black text-primary uppercase hover:underline">Фаромӯшии рамз?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} placeholder="******" className="pl-12 pr-12 h-14 rounded-2xl bg-muted/20 border-muted font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-5 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 transition-all hover:bg-primary/10">
                <Checkbox 
                  id="agreed-login" 
                  checked={agreed} 
                  onCheckedChange={(v) => setAgreed(!!v)} 
                  className="mt-1 h-6 w-6 rounded-lg data-[state=checked]:bg-primary" 
                />
                <Label htmlFor="agreed-login" className="text-[10px] text-muted-foreground font-bold leading-relaxed block cursor-pointer">
                  Ман бо <Link href="/about#terms" className="text-primary underline">Шартҳои истифода</Link> ва <Link href="/about#privacy" className="text-primary underline">Сиёсати махфият</Link> розӣ ҳастам.
                </Label>
              </div>

              <Button type="submit" className="w-full bg-primary h-16 text-xl font-black rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] uppercase tracking-widest">ВОРИД ШУДАН</Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pb-16 px-10">
            <p className="text-sm text-center text-muted-foreground font-bold">
              Ҳанӯз сабти ном нашудаед? <Link href="/register" className="text-primary font-black hover:underline">Сабти ном</Link>
            </p>
            <p className="text-[9px] text-center text-muted-foreground font-black uppercase tracking-[0.2em]">
              &copy; 2026 KORYOB 2. ТАҲИЯШУДА ТАВАССУТИ TAJ.WEB
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
