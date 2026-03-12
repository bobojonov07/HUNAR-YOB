
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
import { Hammer, User as UserIcon, Mail, ChevronLeft, Phone, ShieldCheck, Calendar, CheckCircle2, Loader2 } from "lucide-react";
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

      // Finalize Registration Directly
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
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-10">
        <Card className="w-full max-w-xl border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="text-center bg-muted/10 pb-10 pt-16">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-4xl font-black font-headline text-secondary tracking-tighter uppercase leading-none">САБТИ НОМ</CardTitle>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-4">Пайвастшавӣ ба платформаи устоҳо</p>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-10 px-10">
              <div className="space-y-4">
                <Label className="font-black text-xs uppercase tracking-widest opacity-60 text-center block mb-2">Навъи фаъолият</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)} className="grid grid-cols-2 gap-4">
                  <Label htmlFor="client" className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-3xl border-2 cursor-pointer transition-all h-32 text-center",
                    role === 'Client' ? "border-primary bg-primary/5 shadow-lg" : "border-muted opacity-60 hover:opacity-100"
                  )}>
                    <RadioGroupItem value="Client" id="client" className="sr-only" />
                    <UserIcon className={cn("h-8 w-8 mb-2", role === 'Client' ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-black text-[10px] uppercase tracking-widest">МИЗОҶ</span>
                    {role === 'Client' && <CheckCircle2 className="h-4 w-4 text-primary mt-2" />}
                  </Label>
                  <Label htmlFor="artisan" className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-3xl border-2 cursor-pointer transition-all h-32 text-center",
                    role === 'Usto' ? "border-primary bg-primary/5 shadow-lg" : "border-muted opacity-60 hover:opacity-100"
                  )}>
                    <RadioGroupItem value="Usto" id="artisan" className="sr-only" />
                    <Hammer className={cn("h-8 w-8 mb-2", role === 'Usto' ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-black text-[10px] uppercase tracking-widest">УСТО</span>
                    {role === 'Usto' && <CheckCircle2 className="h-4 w-4 text-primary mt-2" />}
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-black text-xs uppercase tracking-widest opacity-60">Ному насаби пурра</Label>
                <input className="flex h-14 w-full rounded-2xl border border-muted bg-muted/20 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-bold" placeholder="Ному насаби худро ворид кунед" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Рақами телефон</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-4 text-sm font-black text-muted-foreground">+992</div>
                    <Input className="pl-16 h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="900000000" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={9} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Почтаи электронӣ</Label>
                  <Input type="email" placeholder="example@mail.tj" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Минтақаи истиқомат</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-muted font-bold text-left"><SelectValue placeholder="Интихоби минтақа" /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {ALL_REGIONS.map(r => <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Санаи таваллуд</Label>
                  <div className="relative">
                    <Calendar className="absolute right-4 top-4 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input type="date" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold pr-12" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Рамзи нав</Label>
                  <Input type="password" id="password" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Тасдиқи рамз</Label>
                  <Input type="password" id="confirm-password" className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" placeholder="******" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>

              <div className="flex items-start space-x-4 p-5 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 transition-all hover:bg-primary/10">
                <Checkbox 
                  id="agreed" 
                  checked={agreed} 
                  onCheckedChange={(v) => setAgreed(!!v)} 
                  className="mt-1 h-6 w-6 rounded-lg data-[state=checked]:bg-primary" 
                />
                <Label htmlFor="agreed" className="text-[10px] text-muted-foreground font-bold leading-relaxed block cursor-pointer">
                  Ман бо <Link href="/about#terms" className="text-primary underline">Шартҳои истифода</Link>, <Link href="/about#privacy" className="text-primary underline">Сиёсати махфият</Link> розӣ ҳастам ва тасдиқ мекунам, ки аз 16-сола боло мебошам.
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-16 px-10 mt-6 text-center">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-16 text-xl font-black rounded-[2rem] shadow-2xl bg-primary hover:scale-[1.02] transition-transform uppercase tracking-widest"
              >
                {loading ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> САБТ...</> : "САБТИ НОМ"}
              </Button>
              <p className="text-sm text-center text-muted-foreground font-bold italic">
                Аллакай акаунт доред? <Link href="/login" className="text-primary font-black hover:underline not-italic">Ворид шавед</Link>
              </p>
              <p className="text-[10px] text-center text-muted-foreground mt-10 font-black uppercase tracking-[0.4em]">
                &copy; 2026 HUNAR-YOB. ТАҲИЯШУДА ТАВАССУТИ TAJ.WEB
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
