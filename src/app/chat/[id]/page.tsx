
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  Send, 
  CheckCircle2, 
  Loader2, 
  Check, 
  CheckCheck,
  Scale,
  Star,
  Ban,
  AlertTriangle,
  Info
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { 
  doc, 
  collection, 
  query, 
  orderBy, 
  setDoc, 
  serverTimestamp, 
  getDoc, 
  updateDoc, 
  increment, 
  writeBatch,
  addDoc
} from "firebase/firestore";
import { Message, UserProfile, REGULAR_CHAR_LIMIT, PREMIUM_CHAR_LIMIT, Deal, Review } from "@/lib/storage";
import { cn, hasProfanity } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ChatPage() {
  const { id: listingId } = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetClientId = searchParams.get("client");
  
  const [newMessage, setNewMessage] = useState("");
  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);

  const listingRef = useMemo(() => listingId ? doc(db, "listings", listingId as string) : null, [db, listingId]);
  const { data: listing } = useDoc<any>(listingRef as any);

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const chatId = useMemo(() => {
    if (!listingId || !user) return null;
    const clientId = targetClientId || user.uid;
    return `${listingId}_${clientId}`;
  }, [listingId, user, targetClientId]);

  useEffect(() => {
    if (!chatId || !user || !db) return;
    getDoc(doc(db, "chats", chatId)).then(snap => {
      let otherId = "";
      if (snap.exists()) {
        const chatData = snap.data();
        otherId = user.uid === chatData.clientId ? chatData.artisanId : chatData.clientId;
      } else if (listing) {
        otherId = user.uid === listing.userId ? targetClientId! : listing.userId;
      }
      if (otherId) {
        getDoc(doc(db, "users", otherId)).then(uSnap => {
          if (uSnap.exists()) setOtherParty({ ...uSnap.data(), id: uSnap.id } as UserProfile);
        });
      }
    });
  }, [db, chatId, user, listing, targetClientId]);

  const messagesQuery = useMemo(() => {
    if (!db || !chatId) return null;
    return query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
  }, [db, chatId]);
  const { data: messages = [] } = useCollection<Message>(messagesQuery as any);

  useEffect(() => {
    if (!user || !chatId || messages.length === 0) return;
    const unreadMessages = messages.filter(m => m.senderId !== user.uid && !m.isRead);
    if (unreadMessages.length > 0) {
      const batch = writeBatch(db);
      unreadMessages.forEach(msg => {
        batch.update(doc(db, "chats", chatId, "messages", msg.id), { isRead: true });
      });
      batch.update(doc(db, "chats", chatId), { [`unreadCount.${user.uid}`]: 0 });
      batch.commit().catch(() => {});
    }
  }, [user, chatId, messages, db]);

  const isOnePremium = profile?.isPremium || otherParty?.isPremium;
  const CHAR_LIMIT = isOnePremium ? PREMIUM_CHAR_LIMIT : REGULAR_CHAR_LIMIT;
  const totalChars = useMemo(() => messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0), [messages]);
  const charProgress = Math.min((totalChars / CHAR_LIMIT) * 100, 100);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || !listingId || !profile || !chatId) return;

    if (hasProfanity(newMessage)) {
      const newWarningCount = (profile.warningCount || 0) + 1;
      await updateDoc(userProfileRef!, { 
        warningCount: increment(1),
        isBlocked: newWarningCount >= 5,
        identificationStatus: newWarningCount >= 5 ? 'Blocked' : profile.identificationStatus
      });
      toast({ title: "Огоҳӣ!", description: `Огоҳии шумо: ${newWarningCount}/5.`, variant: "destructive" });
      setNewMessage("");
      return;
    }

    if (totalChars + newMessage.length > CHAR_LIMIT) {
      toast({ title: "Лимит", description: "Лимити аломатҳо гузашт", variant: "destructive" });
      return;
    }

    const chatRef = doc(db, "chats", chatId);
    const msgRef = doc(collection(db, "chats", chatId, "messages"));
    const messageData = {
      id: msgRef.id,
      chatId,
      senderId: user.uid,
      senderName: profile.name,
      text: newMessage,
      createdAt: serverTimestamp(),
      isRead: false,
      type: 'text'
    };

    setDoc(chatRef, {
      id: chatId,
      listingId: listingId as string,
      clientId: targetClientId || user.uid,
      artisanId: listing?.userId || otherParty?.id || "",
      lastMessage: messageData.text,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherParty?.id || ""}`]: increment(1)
    }, { merge: true });

    setDoc(msgRef, messageData);
    setNewMessage("");
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (authLoading || !profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  const isPremiumTheme = profile?.isPremium;
  const isSameRole = profile.role === otherParty?.role;

  return (
    <div className={cn("flex flex-col h-screen", isPremiumTheme ? "bg-secondary" : "bg-background")}>
      <Navbar />
      
      <div className={cn("flex flex-col border-b shadow-lg sticky top-[64px] z-10", isPremiumTheme ? "bg-black/40 backdrop-blur-xl border-white/10" : "bg-white")}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className={cn("rounded-full", isPremiumTheme ? "text-white" : "")}><ChevronLeft className="h-6 w-6" /></Button>
            <Avatar className={cn("h-12 w-12 border-2", otherParty?.isPremium ? "border-yellow-400" : "border-muted")}>
              <AvatarImage src={otherParty?.profileImage} className="object-cover" />
              <AvatarFallback>{otherParty?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className={cn("font-black text-base truncate", isPremiumTheme ? "text-white" : "text-secondary")}>{otherParty?.name}</h3>
                {otherParty?.identificationStatus === 'Verified' && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <p className={cn("text-[10px] font-bold", isPremiumTheme ? "text-white/60" : "text-muted-foreground")}>{otherParty?.lastActive ? "Дар хат" : "Офлайн"}</p>
            </div>
          </div>
          <Button 
            disabled={profile?.identificationStatus !== 'Verified' || isSameRole} 
            size="sm" 
            onClick={() => {
              if (isSameRole) {
                toast({ title: "Хатогӣ", description: "Шартнома танҳо байни Мизоҷ ва Усто имконпазир аст.", variant: "destructive" });
                return;
              }
              router.push(`/create-deal/${listingId}?client=${targetClientId || user?.uid}`);
            }} 
            className="rounded-full font-black text-[10px] px-6 h-10 bg-secondary text-white shadow-xl hover:scale-105 transition-all"
          >
            ШАРТНОМА
          </Button>
        </div>
        {isSameRole && (
          <div className="bg-red-500/10 p-2 flex items-center justify-center gap-2">
            <Info className="h-3 w-3 text-red-500" />
            <p className="text-[8px] font-black text-red-500 uppercase">ШУМО ВА ҲАМСУҲБАТ ЯК НАҚШ (ROLE) ДОРИД. ШАРТНОМА МАНЪ АСТ.</p>
          </div>
        )}
        <div className="px-6 pb-3 space-y-1">
          <Progress value={charProgress} className="h-1" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? 'items-end' : 'items-start')}>
              <div className={cn(
                "relative max-w-[85%] p-4 rounded-[2rem] shadow-xl",
                isMe ? (isPremiumTheme ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-secondary" : "bg-primary text-white") : (isPremiumTheme ? "bg-white/5 text-white" : "bg-white text-secondary border")
              )}>
                {msg.type === 'deal' && msg.dealId ? (
                  <DealCard dealId={msg.dealId} isMe={isMe} />
                ) : (
                  <p className="text-sm font-bold">{msg.text}</p>
                )}
                <div className="flex justify-end mt-1">
                  <span className="text-[8px] opacity-60 mr-2">{msg.createdAt?.toDate()?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  {isMe && (msg.isRead ? <CheckCheck className="h-3.5 w-3.5 text-blue-400" /> : <Check className="h-3.5 w-3.5 opacity-60" />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn("p-6 border-t", isPremiumTheme ? "bg-black/40 border-white/10" : "bg-white")}>
        <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-3 max-w-4xl mx-auto items-center">
          <Input 
            placeholder="Нависед..." 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            className={cn("rounded-full h-14 px-8", isPremiumTheme ? "bg-white/5 border-white/10 text-white" : "bg-muted/30 border-none")} 
          />
          <Button type="submit" size="icon" className="rounded-full h-14 w-14 bg-primary"><Send className="h-6 w-6 text-white" /></Button>
        </form>
      </div>
    </div>
  );
}

function DealCard({ dealId, isMe }: { dealId: string, isMe: boolean }) {
  const db = useFirestore();
  const { user } = useUser();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: deal } = useDoc<Deal>(doc(db, "deals", dealId) as any);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (user) getDoc(doc(db, "users", user.uid)).then(s => s.exists() && setProfile(s.data() as any));
  }, [user, db]);

  if (!deal || !profile) return <Loader2 className="animate-spin h-5 w-5" />;

  const handleAction = async (status: 'Accepted' | 'Active' | 'Completed' | 'Cancelled') => {
    if (!deal || !profile || !user) return;
    const batch = writeBatch(db);

    if (status === 'Active') {
      if (profile.balance < deal.price) {
        toast({ title: t.deal.insufficient_balance, variant: "destructive" });
        return;
      }
      batch.update(doc(db, "users", user.uid), { balance: increment(-deal.price) });
      const transRef = doc(collection(db, "transactions"));
      batch.set(transRef, {
        userId: user.uid,
        amount: deal.price,
        type: 'DealPayment',
        status: 'Completed',
        description: `Сделка: ${deal.title}`,
        createdAt: serverTimestamp()
      });
      batch.update(doc(db, "deals", dealId), { status: 'Active', acceptedAt: serverTimestamp() });
    } else if (status === 'Cancelled') {
      if (cancelReason.length < 50) {
        toast({ title: "Ҳадди ақал 50 аломат нависед", variant: "destructive" });
        return;
      }
      batch.update(doc(db, "deals", dealId), { status: 'Cancelled', cancelReason });
      if (deal.status === 'Active') {
        const ustoRef = doc(db, "users", deal.artisanId);
        batch.update(ustoRef, { warningCount: increment(1) });
      }
      setIsCancelOpen(false);
    } else if (status === 'Completed') {
      if (rating === 0) {
        toast({ title: t.deal.rating_required, variant: "destructive" });
        return;
      }
      const reviewRef = doc(collection(db, "listings", deal.listingId, "reviews"));
      batch.set(reviewRef, {
        id: reviewRef.id,
        listingId: deal.listingId,
        dealId,
        userId: user.uid,
        userName: profile.name,
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      batch.update(doc(db, "deals", dealId), { status: 'Completed', completedAt: serverTimestamp(), reviewId: reviewRef.id });
      batch.update(doc(db, "users", deal.artisanId), { balance: increment(deal.price) });
      setIsReviewOpen(false);
    } else {
      batch.update(doc(db, "deals", dealId), { status });
    }

    await batch.commit();
    toast({ title: "Навсозӣ шуд" });
  };

  const isClient = profile.role === 'Client';
  const isArtisan = profile.role === 'Usto';

  return (
    <div className="space-y-4 min-w-[260px]">
      <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl">
        <Scale className="h-7 w-7 text-yellow-400" />
        <h4 className="font-black text-xs uppercase tracking-tight">{t.deal.title}</h4>
      </div>
      <div className="space-y-1">
        <h3 className="font-black text-sm uppercase">{deal.title}</h3>
        <p className="text-xl font-black text-yellow-400">{deal.price} TJS</p>
      </div>

      <Badge className="w-full justify-center h-8 rounded-lg font-black uppercase text-[9px] bg-black/20 text-white">
        {t.deal.status}: {deal.status}
      </Badge>

      <div className="space-y-2">
        {deal.status === 'Pending' && !isMe && (
          <Button onClick={() => handleAction('Accepted')} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black uppercase text-[10px] h-10 rounded-xl">{t.deal.accept}</Button>
        )}
        {deal.status === 'Accepted' && isClient && (
          <Button onClick={() => handleAction('Active')} className="w-full bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[10px] h-10 rounded-xl">{t.deal.pay}</Button>
        )}
        {deal.status === 'Active' && isArtisan && !deal.artisanFinished && (
          <Button onClick={() => updateDoc(doc(db, "deals", dealId), { artisanFinished: true })} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-black uppercase text-[10px] h-10 rounded-xl">{t.deal.finish}</Button>
        )}
        {deal.status === 'Active' && deal.artisanFinished && isClient && (
          <Button onClick={() => setIsReviewOpen(true)} className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] h-10 rounded-xl">{t.deal.complete_btn}</Button>
        )}
        {(deal.status === 'Pending' || deal.status === 'Accepted' || deal.status === 'Active') && (
          <Button variant="ghost" onClick={() => setIsCancelOpen(true)} className="w-full text-red-500 font-black uppercase text-[10px] h-10 rounded-xl">{t.deal.cancel_btn}</Button>
        )}
      </div>

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="rounded-3xl p-8">
          <DialogHeader><DialogTitle className="font-black uppercase text-red-500 flex items-center gap-2"><Ban /> {t.deal.cancel_btn}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea placeholder={t.deal.reason_placeholder} value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="min-h-[120px] rounded-2xl" />
            <p className="text-[9px] font-bold text-red-500 uppercase">ДИҚҚАТ: Бекоркунӣ ба рейтинги усто таъсири манфӣ мерасонад.</p>
            <Button onClick={() => handleAction('Cancelled')} className="w-full bg-red-500 font-black h-12 rounded-xl">ТАУДИҚИ БЕКОРКУНӢ</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="rounded-3xl p-8">
          <DialogHeader><DialogTitle className="font-black uppercase text-green-600">{t.deal.complete_btn}</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-4 text-center">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} onClick={() => setRating(s)} className={cn("h-8 w-8 cursor-pointer transition-all", rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted")} />
              ))}
            </div>
            <div className="bg-muted/30 p-4 rounded-2xl text-[10px] font-black uppercase opacity-60 flex items-center gap-2">
              <Info className="h-4 w-4" /> Шарҳи шумо дар саҳифаи эълон нишон дода мешавад.
            </div>
            <Textarea placeholder={t.deal.review_placeholder} value={comment} onChange={e => setComment(e.target.value)} className="min-h-[100px] rounded-2xl" />
            <Button onClick={() => handleAction('Completed')} className="w-full bg-green-600 font-black h-12 rounded-xl uppercase">ФИРИСТОДАНИ БАҲО</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
