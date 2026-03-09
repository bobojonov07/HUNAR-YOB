
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, ALL_REGIONS, Listing } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  LogOut, 
  Camera, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  Calendar,
  Lock,
  User,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  Crown,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, updateDoc, collection, query, where } from "firebase/firestore";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "@/firebase";
import { compressImage, cn } from "@/lib/utils";

export default function Profile() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const listingsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "listings"), where("userId", "==", user.uid));
  }, [db, user]);
  const { data: myListings = [] } = useCollection<Listing>(listingsQuery as any);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit States
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    if (profile) { 
      setEditName(profile.name); 
      setEditRegion(profile.region || ""); 
    } 
  }, [profile]);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user && userProfileRef) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 400, 0.7);
        updateDoc(userProfileRef, { profileImage: compressed });
        toast({ title: "Сурат навсозӣ шуд" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
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

      setIsSettingsOpen(false);
      toast({ title: "Маълумот сабт шуд" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Хатогӣ", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => { 
    await signOut(auth); 
    router.push("/"); 
  };

  if (authLoading || !profile) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  const registrationDate = profile.createdAt?.toDate()?.toLocaleDateString('tg-TJ', { year: 'numeric', month: 'long', day: 'numeric' });
  const isUsto = profile.role === 'Usto';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="bg-secondary pt-12 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10 font-black rounded-xl">
              <ChevronLeft className="mr-2 h-5 w-5" /> БОЗГАШТ
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-2xl bg-white/5 text-white border-white/20 h-12 font-black" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="mr-2 h-5 w-5" /> ТАНЗИМОТ
              </Button>
              <Button variant="destructive" className="rounded-2xl h-12 font-black shadow-xl" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" /> БАРОМАД
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white">
              <div className="p-10 text-center space-y-6">
                <div className="relative mx-auto w-40 h-40">
                  <Avatar className="w-full h-full border-8 border-background shadow-2xl">
                    <AvatarImage src={profile.profileImage} className="object-cover" />
                    <AvatarFallback className="text-5xl font-black bg-muted text-secondary">{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => profileFileInputRef.current?.click()} 
                    className="absolute bottom-2 right-2 bg-primary text-white p-3 rounded-2xl shadow-2xl hover:scale-110 transition-transform"
                  >
                    <Camera className="h-6 w-6" />
                  </button>
                  <input type="file" className="hidden" ref={profileFileInputRef} onChange={handleProfileImageChange} accept="image/*" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-secondary flex items-center justify-center gap-2">
                    {profile.name} 
                    {profile.identificationStatus === 'Verified' && <CheckCircle2 className="h-7 w-7 text-green-500 fill-green-500/10" />}
                  </h2>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge className="bg-primary text-white h-8 px-4 font-black uppercase tracking-widest">{profile.role === 'Usto' ? 'УСТО' : 'МИЗОҶ'}</Badge>
                    {profile.isPremium && <Badge className="bg-yellow-500 text-secondary h-8 px-4 font-black uppercase tracking-widest">PREMIUM</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 py-4 border-y border-dashed">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ЭЪЛОНҲОИ ФАЪОЛ</p>
                    <p className="text-2xl font-black text-secondary">{myListings.length}</p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold">Аъзо аз: <b className="text-secondary">{registrationDate}</b></span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold">Верификатсия: <b className={cn("uppercase", profile.identificationStatus === 'Verified' ? 'text-green-600' : 'text-orange-500')}>{profile.identificationStatus}</b></span>
                  </div>
                </div>

                {!profile.isPremium && (
                  <button 
                    onClick={() => router.push("/premium")} 
                    className="w-full bg-gradient-to-br from-yellow-400 to-orange-600 p-8 rounded-[2.5rem] text-secondary text-left relative overflow-hidden group hover:scale-[1.02] transition-all shadow-2xl"
                  >
                    <div className="absolute top-[-50%] right-[-20%] w-40 h-40 bg-white/20 blur-[50px] rounded-full" />
                    <div className="relative z-10 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-black uppercase opacity-80 tracking-widest block mb-1">Имконияти нав</span>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">ГИРИФТАНИ PREMIUM</h3>
                      </div>
                      <Crown className="h-10 w-10 text-secondary fill-secondary/20 animate-bounce" />
                    </div>
                  </button>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Tabs defaultValue="listings" className="w-full">
              <TabsList className="bg-white/50 backdrop-blur-xl p-2 rounded-[2rem] h-20 w-full shadow-inner border border-white">
                <TabsTrigger value="listings" className="flex-1 rounded-[1.5rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                  <User className="mr-2 h-4 w-4" /> Эълонҳои ман
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="listings" className="mt-8 space-y-6">
                {isUsto && (
                  <div className="flex justify-end mb-4">
                    <Button asChild className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                      <Link href="/create-listing"><PlusCircle className="mr-2 h-5 w-5" /> ЭЪЛОНИ НАВ</Link>
                    </Button>
                  </div>
                )}

                {myListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myListings.map(listing => (
                      <Card key={listing.id} className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white group">
                        <div className="relative h-56 w-full overflow-hidden">
                          <Image src={listing.images[0]} alt={listing.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-4 right-4"><Badge className="bg-white/90 backdrop-blur-md text-secondary font-black">{listing.category}</Badge></div>
                        </div>
                        <div className="p-8">
                          <h3 className="text-xl font-black text-secondary mb-6 truncate uppercase tracking-tighter">{listing.title}</h3>
                          <Button asChild className="w-full rounded-xl h-12 font-black uppercase text-[10px] tracking-widest bg-primary shadow-lg">
                            <Link href={`/listing/${listing.id}`}>ДИДАН</Link>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-32 bg-white/50 rounded-[3rem] border-4 border-dashed border-muted shadow-inner">
                    <User className="h-20 w-20 mx-auto text-muted mb-6 opacity-30" />
                    <p className="text-muted-foreground font-black uppercase tracking-widest opacity-40">Шумо ҳоло эълон надоред</p>
                    <Button asChild className="mt-6 bg-secondary font-black rounded-2xl h-12 px-8 shadow-xl"><Link href="/create-listing">ЭЪЛОНИ НАВ</Link></Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-[3rem] p-0 max-w-lg overflow-hidden border-none shadow-3xl">
          <div className="bg-secondary p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Settings className="h-7 w-7 text-primary" /> ТАНЗИМОТИ ПРОФИЛ
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-10 space-y-8 bg-white max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <User className="h-4 w-4" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Маълумоти шахсӣ</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Ному Насаб</Label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-secondary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Минтақа</Label>
                  <Select value={editRegion} onValueChange={setEditRegion}>
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-secondary">
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

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Lock className="h-4 w-4" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Ивази Рамз</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Рамзи кӯҳна</Label>
                  <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="h-14 rounded-2xl bg-muted/30 border-none font-bold" placeholder="******" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Рамзи нав</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-14 rounded-2xl bg-muted/30 border-none font-bold" placeholder="******" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Тасдиқи рамзи нав</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-14 rounded-2xl bg-muted/30 border-none font-bold" placeholder="******" />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleUpdateProfile} 
              disabled={isSaving} 
              className="w-full bg-primary h-16 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
            >
              {isSaving ? <Loader2 className="animate-spin h-6 w-6" /> : "САБТ КАРДАНИ ТАҒЙИРОТ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
