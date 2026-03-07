
"use client"

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Mail, ArrowLeft, Key, Send, Loader2, CheckCircle2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/firebase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Хатогӣ", description: "Почтаро ворид кунед", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast({
        title: "Паём фиристода шуд",
        description: "Дастурамал барои барқарории рамз ба почтаи шумо рафт.",
      });
    } catch (error: any) {
      toast({
        title: "Хатогӣ",
        description: "Корбар бо ин почта ёфт нашуд ё хатогӣ дар сервер рӯй дод.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="text-center pt-16 pb-10 bg-muted/10">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <Key className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black font-headline text-secondary tracking-tighter uppercase leading-none">БАРҚАРОРИИ РАМЗ</CardTitle>
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest mt-4">
              {sent ? "ПАЁМ БО МУВАФФАКИЯТ ФИРИСТОДА ШУД" : "ПОЧТАИ ХУДРО ВОРИД КУНЕД"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-10 px-10">
            {!sent ? (
              <form onSubmit={handleRecover} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Почтаи электронӣ</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="example@mail.tj" 
                      className="pl-12 h-14 rounded-2xl bg-muted/20 border-muted font-bold"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button disabled={loading} type="submit" className="w-full bg-primary h-16 text-lg font-black rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] uppercase tracking-widest">
                  {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <><Send className="mr-2 h-5 w-5" /> ФИРИСТОДАН</>}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground italic">
                  Мо ба почтаи <b>{email}</b> пайванд барои ивази рамзро фиристодем. Лутфан паёмҳои худро (аз ҷумла бахши Spam)-ро санҷед.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-16 px-10">
            <Button variant="ghost" asChild className="w-full text-muted-foreground font-black text-[10px] uppercase tracking-widest">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                БОЗГАШТ БА ВОРИДШАВӢ
              </Link>
            </Button>
            <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.5em] pt-4">
              &copy; 2026 KORYOB @. ТАҲИЯШУДА ТАВАССУТИ TAJ.WEB
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
