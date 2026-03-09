
"use client"

import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, ALL_REGIONS } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronLeft, 
  Loader2, 
  Lock,
  User,
  Settings as SettingsIcon,
  MapPin,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => { 
    if (profile) { 
      setEditName(profile.name); 
      setEditRegion(profile.region || ""); 
    } 
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfileRef || !user) return;
    setIsSaving(true);

    try {
      await updateDoc(userProfileRef, { name: editName, region: editRegion });

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({ title: "Рамзҳо мувофиқат намекунанд", variant: "destructive" });
          setIsSaving(false);
          return;
        }
        if (!oldPassword) {
          toast({ title: "Рамзи кӯҳнаро ворид кунед", variant: "destructive" });
          setIsSaving(false);
          return;
        }

        const credential = EmailAuthProvider.credential(user.email!, oldPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast({ title: "Рамз иваз шуд" });
      }

      toast({ title: "Маълумот сабт шуд" });
      router.push("/profile");
    } catch (error: any) {
      toast({ title: "Хатогӣ", description: "Рамзи кӯҳна нодуруст аст ё хатогӣ дар сервер", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !profile) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-6 w-6" /> БОЗГАШТ
        </Button>

        <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="bg-secondary p-10 text-white">
            <CardTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
              <SettingsIcon className="h-8 w-8 text-primary" /> ТАНЗИМОТИ ПРОФИЛ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <form onSubmit={handleUpdateProfile} className="space-y-10">
              {/* Personal Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary">
                  <User className="h-5 w-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Маълумоти асосӣ</h3>
                </div>
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Ному Насаб</Label>
                    <Input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-secondary text-lg" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Минтақа</Label>
                    <Select value={editRegion} onValueChange={setEditRegion}>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-secondary text-lg">
                        <SelectValue placeholder="Интихоб" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {ALL_REGIONS.map(r => <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="h-px bg-muted w-full" />

              {/* Password Change */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary">
                  <Lock className="h-5 w-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Ивази Рамз (Агар лозим бошад)</h3>
                </div>
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Рамзи кӯҳна</Label>
                    <Input 
                      type="password" 
                      value={oldPassword} 
                      onChange={e => setOldPassword(e.target.value)} 
                      className="h-14 rounded-2xl bg-muted/30 border-none font-bold" 
                      placeholder="******" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Рамзи нав</Label>
                      <Input 
                        type="password" 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                        className="h-14 rounded-2xl bg-muted/30 border-none font-bold" 
                        placeholder="******" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Тасдиқи рамз</Label>
                      <Input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        className="h-14 rounded-2xl bg-muted/30 border-none font-bold" 
                        placeholder="******" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSaving} 
                className="w-full bg-primary h-18 text-lg font-black rounded-3xl shadow-2xl hover:scale-[1.02] transition-all uppercase tracking-widest"
              >
                {isSaving ? <Loader2 className="animate-spin h-6 w-6" /> : (
                  <><Save className="mr-2 h-6 w-6" /> САБТ КАРДАНИ ТАҒЙИРОТ</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
