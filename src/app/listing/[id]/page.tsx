
"use client"

import { useMemo, useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Listing, UserProfile, Review, VIP_PRICE } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  ChevronLeft, 
  Calendar, 
  Heart, 
  Share2, 
  Star, 
  Crown, 
  Eye,
  CheckCircle2,
  Flag,
  ShieldCheck,
  Zap,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useUser, useFirestore, useDoc, useCollection, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, increment, collection, query, orderBy, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const listingRef = useMemo(() => id ? doc(db, "listings", id as string) : null, [db, id]);
  const { data: listing } = useDoc<Listing>(listingRef as any);

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const [artisanProfile, setArtisanProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (listing?.userId) {
      getDoc(doc(db, "users", listing.userId)).then(snap => {
        if (snap.exists()) setArtisanProfile(snap.data() as UserProfile);
      });
    }
  }, [db, listing?.userId]);

  const reviewsQuery = useMemo(() => {
    if (!db || !id) return null;
    return query(collection(db, "listings", id as string, "reviews"), orderBy("createdAt", "desc"));
  }, [db, id]);
  const { data: reviews = [] } = useCollection<Review>(reviewsQuery as any);

  useEffect(() => {
    if (listingRef) {
      updateDoc(listingRef, { views: increment(1) }).catch(() => {});
    }
  }, [listingRef]);

  const isFavorite = useMemo(() => {
    return profile?.favorites?.includes(id as string) || false;
  }, [profile, id]);

  const isOwner = user?.uid === listing?.userId;

  const handleFavoriteToggle = async () => {
    if (!user || !userProfileRef) {
      toast({ title: "Вуруд лозим аст", variant: "destructive" });
      router.push("/login");
      return;
    }
    
    const updateData = {
      favorites: isFavorite ? arrayRemove(id) : arrayUnion(id)
    };

    updateDoc(userProfileRef, updateData)
      .then(() => {
        toast({
          title: isFavorite ? "Хориҷ карда шуд" : "Илова шуд",
        });
      })
      .catch(async (err: any) => {
        const permissionError = new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Пайванд нусхабардорӣ шуд" });
  };

  const handleCall = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (isOwner) return;
    if (listing?.userPhone) {
      window.location.href = `tel:+992${listing.userPhone}`;
    }
  };

  const handleVipUpgrade = async () => {
    if (!listing || !userProfileRef || !profile || !listingRef) return;
    if (profile.balance < VIP_PRICE) {
      toast({ title: "Маблағ нокифоя аст", variant: "destructive" });
      return;
    }

    const profileUpdate = { balance: increment(-VIP_PRICE) };
    const listingUpdate = { isVip: true };

    updateDoc(userProfileRef, profileUpdate).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userProfileRef.path,
        operation: 'update',
        requestResourceData: profileUpdate
      }));
    });

    updateDoc(listingRef, listingUpdate)
      .then(() => toast({ title: "Эълон VIP шуд!" }))
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: listingRef.path,
          operation: 'update',
          requestResourceData: listingUpdate
        }));
      });
  };

  if (!listing) return <div className="min-h-screen flex items-center justify-center bg-background">Боргузорӣ...</div>;

  const isVip = listing.isVip;

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-1000",
      isVip ? "bg-secondary/95 text-white" : "bg-background text-foreground"
    )}>
      <Navbar />

      {/* VIP Background Overlay */}
      {isVip && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4 py-8 lg:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className={cn("hover:text-primary p-0 font-black text-lg", isVip ? "text-white/80" : "text-secondary")}
          >
            <ChevronLeft className="mr-2 h-6 w-6" />
            БОЗГАШТ
          </Button>
          <div className="flex gap-4 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={handleShare} 
              className={cn(
                "flex-1 md:flex-none rounded-2xl h-14 font-black tracking-widest uppercase text-xs border-2 transition-all",
                isVip ? "bg-white/5 border-white/20 text-white hover:bg-white/10" : "border-border"
              )}
            >
              <Share2 className="mr-3 h-5 w-5" />
              МУБОДИЛА
            </Button>
            {!isOwner && (
              <Button 
                variant="outline" 
                onClick={handleFavoriteToggle}
                className={cn(
                  "flex-1 md:flex-none rounded-2xl h-14 px-8 font-black tracking-widest uppercase text-xs border-2 transition-all",
                  isFavorite 
                    ? "border-red-500 text-red-500 bg-red-500/5" 
                    : isVip ? "bg-white/5 border-white/20 text-white hover:bg-white/10" : "border-border"
                )}
              >
                <Heart className={cn("mr-3 h-5 w-5", isFavorite ? 'fill-red-500' : '')} />
                {isFavorite ? "ПИСАНДИДА" : "БА ПИСАНДИДАҲО"}
              </Button>
            )}
            {isOwner && !listing.isVip && (
              <Button onClick={handleVipUpgrade} className="bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-2xl h-14 px-8 shadow-2xl border-b-4 border-yellow-700 active:border-b-0 transition-all">
                <Crown className="mr-3 h-6 w-6 fill-white" />
                VIP КАРДАН ({VIP_PRICE} TJS)
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Image Section */}
            <div className={cn(
              "relative rounded-[3.5rem] overflow-hidden shadow-3xl border-none ring-8 transition-all duration-700",
              isVip ? "bg-black ring-yellow-400/20" : "bg-muted ring-white/50"
            )}>
              <Carousel className="w-full">
                <CarouselContent>
                  {listing.images.map((img, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-video">
                        <Image src={img} alt={`${listing.title}`} fill className="object-cover" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {listing.images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-8 bg-black/30 backdrop-blur-3xl border-none text-white h-14 w-14 hover:scale-110 transition-transform" />
                    <CarouselNext className="right-8 bg-black/30 backdrop-blur-3xl border-none text-white h-14 w-14 hover:scale-110 transition-transform" />
                  </>
                )}
              </Carousel>
              {isVip && (
                <div className="absolute top-10 right-10 pointer-events-none group">
                  <Badge className="bg-yellow-500 text-secondary text-2xl px-10 py-4 shadow-[0_0_50px_rgba(234,179,8,0.5)] font-black rounded-full animate-pulse uppercase tracking-tighter">
                    <Crown className="mr-3 h-8 w-8 fill-secondary" />
                    VIP PREMIUM
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <h1 className={cn(
                  "text-5xl md:text-8xl font-headline font-black tracking-tighter leading-none uppercase",
                  isVip ? "text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]" : "text-secondary"
                )}>
                  {listing.title}
                </h1>
                <div className={cn(
                  "flex items-center px-8 py-3 rounded-full border shadow-2xl backdrop-blur-xl transition-all",
                  isVip ? "bg-white/10 border-white/20 text-yellow-400" : "bg-primary/5 border-primary/10 text-primary"
                )}>
                  <Eye className="h-6 w-6 mr-4" />
                  <span className="text-sm font-black uppercase tracking-widest">{listing.views || 0} ТАМОШО</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Badge className={cn(
                  "px-8 py-3 text-sm font-black rounded-2xl shadow-2xl uppercase tracking-widest border-none",
                  isVip ? "bg-yellow-500 text-secondary" : "bg-primary text-white"
                )}>
                  {listing.category}
                </Badge>
              </div>

              <div className="space-y-6">
                <h3 className={cn(
                  "text-2xl font-black uppercase tracking-widest flex items-center gap-3 opacity-70",
                  isVip ? "text-white" : "text-secondary"
                )}>
                  <Zap className={cn("h-6 w-6", isVip ? "text-yellow-400" : "text-primary")} />
                  ТАВСИФИ ХИДМАТРАСОНӢ:
                </h3>
                <div className={cn(
                  "text-xl md:text-2xl leading-relaxed p-12 rounded-[4rem] border shadow-2xl italic font-medium relative overflow-hidden group transition-all duration-500",
                  isVip ? "bg-white/5 border-white/10 text-white/90" : "bg-white border-muted text-muted-foreground"
                )}>
                  {isVip && (
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                      <Sparkles className="h-20 w-20" />
                    </div>
                  )}
                  <span className="relative z-10">&ldquo;{listing.description}&rdquo;</span>
                </div>
              </div>
            </div>

            <Separator className={cn("my-20", isVip ? "bg-white/10" : "opacity-50")} />

            {/* Reviews Section */}
            <div className="space-y-12">
              <h3 className={cn(
                "text-4xl font-headline font-black tracking-tighter uppercase",
                isVip ? "text-white" : "text-secondary"
              )}>БАҲО ВА ШАРҲҲО</h3>
              
              <div className="space-y-8">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <Card key={rev.id} className={cn(
                      "border-none shadow-2xl rounded-[3rem] overflow-hidden transition-all hover:scale-[1.01]",
                      isVip ? "bg-white/5" : "bg-white"
                    )}>
                      <CardContent className="p-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl",
                              isVip ? "bg-yellow-500 text-secondary" : "bg-muted text-secondary"
                            )}>
                              {rev.userName.charAt(0)}
                            </div>
                            <div>
                              <p className={cn("font-black text-xl mb-2", isVip ? "text-white" : "text-secondary")}>
                                {rev.userName}
                              </p>
                              <div className="flex text-yellow-500 gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`h-5 w-5 ${i < rev.rating ? 'fill-yellow-500' : 'text-muted opacity-30'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className={cn(
                          "text-lg md:text-xl leading-relaxed italic font-medium",
                          isVip ? "text-white/70" : "text-muted-foreground"
                        )}>
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                        <div className="mt-8 flex items-center gap-3 text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 w-fit px-4 py-1.5 rounded-full">
                          <ShieldCheck className="h-4 w-4" /> ТАСДИҚШУДА АЗ ШАРТНОМА
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className={cn(
                    "text-center py-24 rounded-[4rem] border-4 border-dashed",
                    isVip ? "border-white/10 bg-white/5" : "border-muted bg-muted/10"
                  )}>
                    <Star className="h-20 w-20 mx-auto text-muted mb-6 opacity-30" />
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-sm opacity-50">Ҳанӯз шарҳе нест</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="lg:col-span-1">
            <Card className={cn(
              "sticky top-24 border-none shadow-3xl overflow-hidden rounded-[4rem] transition-all duration-700",
              isVip ? "bg-black/40 backdrop-blur-2xl ring-2 ring-yellow-400/50" : "bg-white ring-1 ring-secondary/5"
            )}>
              <div className={cn(
                "h-4 w-full",
                isVip ? "bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400 animate-shimmer bg-[length:200%_100%]" : "bg-primary"
              )} />
              <CardContent className="p-12">
                <div className={cn(
                  "flex items-center space-x-6 mb-10 pb-10 border-b",
                  isVip ? "border-white/10" : "border-muted"
                )}>
                  <div className={cn(
                    "h-24 w-24 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black border-4 border-white/20 shadow-3xl transform -rotate-6 transition-transform hover:rotate-0 duration-500",
                    isVip ? "bg-gradient-to-br from-yellow-400 to-yellow-700" : "bg-secondary"
                  )}>
                    {listing.userName.charAt(0)}
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-black text-3xl tracking-tighter leading-none mb-3",
                      isVip ? "text-white" : "text-secondary"
                    )}>
                      {listing.userName}
                    </h3>
                    {artisanProfile?.identificationStatus === 'Verified' && (
                      <p className="text-[10px] font-black flex items-center bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full w-fit uppercase tracking-[0.2em]">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        УСТОИ ТАСДИҚШУДА
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {!isOwner ? (
                    <>
                      <Button 
                        onClick={handleCall} 
                        className={cn(
                          "w-full h-24 text-2xl font-black rounded-[2.5rem] shadow-3xl transition-all active:scale-95",
                          isVip 
                            ? "bg-yellow-500 text-secondary hover:bg-yellow-400 shadow-yellow-500/20" 
                            : "bg-secondary text-white hover:bg-secondary/90"
                        )}
                      >
                        <Phone className="mr-5 h-8 w-8" />
                        ЗАНГ ЗАДАН
                      </Button>
                      <Button 
                        onClick={() => router.push(`/chat/${listing.id}`)} 
                        variant="outline" 
                        className={cn(
                          "w-full h-24 text-2xl font-black rounded-[2.5rem] border-2 transition-all active:scale-95",
                          isVip 
                            ? "bg-white/5 border-white/20 text-white hover:bg-white/10" 
                            : "border-primary text-primary hover:bg-primary/5"
                        )}
                      >
                        <MessageSquare className="mr-5 h-8 w-8" />
                        ЧАТ БО УСТО
                      </Button>
                    </>
                  ) : (
                    <div className={cn(
                      "text-center p-12 rounded-[2.5rem] text-sm font-black uppercase tracking-widest italic border-4 border-dashed",
                      isVip ? "border-white/10 text-white/40" : "border-muted text-muted-foreground opacity-50"
                    )}>
                      Ин эълони шумост
                    </div>
                  )}
                </div>

                {isVip && (
                  <div className="mt-10 p-6 bg-yellow-500/5 rounded-3xl border border-yellow-500/20 text-center">
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">Хизматрасонии тасдиқшуда</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
