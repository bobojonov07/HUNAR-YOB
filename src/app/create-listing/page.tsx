
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
import { doc, setDoc, serverTimestamp, collection, query, where, updateDoc, increment } from "firebase/firestore";
import { compressImage, cn, hasProfanity } from "@/lib/utils";
import Link from "next/link";

export default function CreateListing() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
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
        reader.onloadend = async () => resolve(await compressImage(reader.result as string, 1920, 1.0));
        reader.readAsDataURL(file);
      });
      newImages.push(compressed);
    }
    setImageUrls(prev => [...prev, ...newImages]);
    setIsCompressing(false);
  };

  const removeImage = (index: number) => setImageUrls(imageUrls.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !userProfileRef) return;
    
    if (hasReachedLimit) {
      toast({ title: "Маҳдудияти эълон", description: `Лимити ${listingLimit} эълон тамом шуд.`, variant: "destructive" });
      return;
    }

    if (imageUrls.length < 1) {
      toast({ title: "Хатогӣ", description: "Ҳадди ақал 1 сурат бор кунед", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    if (hasProfanity(`${title} ${description}`)) {
      const newWarningCount = (profile.warningCount || 0) + 1;
      await updateDoc(userProfileRef, { 
        warningCount: increment(1),
        isBlocked: newWarningCount >= 5,
        identificationStatus: newWarningCount >= 5 ? 'Blocked' : profile.identificationStatus
      });
      toast({ 
        title: "Огоҳӣ!", 
        description: `Дар эълон калимаҳои қабеҳ ёфт шуд. Огоҳии шумо: ${newWarningCount}/5.`, 
        variant: "destructive" 
      });
      setIsSubmitting(false);
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
        toast({ title: "Эълон нашр шуд" });
        router.push("/");
      })
      .catch((err: any) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: listingRef.path, operation: 'create', requestResourceData: listingData }));
      })
      .finally(() => setIsSubmitting(false));
  };

  if (authLoading || checkLoading || !profile) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:text-primary p-0 font-black"><ChevronLeft className="mr-2 h-5 w-5" /> БОЗГАШТ</Button>

        {hasReachedLimit ? (
          <Card className="border-none shadow-3xl rounded-[3rem] p-10 text-center bg-white">
            <div className="mx-auto h-24 w-24 bg-yellow-50 rounded-[2.5rem] flex items-center justify-center mb-8"><Crown className="h-12 w-12 text-yellow-500 animate-pulse" /></div>
            <h2 className="text-3xl font-black text-secondary uppercase mb-4">ЛИМИТИ ЭЪЛОН</h2>
            <p className="text-muted-foreground font-medium mb-10">Шумо ҳамаи лимити худро ({listingLimit} эълон) истифода бурдед. Барои илова кардани эълони нав акаунти худро ба Premium навсозӣ кунед ё эълонҳои кӯҳнаро нест кунед.</p>
            <Button asChild className="w-full bg-secondary h-16 rounded-[2rem] font-black uppercase shadow-2xl transition-all hover:scale-[1.02]"><Link href="/profile">БА ПРОФИЛ</Link></Button>
          </Card>
        ) : (
          <Card className="border-border shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 pb-8">
              <CardTitle className="text-3xl font-black text-secondary uppercase">ЭЪЛОНИ НАВ</CardTitle>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Боз {listingLimit - userListings.length} эълон гузошта метавонед</p>
                {profile.isPremium && <Badge className="bg-yellow-500 text-secondary text-[8px] font-black">PREMIUM LIMIT: 5</Badge>}
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-end"><Label className="font-black text-xs uppercase tracking-widest opacity-60">Суратҳо (ҳадди ақал 1)</Label><span className="text-[10px] font-bold text-muted-foreground">{imageUrls.length}/5</span></div>
                  <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <Button type="button" disabled={isCompressing || isSubmitting} variant="outline" className="w-full h-32 border-dashed border-2 rounded-2xl" onClick={() => fileInputRef.current?.click()}>
                    {isCompressing ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                    <span className="font-black text-xs uppercase tracking-widest">Иловаи суратҳо</span>
                  </Button>
                  <div className="grid grid-cols-5 gap-3 mt-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
                        <Image src={url} alt="Preview" fill className="object-cover" />
                        <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2"><Label className="font-black text-xs uppercase tracking-widest opacity-60">Номи хидмат</Label><Input placeholder="Масалан: Сохтани мебел" value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 rounded-2xl font-bold" /></div>
                <div className="space-y-2"><Label className="font-black text-xs uppercase tracking-widest opacity-60">Категория</Label>
                  <Select value={category} onValueChange={setCategory}><SelectTrigger className="h-14 rounded-2xl font-bold"><SelectValue placeholder="Интихоб" /></SelectTrigger><SelectContent>{ALL_CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><Label className="font-black text-xs uppercase tracking-widest opacity-60">Тавсифи хидмат</Label>
                  <span className={cn("text-[10px] font-black", (description.length < 150 || description.length > 250) ? "text-red-500" : "text-green-500")}>{description.length} / 150-250</span></div>
                  <Textarea placeholder="Дар бораи маҳорати худ нависед..." className="min-h-[180px] rounded-2xl p-6" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <Button type="submit" disabled={isSubmitting || isCompressing} className="w-full bg-primary h-16 font-black rounded-[2rem] shadow-2xl uppercase tracking-widest">
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "НАШРИ ЭЪЛОН"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
