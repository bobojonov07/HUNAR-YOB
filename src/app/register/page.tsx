"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserRole, ALL_REGIONS } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Hammer, User as UserIcon, Mail, ChevronLeft, Phone, ShieldCheck, Calendar, CheckCircle2, Loader2, Sparkles, Lock } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { cn } from "@/lib/utils";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [region, setRegion] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("Client");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const calculateAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return toast({ title: "Хатогӣ", description: "Лутфан ному насабро ворид кунед", variant: "destructive" });
    if (!phone.trim() || phone.length < 9) return toast({ title: "Хатогӣ", description: "Рақами телефонро дуруст ворид кунед (9 рақам)", variant: "destructive" });
    if (!email.trim() || !email.includes("@")) return toast({ title: "Хатогӣ", description: "Почтаи электронӣ нодуруст аст", variant: "destructive" });
    if (!region) return toast({ title: "Хатогӣ", description: "Лутфан минтақаро интихоб кунед", variant: "destructive" });
    if (!birthDate) return toast({ title: "Хатогӣ", description: "Санаи таваллудро ворид кунед", variant: "destructive" });

    if (calculateAge(birthDate) < 16) {
      return toast({ 
        title: "Маҳдудияти синну сол", 
        description: "Сабти ном танҳо барои шахсони аз 16-сола боло иҷозат аст", 
        variant: "destructive" 
      });
    }

    if (password.length < 6) return toast({ title: "Хатогӣ", description: "Рамз бояд камаш 6 аломат бошад", variant: "destructive" });
    if (password !== confirmPassword) return toast({ title: "Хатогӣ", description: "Рамзҳо мувофиқат намекунанд", variant: "destructive" });
    if (!agreed) return toast({ title: "Огоҳӣ", description: "Лутфан бо шартҳои истифода ва сиёсати амният розӣ шавед", variant: "destructive" });

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const phoneQuery = query(collection(db, "users"), where("phone", "==", cleanPhone));
      const phoneSnap = await getDocs(phoneQuery);
      
      if (!phoneSnap.empty) {
        toast({ title: "Хатогӣ", description: "Ин рақами телефон аллакай истифода шудааст", variant: "destructive" });
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const profileData = {
        id: user.uid,
        name,
        email,
        role,
        phone: cleanPhone,
        region,
        birthDate,
        balance: 0,
        identificationStatus: 'None',
        isPremium: false,
        isBlocked: false,
        warningCount: 0,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), profileData);
      
      toast({ title: "Хуш омадед", description: "Сабти ном муваффақона анҷом ёфт!" });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Хатогӣ", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 md:py-24 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="w-full max-w-2xl z-10">
          <Button variant="ghost" onClick={() => router.back()} className="mb-8 hover:text-primary p-0 font-black transition-transform hover:-translate-x-1">
            <ChevronLeft className="mr-2 h-6 w-6" /> БОЗГАШТ
          </Button>

          <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="text-center bg-gradient-to-b from-muted/30 to-transparent pb-10 pt-16 px-10">
              <div className="mx-auto h-20 w-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/10 border border-primary/5">
                <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-5xl font-black font-headline text-secondary tracking-tighter uppercase leading-none">САБТИ НОМ</CardTitle>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Пайвастшавӣ ба HUNAR-YOB</p>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit} className="px-10 pb-16">
              <CardContent className="space-y-10 p-0 pt-10">
                {/* Role Selection */}
                <div className="space-y-4">
                  <Label className="font-black text-xs uppercase tracking-[0.2em] opacity-40 text-center block mb-4">Шумо кӣ ҳастед?</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Label htmlFor="client" className={cn(
                      "flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all h-40 text-center relative group",
                      role === 'Client' ? "border-primary bg-primary/5 shadow-2xl scale-[1.02]" : "border-muted/50 opacity-60 hover:opacity-100 hover:border-primary/20"
                    )}>
                      <RadioGroupItem value="Client" id="client" className="sr-only" />
                      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110", role === 'Client' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <UserIcon className="h-7 w-7" />
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest">МИЗОҶ</span>
                      <p className="text-[9px] font-bold opacity-50 mt-1 uppercase">Ман усто меҷӯям</p>
                      {role === 'Client' && <div className="absolute top-4 right-4"><CheckCircle2 className="h-5 w-5 text-primary" /></div>}
                    </Label>
                    <Label htmlFor="artisan" className={cn(
                      "flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all h-40 text-center relative group",
                      role === 'Usto' ? "border-primary bg-primary/5 shadow-2xl scale-[1.02]" : "border-muted/50 opacity-60 hover:opacity-100 hover:border-primary/20"
                    )}>
                      <RadioGroupItem value="Usto" id="artisan" className="sr-only" />
                      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110", role === 'Usto' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <Hammer className="h-7 w-7" />
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest">УСТО / ҲУНАРМАНД</span>
                      <p className="text-[9px] font-bold opacity-50 mt-1 uppercase">Ман хидмат мерасонам</p>
                      {role === 'Usto' && <div className="absolute top-4 right-4"><CheckCircle2 className="h-5 w-5 text-primary" /></div>}
                    </Label>
                  </RadioGroup>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-muted to-transparent w-full opacity-50" />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-40 ml-4">Ному насаби пурра</Label>
                    <div className="relative group">
                      <UserIcon className="absolute left-6 top-5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <input 
                        className="flex h-16 w-full rounded-[1.5rem] border-none bg-muted/30 pl-14 pr-6 text-base font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none" 
                        placeholder="Масалан: Алиев Валӣ" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-40 ml-4">Рақами телефон</Label>
                    <div className="relative group">
                      <div className="absolute left-6 top-5 text-sm font-black text-muted-foreground group-focus-within:text-primary">+992</div>
                      <Input 
                        className="pl-20 h-16 rounded-[1.5rem] bg-muted/30 border-none font-bold text-base transition-all focus:bg-white focus:ring-4 focus:ring-primary/10" 
                        placeholder="900000000" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        maxLength={9} 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-40 ml-4">Почтаи электронӣ</Label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input 
                        type="email" 
                        placeholder="example@mail.tj" 
                        className="pl-14 h-16 rounded-[1.5rem] bg-muted/30 border-none font-bold text-base transition-all focus:bg-white focus:ring-4 focus:ring-primary/10" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-40 ml-4">Минтақаи истиқомат</Label>
                    <div className="relative group">
                      <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger className="h-16 rounded-[1.5rem] bg-muted/30 border-none font-bold text-base pl-6 transition-all focus:bg-white focus:ring-4 focus:ring-primary/10">
                          <SelectValue placeholder="Интихоби минтақа" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[1.5rem] border-none shadow-3xl p-2">
                          {ALL_REGIONS.map(r => <SelectItem key={r} value={r} className="font-bold rounded-xl py-3">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-40 ml-4">Санаи таваллуд</Label>
                    <div className="relative group">
                      <Calendar className="absolute left-6 top-5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary pointer-events-none" />
                      <Input 
                        type="date" 
                        className="pl-14 h-16 rounded-[1.5rem] bg-muted/30 border-none font-bold text-base transition-all focus:bg-white focus:ring-4 focus:ring-primary/10" 
                        value={birthDate} 
                        onChange={(e) => setBirthDate(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-black text-[10px] uppercase tracking-widest opacity-40 ml-4">Рамзи махфӣ</Label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input 
                        type="password" 
                        className="pl-14 h-16 rounded-[1.5rem] bg-muted/30 border-none font-bold text-base transition-all focus:bg-white focus:ring-4 focus:ring-primary/10" 
                        placeholder="Ҳадди ақал 6 аломат" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="font-black text-[10px] uppercase tracking-widest opacity-40 ml-4">Тасдиқи рамз</Label>
                  <div className="relative group">
                    <CheckCircle2 className="absolute left-6 top-5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input 
                      type="password" 
                      className="pl-14 h-16 rounded-[1.5rem] bg-muted/30 border-none font-bold text-base transition-all focus:bg-white focus:ring-4 focus:ring-primary/10" 
                      placeholder="Рамзро дубора нависед" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="p-8 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 transition-all hover:bg-primary/10 group cursor-pointer" onClick={() => setAgreed(!agreed)}>
                  <div className="flex items-start space-x-4">
                    <Checkbox 
                      id="agreed" 
                      checked={agreed} 
                      onCheckedChange={(v) => setAgreed(!!v)} 
                      className="mt-1 h-7 w-7 rounded-xl data-[state=checked]:bg-primary border-2 border-primary/20" 
                    />
                    <Label htmlFor="agreed" className="text-[11px] text-muted-foreground font-bold leading-relaxed block cursor-pointer select-none">
                      Ман бо <Link href="/about#terms" className="text-primary underline decoration-2 underline-offset-4 hover:text-primary/80" onClick={(e) => e.stopPropagation()}>Шартҳои истифода</Link>, <Link href="/about#privacy" className="text-primary underline decoration-2 underline-offset-4 hover:text-primary/80" onClick={(e) => e.stopPropagation()}>Сиёсати махфият</Link> розӣ ҳастам ва тасдиқ мекунам, ки аз 16-сола боло мебошам.
                    </Label>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-6 pt-12 text-center">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-20 text-xl font-black rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(255,127,80,0.4)] bg-primary hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em]"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>ИҶРО ШУДАНИ САБТ...</span>
                    </div>
                  ) : "САБТИ НОМ ШУДАН"}
                </Button>
                
                <p className="text-sm text-center text-muted-foreground font-bold italic">
                  Аллакай акаунт доред? <Link href="/login" className="text-primary font-black hover:underline not-italic ml-2">ВОРИД ШАВЕД</Link>
                </p>
                
                <div className="pt-10 flex flex-col items-center gap-2 opacity-30">
                  <p className="text-[8px] text-center text-muted-foreground font-black uppercase tracking-[0.5em]">
                    &copy; 2026 HUNAR-YOB. ТАҲИЯШУДА ТАВАССУТИ TAJ.WEB
                  </p>
                  <div className="h-1 w-12 bg-muted rounded-full" />
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
