
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { UserProfile, ALL_REGIONS, Listing } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  LogOut, 
  Camera, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  Calendar,
  User,
  ShieldCheck,
  PlusCircle,
  Crown,
  Phone,
  MapPin,
  Clock,
  Trash2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, updateDoc, collection, query, where, deleteDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
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

  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user && userProfileRef) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 1920, 1.0);
        updateDoc(userProfileRef, { profileImage: compressed });
        toast({ title: "Сурат навсозӣ шуд" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Оё мехоҳед ин эълонро нест кунед?")) return;
    try {
      await deleteDoc(doc(db, "listings", listingId));
      toast({ title: "Эълон нест карда шуд" });
    } catch (err) {
      toast({ title: "Хатогӣ ҳангоми несткунӣ", variant: "destructive" });
    }
  };

  const handleLogout = async () => { 
    await signOut(auth); 
    router.push("/"); 
  };

  if (authLoading || !profile) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  const registrationDate = profile.createdAt?.toDate()?.toLocaleDateString('tg-TJ', { year: 'numeric', month: 'long', day: 'numeric' });
  const premiumExpiryDate = profile.premiumExpiresAt?.toDate()?.toLocaleDateString('tg-TJ', { year: 'numeric', month: 'long', day: 'numeric' });
  const isPremium = profile.isPremium;

  return (
    <div className={cn("min-h-screen pb-20", isPremium ? "bg-secondary" : "bg-background")}>
      <Navbar />
      
      <div className={cn("pt-12 pb-32 relative overflow-hidden", isPremium ? "bg-black/60" : "bg-secondary")}>
        {isPremium && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-primary/20 animate-pulse" />
        )}
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10 font-black rounded-xl">
              <ChevronLeft className="mr-2 h-5 w-5" /> БОЗГАШТ
            </Button>
            <div className="flex flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
              <Button asChild variant="outline" className="rounded-2xl bg-white/5 text-white border-white/20 h-12 font-black flex-1 md:flex-none">
                <Link href="/settings"><Settings className="mr-2 h-5 w-5" /> ТАНЗИМОТ</Link>
              </Button>
              <Button variant="destructive" className="rounded-2xl h-12 font-black shadow-xl flex-1 md:flex-none" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" /> БАРОМАД
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <Card className={cn(
              "border-none shadow-3xl rounded-[3rem] overflow-hidden",
              isPremium ? "bg-white/95 backdrop-blur-xl ring-4 ring-yellow-400/30" : "bg-white"
            )}>
              <div className="p-10 text-center space-y-6">
                <div className="relative mx-auto w-44 h-44">
                  <Avatar className={cn(
                    "w-full h-full border-8 shadow-2xl",
                    isPremium ? "border-yellow-400" : "border-background"
                  )}>
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
                  {isPremium && (
                    <div className="absolute -top-4 -right-4 bg-yellow-400 p-3 rounded-2xl shadow-2xl rotate-12">
                      <Crown className="h-6 w-6 text-secondary fill-secondary" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h2 className={cn(
                    "text-3xl font-black flex items-center justify-center gap-2 tracking-tighter uppercase leading-none",
                    isPremium ? "text-secondary" : "text-secondary"
                  )}>
                    {profile.name} 
                    {profile.identificationStatus === 'Verified' && <CheckCircle2 className="h-7 w-7 text-green-500 fill-green-500/10" />}
                  </h2>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <Badge className="bg-primary text-white h-8 px-4 font-black uppercase tracking-widest">{profile.role === 'Usto' ? 'УСТО' : 'МИЗОҶ'}</Badge>
                    {isPremium && (
                      <Badge className="bg-yellow-500 text-secondary h-8 px-4 font-black uppercase tracking-widest">
                        <Sparkles className="mr-1 h-3 w-3" /> PREMIUM
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-6 space-y-4 text-left border-t border-dashed">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Рақами телефон</p>
                      <p className="text-sm font-black text-secondary">+992 {profile.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Минтақа</p>
                      <p className="text-sm font-black text-secondary">{profile.region || "Номаълум"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Санаи сабт</p>
                      <p className="text-sm font-black text-secondary">{registrationDate}</p>
                    </div>
                  </div>

                  {isPremium && (
                    <div className="flex items-center gap-4 p-6 bg-yellow-50 rounded-[2.5rem] border-2 border-yellow-200 shadow-inner group">
                      <div className="h-12 w-12 bg-yellow-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600 mb-1">Premium то:</p>
                        <p className="text-lg font-black text-yellow-700 tracking-tighter">{premiumExpiryDate}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 py-4 border-b border-dashed">
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Верификатсия</p>
                        <p className={cn("text-sm font-black uppercase", profile.identificationStatus === 'Verified' ? 'text-green-600' : 'text-orange-500')}>
                          {profile.identificationStatus === 'Verified' ? 'ТАСДИҚШУДА' : 'ТАСДИҚНАШУДА'}
                        </p>
                      </div>
                    </div>
                    {profile.identificationStatus !== 'Verified' && profile.identificationStatus !== 'Pending' && (
                      <Button asChild size="sm" className="bg-secondary text-white font-black rounded-xl h-10 px-4 text-[10px] uppercase tracking-widest">
                        <Link href="/verify">ТАСДИҚ КАРДАН</Link>
                      </Button>
                    )}
                  </div>
                </div>

                {!isPremium && (
                  <button 
                    onClick={() => router.push("/premium")} 
                    className="w-full bg-gradient-to-br from-yellow-400 to-orange-600 p-8 rounded-[2.5rem] text-secondary text-left relative overflow-hidden group hover:scale-[1.02] transition-all shadow-2xl mt-4"
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
              <TabsList className={cn(
                "p-2 rounded-[2rem] h-20 w-full shadow-inner border",
                isPremium ? "bg-white/10 border-white/20" : "bg-white/50 border-white"
              )}>
                <TabsTrigger value="listings" className={cn(
                  "flex-1 rounded-[1.5rem] font-black text-xs uppercase tracking-widest",
                  isPremium ? "text-white data-[state=active]:bg-yellow-500 data-[state=active]:text-secondary" : "data-[state=active]:bg-white data-[state=active]:shadow-lg"
                )}>
                  <User className="mr-2 h-4 w-4" /> Эълонҳои ман
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="listings" className="mt-8 space-y-6">
                <div className="flex justify-end mb-4">
                  <Button asChild className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                    <Link href="/create-listing"><PlusCircle className="mr-2 h-5 w-5" /> ЭЪЛОНИ НАВ</Link>
                  </Button>
                </div>

                {myListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myListings.map(listing => (
                      <Card key={listing.id} className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white group">
                        <div className="relative h-56 w-full overflow-hidden">
                          <Image src={listing.images[0]} alt={listing.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-4 right-4"><Badge className="bg-white/90 backdrop-blur-md text-secondary font-black">{listing.category}</Badge></div>
                        </div>
                        <div className="p-8 space-y-4">
                          <h3 className="text-xl font-black text-secondary truncate uppercase tracking-tighter">{listing.title}</h3>
                          <div className="flex gap-2">
                            <Button asChild className="flex-1 rounded-xl h-12 font-black uppercase text-[10px] tracking-widest bg-primary shadow-lg">
                              <Link href={`/listing/${listing.id}`}>ДИДАН</Link>
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleDeleteListing(listing.id)}
                              className="w-12 h-12 rounded-xl flex items-center justify-center p-0 shadow-lg"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className={cn(
                    "text-center py-32 rounded-[3rem] border-4 border-dashed shadow-inner",
                    isPremium ? "border-white/20 bg-black/20" : "border-muted bg-white/50"
                  )}>
                    <User className="h-20 w-20 mx-auto text-muted mb-6 opacity-30" />
                    <p className={cn(
                      "font-black uppercase tracking-widest opacity-40",
                      isPremium ? "text-white" : "text-muted-foreground"
                    )}>Шумо ҳоло эълон надоред</p>
                    <Button asChild className="mt-6 bg-secondary font-black rounded-2xl h-12 px-8 shadow-xl"><Link href="/create-listing">ЭЪЛОНИ НАВ</Link></Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
