
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ALL_CATEGORIES, UserProfile, Listing, REGULAR_LISTING_LIMIT, PREMIUM_LISTING_LIMIT } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Upload, ChevronLeft, Loader2, X, AlertTriangle, Crown } from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError, useCollection } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection, query, where } from "firebase/firestore";
import { compressImage, cn } from "@/lib/utils";
import Link from "next/link";

export default function CreateListing() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  // Check if user already has a listing
  const userListingsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "listings"), where("userId", "==", user.uid));
  }, [db, user]);
  
  const { data: userListings = [], loading: checkLoading } = useCollection<Listing>(userListingsQuery as any);
  
  const listingLimit = profile?.isPremium ? PREMIUM_LISTING_LIMIT : REGULAR_LISTING_LIMIT;
  const hasReachedLimit = userListings.length >= listingLimit;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (imageUrls.length + files.length > 5) {
      toast({ title: "Маҳдудият", description: "Танҳо то 5 сурат", variant: "destructive" });
      return;
    }

    setIsCompressing(true);
    const newImages: string[] = [];
    
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const compressed = await new Promise<string>((resolve) => {
        reader.onloadend = async () => {
          const res = await compressImage(reader.result as string, 800, 0.7);
          resolve(res);
        };
        reader.readAsDataURL(file);
      });
      newImages.push(compressed);
    }

    setImageUrls(prev => [...prev, ...newImages]);
    setIsCompressing(false);
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    
    if (hasReachedLimit) {
      toast({ 
        title: "Маҳдудияти эълон", 
        description: `Шумо лимити ${listingLimit} эълонро истифода бурдед.`, 
        variant: "destructive" 
      });
      return;
    }

    if (imageUrls.length < 1) {
      toast({ title: "Хатогӣ", description: "Лутфан ҳадди ақал 1 сурат бор кунед", variant: "destructive" });
      return;
    }
    if (!title || !category) {
      toast({ title: "Хатогӣ", description: "Майдонҳои унвон ва категорияро пур кунед", variant: "destructive" });
      return;
    }
    if (description.length < 150) {
      toast({ title: "Тавсиф хеле кӯтоҳ аст", description: "Тавсиф бояд ҳадди ақал 150 аломат бошад", variant: "destructive" });
      return;
    }
    if (description.length > 250) {
      toast({ title: "Тавсиф хеле дароз аст", description: "Тавсиф набояд аз 250 аломат зиёд бошад", variant: "destructive" });
      return;
    }
    
    const listingRef = doc(collection(db, "listings"));
    
    const listingData = {
      id: listingRef.id,
      userId: user.uid,
      userName: profile.name,
      userPhone: profile.phone || "",
      title,
      category,
      description,
      images: imageUrls,
      createdAt: serverTimestamp(),
      isVip: profile.isPremium || false,
      views: 0
    };

    setDoc(listingRef, listingData)
      .then(() => {
        toast({ title: "Эълон гузошта шуд" });
        router.push("/");
      })
      .catch(async (err: any) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: listingRef.path,
          operation: 'create',
          requestResourceData: listingData,
        }));
      });
  };

  if (authLoading || checkLoading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-black uppercase tracking-widest text-[10px] opacity-60">Дар ҳоли боргузорӣ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:text-primary p-0 font-black">
          <ChevronLeft className="mr-2 h-5 w-5" />
          БОЗГАШТ
        </Button>

        {hasReachedLimit ? (
          <Card className="border-none shadow-3xl rounded-[3rem] p-10 text-center bg-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500" />
            <div className="mx-auto h-24 w-24 bg-yellow-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
              <Crown className="h-12 w-12 text-yellow-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-secondary tracking-tighter uppercase mb-4">МАҲДУДИЯТИ ЭЪЛОН</h2>
            <div className="p-6 bg-yellow-50/50 rounded-3xl border-2 border-dashed border-yellow-100 mb-8">
              <p className="text-muted-foreground font-medium leading-relaxed">
                Шумо тамоми лимити худро ({listingLimit} эълон) истифода бурдед.
              </p>
            </div>
            {!profile.isPremium && (
              <p className="text-xs text-muted-foreground font-bold mb-10 italic">
                Барои нашри то 5 эълон, лутфан ба ҳолати **PREMIUM** гузаред.
              </p>
            )}
            <Button asChild className="w-full bg-secondary h-16 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02]">
              <Link href="/profile">БА ПРОФИЛИ МАН</Link>
            </Button>
          </Card>
        ) : (
          <Card className="border-border shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 pb-8">
              <div className="flex justify-between items-center">
                <CardTitle className="text-3xl font-headline font-black text-secondary tracking-tighter uppercase">ЭЪЛОНИ НАВ</CardTitle>
                {profile.isPremium && <Badge className="bg-yellow-500 text-white font-black">PREMIUM</Badge>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                  Шумо метавонед боз {listingLimit - userListings.length} эълон гузоред
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Суратҳо (ҳадди ақал 1)</Label>
                    <span className="text-[10px] font-bold text-muted-foreground">{imageUrls.length}/5</span>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <Button type="button" disabled={isCompressing} variant="outline" className="w-full h-32 border-dashed border-2 flex flex-col gap-2 rounded-2xl transition-all hover:bg-primary/5 hover:border-primary/30" onClick={() => fileInputRef.current?.click()}>
                    {isCompressing ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                    <span className="font-bold text-xs uppercase tracking-widest">{isCompressing ? 'Фишурдани суратҳо...' : 'Иловаи суратҳо'}</span>
                  </Button>
                  
                  <div className="grid grid-cols-5 gap-3 mt-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-md group">
                        <Image src={url} alt={`Preview ${index}`} fill className="object-cover" />
                        <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Номи касб ё хидмат</Label>
                  <Input placeholder="Масалан: Дуредгари моҳир" value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-muted font-bold" />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase tracking-widest opacity-60">Категория</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-muted font-bold"><SelectValue placeholder="Интихоби категория" /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {ALL_CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Тавсифи хидматрасонӣ</Label>
                    <span className={cn(
                      "text-[10px] font-black tracking-widest",
                      description.length < 150 || description.length > 250 ? "text-red-500" : "text-green-500"
                    )}>
                      {description.length} / 150-250
                    </span>
                  </div>
                  <Textarea 
                    placeholder="Дар бораи маҳорат ва таҷрибаи худ муфассал нависед (ҳадди ақал 150 аломат)..." 
                    className="min-h-[180px] rounded-2xl bg-muted/20 border-muted font-medium p-6" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                  />
                  <p className="text-[9px] text-muted-foreground font-medium italic">* Тавсифи муфассал бовариро зиёд мекунад.</p>
                </div>

                <div className="pt-6">
                  <Button type="submit" className="w-full bg-primary h-16 font-black rounded-[2rem] shadow-2xl uppercase tracking-widest transition-transform hover:scale-[1.02]">НАШРИ ЭЪЛОН</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
