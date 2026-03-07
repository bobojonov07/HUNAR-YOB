
"use client"

import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  ChevronRight, 
  Zap, 
  Crown, 
  X, 
  Instagram, 
  MessageCircle, 
  Send as TelegramIcon,
  ExternalLink,
  ArrowRight,
  LogIn,
  CheckCircle2,
  BriefcaseBusiness
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useUser, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { UserProfile, Listing } from "@/lib/storage";

const CATEGORIES = [
  { name: "Барномасоз", icon: "💻" },
  { name: "Дӯзанда", icon: "🧵" },
  { name: "Дуредгар", icon: "🪵" },
  { name: "Сантехник", icon: "🔧" },
  { name: "Барқчӣ", icon: "⚡" },
  { name: "Меъмор", icon: "🏗️" },
  { name: "Дигар", icon: "✨" }
];

const REGIONS = ["Душанбе", "Хатлон", "Суғд", "ВМКБ", "Ноҳияҳои тобеи марказ"];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const listingsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(20));
  }, [db]);

  const { data: allListings = [] } = useCollection<Listing>(listingsQuery as any);

  const filteredListings = useMemo(() => {
    let result = allListings;
    
    if (!user) {
      result = result.filter(l => l.isVip);
    }
    
    if (selectedCategory) {
      result = result.filter(l => l.category === selectedCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [allListings, user, selectedCategory, searchQuery]);

  const vipListings = filteredListings.filter(l => l.isVip);

  const handleMoreInfoClick = (listingId: string) => {
    if (!user) {
      toast({
        title: "Вуруд лозим аст",
        description: "Барои дидани маълумоти пурра лутфан сабти ном кунед ё вориди акаунт шавед",
      });
      router.push("/login");
    } else {
      router.push(`/listing/${listingId}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative w-full py-32 lg:py-56 bg-secondary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25 scale-110 blur-[3px] motion-safe:animate-[pulse_10s_infinite]">
          <Image 
            src={PlaceHolderImages[0].imageUrl} 
            alt="Hero Background" 
            fill 
            className="object-cover"
            priority
            data-ai-hint={PlaceHolderImages[0].imageHint}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-10 bg-primary/20 text-primary border-primary/30 backdrop-blur-2xl px-8 py-2.5 text-xs font-black tracking-[0.3em] uppercase rounded-full">
              Платформаи рақами яки устоҳо дар Тоҷикистон
            </Badge>
            <h1 className="text-6xl md:text-9xl font-headline font-black mb-10 leading-[0.95] tracking-tighter drop-shadow-sm uppercase">
              KORYOB 2 <br />
              <span className="italic opacity-90">МАҲОРАТРО ЁБ.</span>
            </h1>
            
            <div className="mt-12 bg-white/5 backdrop-blur-3xl p-3 rounded-[3rem] border border-white/10 shadow-3xl max-w-4xl mx-auto transition-all hover:scale-[1.01]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8 relative">
                  <Search className="absolute left-6 h-6 w-6 text-muted-foreground top-1/2 -translate-y-1/2" />
                  <Input 
                    className="h-16 pl-16 pr-6 bg-white text-secondary rounded-[2.5rem] text-xl border-none focus-visible:ring-primary shadow-2xl font-bold placeholder:font-medium"
                    placeholder="Ҷустуҷӯи устоҳо..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="md:col-span-4">
                  <Select onValueChange={(val) => setSelectedRegion(val === "all" ? null : val)}>
                    <SelectTrigger className="h-16 bg-white text-secondary rounded-[2.5rem] text-xl border-none shadow-2xl font-bold">
                      <SelectValue placeholder="Минтақаҳо" />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-none shadow-3xl">
                      <SelectItem value="all" className="font-bold">Ҳамаи минтақаҳо</SelectItem>
                      {REGIONS.map(r => (
                        <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {!user && (
              <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
                <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-2xl uppercase tracking-widest transition-all hover:scale-105">
                  <Link href="/login"><LogIn className="mr-3 h-6 w-6" /> ВОРИДШАВӢ</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-16 px-12 rounded-2xl border-2 border-white text-white hover:bg-white hover:text-secondary font-black text-lg shadow-2xl uppercase tracking-widest transition-all hover:scale-105 bg-white/10 backdrop-blur-md">
                  <Link href="/register">САБТИ НОМ</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* РЕКЛАМА KORYOB TJ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <Link href="https://koryob.ru" target="_blank" className="block group">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl transition-all hover:shadow-blue-500/20 hover:scale-[1.01]">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/20">
                  <BriefcaseBusiness className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none mb-2">KORYOB TJ</h2>
                  <p className="text-blue-100 font-medium opacity-80 text-sm md:text-base">Барои нашри эълон ба KORYOB TJ гузаред</p>
                </div>
              </div>
              <Button className="bg-white text-blue-700 hover:bg-white/90 h-16 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl shrink-0 transition-transform group-hover:translate-x-2">
                ГУЗАШТАН <ExternalLink className="ml-3 h-5 w-5" />
              </Button>
            </div>
          </Link>
        </div>
      </section>

      {/* Category Section */}
      <section className="py-20 bg-background/50 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-headline font-black text-secondary tracking-tighter uppercase">КАТЕГОРИЯҲО</h2>
            <p className="text-muted-foreground font-bold mt-2 uppercase tracking-widest text-[10px]">Маҳорати лозимаро интихоб кунед</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-8">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.name} 
                onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)}
                className={cn(
                  "group flex flex-col items-center p-8 rounded-[2.5rem] border-2 transition-all duration-500 hover:shadow-2xl",
                  selectedCategory === cat.name 
                    ? "bg-primary text-white border-primary shadow-2xl scale-110" 
                    : "bg-white hover:bg-white border-transparent hover:border-primary/20"
                )}
              >
                <span className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-500 block">{cat.icon}</span>
                <span className="text-[10px] font-black tracking-widest uppercase text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Showcase */}
      {vipListings.length > 0 && (
        <section className="py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-5 mb-16">
              <div className="h-16 w-16 bg-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-yellow-500/30 transform -rotate-6">
                <Crown className="h-9 w-9 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-5xl font-headline font-black text-secondary tracking-tighter uppercase">VIP УСТОҲО</h2>
                <p className="text-yellow-600 font-black text-xs uppercase tracking-widest">Беҳтарин пешниҳодҳои Тоҷикистон</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {vipListings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden group hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-700 border-none bg-white rounded-[3.5rem] ring-8 ring-yellow-400/5">
                  <div className="relative h-80 w-full overflow-hidden">
                    <Image
                      src={listing.images[0] || PlaceHolderImages[1].imageUrl}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute top-8 right-8 z-10">
                      <Badge className="bg-yellow-500 text-white border-none shadow-2xl px-6 py-2.5 text-[10px] font-black rounded-full">
                        VIP PREMIUM
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-10">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-xl font-black shadow-xl">
                        {listing.userName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-lg font-black text-secondary block leading-none truncate">{listing.userName}</span>
                        <span className="text-[10px] text-yellow-600 font-bold uppercase tracking-[0.2em] mt-2 block">Профили тасдиқшуда</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 border-t border-yellow-100 flex justify-between items-center bg-yellow-50/30">
                    <div className="flex items-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      Тоҷикистон
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleMoreInfoClick(listing.id)}
                      className="text-yellow-600 font-black group/btn hover:bg-yellow-100 rounded-2xl px-8 h-12"
                    >
                      БИНЕД
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white pt-32 pb-20 border-t">
        <div className="container mx-auto px-4">
          <div className="pt-12 border-t text-[10px] text-muted-foreground font-black tracking-[0.6em] uppercase text-center opacity-50">
            &copy; 2026 KORYOB 2. ТАҲИЯ ШУДААСТ ТАВАССУТИ TAJ.WEB
          </div>
        </div>
      </footer>
    </div>
  );
}
