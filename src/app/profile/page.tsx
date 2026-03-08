
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, ALL_REGIONS, Listing } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  LogOut, 
  Plus, 
  Camera, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ChevronLeft, 
  Wallet, 
  Loader2, 
  Heart, 
  CheckCircle2, 
  Trash2, 
  AlertCircle, 
  Ban,
  Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, updateDoc, collection, query, where, deleteDoc } from "firebase/firestore";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "@/firebase";
import { compressImage } from "@/lib/utils";

export default function Profile() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const dataQuery = useMemo(() => {
    if (!db || !profile || !user) return null;
    if (profile.role === 'Usto') {
      return query(collection(db, "listings"), where("userId", "==", user.uid));
    } else {
      const favs = profile.favorites || [];
      if (favs.length === 0) return null;
      return query(collection(db, "listings"), where("id", "in", favs.slice(0, 10)));
    }
  }, [db, profile, user]);

  const { data: displayListings = [], loading: dataLoading } = useCollection<Listing>(dataQuery as any);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditRegion(profile.region || "");
    }
  }, [profile]);

  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const completion = useMemo(() => {
    if (!profile) return 0;
    let points = 0;
    if (profile.name) points += 20;
    if (profile.email) points += 20;
    if (profile.phone) points += 20;
    if (profile.region) points += 20;
    if (profile.profileImage) points += 20;
    return points;
  }, [profile]);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user && userProfileRef) {
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 400, 0.7);
        updateDoc(userProfileRef, { profileImage: compressed })
          .then(() => toast({ title: "Сурати профил навсозӣ шуд" }))
          .finally(() => setIsUploadingPhoto(false));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userProfileRef) return;
    setIsSaving(true);
    updateDoc(userProfileRef, { name: editName, region: editRegion })
    .then(() => {
      toast({ title: "Профил навсозӣ шуд" });
      setIsSettingsOpen(false);
    })
    .finally(() => setIsSaving(false));
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !oldPassword || !newPassword) return;
    setIsSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      toast({ title: "Муваффақият" });
      setIsSettingsOpen(false);
    } catch (e) {
      toast({ title: "Хатогӣ", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Оё шумо мутмаин ҳастед?")) return;
    deleteDoc(doc(db, "listings", listingId)).then(() => toast({ title: "Нест карда шуд" }));
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (authLoading || !profile) return <div className="min-h-screen flex items-center justify-center">Боргузорӣ...</div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="hover:text-primary p-0 font-black">
            <ChevronLeft className="mr-2 h-5 w-5" /> БОЗГАШТ
          </Button>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-2xl border-2 font-black h-12 px-6">
                <Settings className="mr-2 h-5 w-5" /> ТАНЗИМОТ
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-0 border-none shadow-3xl overflow-hidden max-w-md">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="w-full h-16 rounded-none bg-muted/20 border-b p-1">
                  <TabsTrigger value="profile" className="flex-1 rounded-none font-black text-[10px] uppercase tracking-widest">Профил</TabsTrigger>
                  <TabsTrigger value="security" className="flex-1 rounded-none font-black text-[10px] uppercase tracking-widest">Амният</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="p-10 space-y-6">
                  <DialogHeader><DialogTitle className="text-2xl font-black text-secondary tracking-tighter">ТАҲРИРИ ПРОФИЛ</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Ному насаб</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Минтақа</Label>
                      <Select value={editRegion} onValueChange={setEditRegion}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-muted font-bold"><SelectValue placeholder="Минтақа" /></SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {ALL_REGIONS.map(r => <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleUpdateProfile} disabled={isSaving} className="w-full bg-primary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl">САБТ КАРДАН</Button>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="p-10 space-y-6">
                  <DialogHeader><DialogTitle className="text-2xl font-black text-secondary tracking-tighter">ИВАЗИ РАМЗ</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Рамзи кӯҳна</Label>
                      <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Рамзи нав</Label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-muted" />
                    </div>
                    <Button onClick={handleChangePassword} disabled={isSaving} className="w-full bg-secondary h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl">НАВСОЗӢ</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="text-center pb-2 pt-10">
                <div className="flex justify-center mb-4 relative">
                  <Avatar className="h-32 w-32 ring-8 ring-primary/5 shadow-2xl">
                    <AvatarImage src={profile.profileImage} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-primary text-white font-black">{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <button onClick={() => profileFileInputRef.current?.click()} className="absolute bottom-0 right-1/2 translate-x-12 bg-secondary text-white p-3 rounded-2xl shadow-xl">
                    <Camera className="h-5 w-5" />
                  </button>
                  <input type="file" className="hidden" ref={profileFileInputRef} onChange={handleProfileImageChange} accept="image/*" />
                </div>
                <CardTitle className="text-2xl font-black flex items-center justify-center gap-2 tracking-tighter text-secondary">
                  {profile.name}
                  {profile.identificationStatus === 'Verified' && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                </CardTitle>
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant="outline" className="border-primary text-primary px-4 py-1 font-black rounded-xl uppercase tracking-widest text-[10px]">{profile.role === 'Usto' ? 'УСТО' : 'МИЗОҶ'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4 px-8">
                <button onClick={() => router.push("/wallet")} className="w-full block p-6 bg-secondary text-white rounded-[2rem] shadow-xl hover:scale-[1.02] transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Тавозуни Ҳамён</span>
                    <Wallet className="h-5 w-5 opacity-60" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">{profile.balance || 0}</span>
                    <span className="text-sm font-bold opacity-60">TJS</span>
                  </div>
                </button>

                <button 
                  onClick={() => router.push("/verify")}
                  className={`w-full p-6 rounded-[2rem] border-2 border-dashed flex items-center gap-4 text-left transition-all ${
                    profile.identificationStatus === 'Verified' ? 'bg-green-50 border-green-200 text-green-700' :
                    profile.identificationStatus === 'Pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                    profile.identificationStatus === 'Rejected' ? 'bg-orange-50 border-orange-200 text-orange-700 animate-pulse' :
                    profile.identificationStatus === 'Blocked' ? 'bg-red-50 border-red-200 text-red-700' :
                    'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <div className="h-10 w-10 rounded-2xl bg-white/50 flex items-center justify-center shrink-0">
                    {profile.identificationStatus === 'Verified' ? <ShieldCheck className="h-6 w-6" /> : 
                     profile.identificationStatus === 'Pending' ? <Clock className="h-6 w-6" /> : 
                     profile.identificationStatus === 'Blocked' ? <Ban className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {profile.identificationStatus === 'Verified' ? 'Тасдиқшуда' : 
                       profile.identificationStatus === 'Pending' ? 'Дар баррасӣ' : 
                       profile.identificationStatus === 'Rejected' ? 'Маълумотро дубора фиристед' : 
                       profile.identificationStatus === 'Blocked' ? 'БЛОК ШУДААСТ' : 'Тасдиқи шахсият'}
                    </p>
                    <p className="text-[9px] font-medium opacity-60">
                      {profile.identificationStatus === 'Rejected' ? 'Маълумотро дубора фиристед' : 
                       profile.identificationStatus === 'Verified' ? 'Шумо устои тасдиқшуда ҳастед' : 'Барои гирифтани нишони касбӣ пахш кунед'}
                    </p>
                  </div>
                </button>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60"><span>Пуррагии профил</span><span>{completion}%</span></div>
                  <Progress value={completion} className="h-3" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 p-8 pt-0">
                <Button variant="ghost" className="w-full h-14 rounded-2xl text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50" onClick={handleLogout}><LogOut className="mr-3 h-5 w-5" /> Баромад</Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h2 className="text-4xl font-black text-secondary flex items-center gap-4 tracking-tighter">
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  {profile.role === 'Usto' ? <Zap className="h-7 w-7 text-primary" /> : <Heart className="h-7 w-7 text-red-500" />}
                </div> 
                {profile.role === 'Usto' ? 'ЭЪЛОНҲОИ МАН' : 'ПИСАНДИДАҲОИ МАН'}
              </h2>
              {profile.role === 'Usto' && (
                <Button asChild className="bg-primary h-14 rounded-2xl font-black px-8 shadow-xl uppercase tracking-widest transition-all hover:scale-[1.03]">
                  <Link href="/create-listing"><Plus className="mr-3 h-5 w-5" /> ЭЪЛОНИ НАВ</Link>
                </Button>
              )}
            </div>

            {dataLoading ? (
              <div className="text-center py-20 opacity-50">Боргузорӣ...</div>
            ) : displayListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {displayListings.map(listing => (
                  <Card key={listing.id} className="overflow-hidden border-none shadow-xl rounded-[3rem] bg-white group">
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image src={listing.images[0]} alt={listing.title} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                      <Badge className="absolute top-6 left-6 bg-primary/95 text-white border-none px-6 py-2.5 font-black rounded-2xl backdrop-blur-xl shadow-xl">{listing.category}</Badge>
                    </div>
                    <CardHeader className="p-10 pb-4">
                      <CardTitle className="text-2xl font-black text-secondary line-clamp-1 tracking-tight">{listing.title}</CardTitle>
                    </CardHeader>
                    <CardFooter className="p-10 pt-0 flex gap-2">
                      <Button variant="outline" asChild className="flex-1 rounded-2xl border-muted text-secondary h-12 px-6 font-black uppercase text-[10px]">
                        <Link href={`/listing/${listing.id}`}>БИНЕД</Link>
                      </Button>
                      {profile.role === 'Usto' && (
                        <Button onClick={() => handleDeleteListing(listing.id)} variant="ghost" className="w-12 h-12 rounded-2xl text-red-500 hover:bg-red-50 p-0"><Trash2 className="h-5 w-5" /></Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-muted/50 shadow-inner">
                {profile.role === 'Usto' ? <Zap className="h-20 w-20 mx-auto text-muted mb-6 opacity-30" /> : <Heart className="h-20 w-20 mx-auto text-muted mb-6 opacity-30" />}
                <p className="text-muted-foreground font-black text-xl uppercase tracking-[0.2em] opacity-40 text-center">ЭЪЛОНҲО ЁФТ НАШУДАНД</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
