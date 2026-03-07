
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Send, ShieldCheck, ShieldAlert, CheckCircle2, Check, CheckCheck, MessageSquare, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, orderBy, setDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore";
import { Listing, Message, Deal, calculateFee, UserProfile } from "@/lib/storage";

function formatDistanceToNowTajik(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Ҳозир";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} дақиқа пеш`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} соат пеш`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} рӯз пеш`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} моҳ пеш`;
  return date.toLocaleDateString();
}

export default function ChatPage() {
  const { id: listingId } = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetClientId = searchParams.get("client") || (user?.uid || "");
  
  const [newMessage, setNewMessage] = useState("");
  const [dealTitle, setDealTitle] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [dealDuration, setDealDuration] = useState("");
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);

  const listingRef = useMemo(() => listingId ? doc(db, "listings", listingId as string) : null, [db, listingId]);
  const { data: listing } = useDoc<Listing>(listingRef as any);

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const chatId = useMemo(() => {
    if (!listing || !user) return null;
    const clientId = user.uid === listing.userId ? targetClientId : user.uid;
    return `${listingId}_${clientId}`;
  }, [listing, user, listingId, targetClientId]);

  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);
  useEffect(() => {
    if (!listing || !user || !chatId) return;
    const otherId = user.uid === listing.userId ? targetClientId : listing.userId;
    if (otherId) {
      getDoc(doc(db, "users", otherId)).then(snap => {
        if (snap.exists()) setOtherParty(snap.data() as UserProfile);
      });
    }
  }, [db, listing, user, chatId, targetClientId]);

  const messagesQuery = useMemo(() => {
    if (!db || !chatId) return null;
    return query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
  }, [db, chatId]);
  const { data: messages = [] } = useCollection<Message>(messagesQuery as any);

  // Calculate total characters used in this chat
  const CHAR_LIMIT = 1000;
  const totalChars = useMemo(() => {
    return messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0);
  }, [messages]);

  const isLimitReached = totalChars >= CHAR_LIMIT;
  const charProgress = (totalChars / CHAR_LIMIT) * 100;

  // Reset notifications on load and on new messages
  useEffect(() => {
    if (!chatId || !user || !db) return;
    
    const chatRef = doc(db, "chats", chatId);
    updateDoc(chatRef, {
      [`unreadCount.${user.uid}`]: 0
    }).catch(() => {});

    if (messages.length > 0) {
      messages.forEach(msg => {
        if (msg.senderId !== user.uid && !msg.isRead) {
          updateDoc(doc(db, "chats", chatId, "messages", msg.id), { isRead: true }).catch(() => {});
        }
      });
    }
  }, [chatId, user, messages.length, db]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, type: 'text' | 'deal' = 'text', dealId?: string) => {
    if (e) e.preventDefault();
    if (type === 'text' && !newMessage.trim()) return;
    if (!user || !listingId || !profile || !chatId || !listing) return;

    if (totalChars + (type === 'text' ? newMessage.length : 0) > CHAR_LIMIT) {
      toast({ 
        title: "Маҳдудият", 
        description: `Ҳадди аксар ${CHAR_LIMIT} аломат барои як муколама иҷозат аст.`, 
        variant: "destructive" 
      });
      return;
    }

    const chatRef = doc(db, "chats", chatId);
    const msgRef = doc(collection(db, "chats", chatId, "messages"));
    const otherId = user.uid === listing.userId ? targetClientId : listing.userId;
    
    const messageData = {
      id: msgRef.id,
      chatId,
      senderId: user.uid,
      senderName: profile.name,
      text: type === 'deal' ? "Дархости шартнома фиристода шуд" : newMessage,
      createdAt: serverTimestamp(),
      isRead: false,
      type,
      dealId: dealId || null
    };

    const chatUpdate = {
      id: chatId,
      listingId: listingId as string,
      clientId: user.uid === listing.userId ? targetClientId : user.uid,
      artisanId: listing.userId,
      lastMessage: messageData.text,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherId}`]: increment(1)
    };

    setDoc(chatRef, chatUpdate, { merge: true }).catch(() => {});
    setDoc(msgRef, messageData).catch((err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: msgRef.path,
        operation: 'create',
        requestResourceData: messageData,
      }));
    });

    if (type === 'text') setNewMessage("");
  };

  const handleCreateDeal = async () => {
    if (!user || !listing || !profile) return;
    const price = parseFloat(dealPrice);
    const duration = parseInt(dealDuration);
    if (!dealTitle || isNaN(price) || isNaN(duration)) {
      toast({ title: "Хатогӣ", description: "Майдонҳоро пур кунед", variant: "destructive" });
      return;
    }

    const fee = calculateFee(price);
    const dealRef = doc(collection(db, "deals"));
    const dealData: Deal = {
      id: dealRef.id,
      listingId: listing.id,
      clientId: user.uid === listing.userId ? targetClientId : user.uid,
      artisanId: listing.userId,
      title: dealTitle,
      price,
      fee,
      durationDays: duration,
      status: 'Pending',
      senderId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } as any;

    setDoc(dealRef, dealData)
      .then(() => {
        handleSendMessage(undefined, 'deal', dealRef.id);
        setIsDealDialogOpen(false);
        setDealTitle(""); setDealPrice(""); setDealDuration("");
        toast({ title: "Дархост фиристода шуд" });
      })
      .catch((err: any) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: dealRef.path,
          operation: 'create',
          requestResourceData: dealData,
        }));
      });
  };

  const lastActiveText = useMemo(() => {
    if (!otherParty?.lastActive) return "Офлайн";
    try {
      const lastActive = otherParty.lastActive.toDate();
      const now = new Date();
      const diffInMinutes = (now.getTime() - lastActive.getTime()) / 1000 / 60;
      
      if (diffInMinutes < 5) return "Дар хат";
      
      return formatDistanceToNowTajik(lastActive);
    } catch (e) {
      return "Чанд вақт пеш";
    }
  }, [otherParty]);

  const isOnline = lastActiveText === "Дар хат";

  if (!listing || !profile) return <div className="min-h-screen flex items-center justify-center">Боргузорӣ...</div>;

  const currentFee = dealPrice ? calculateFee(parseFloat(dealPrice)) : 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />
      
      {/* HEADER */}
      <div className="flex flex-col bg-white border-b shadow-sm sticky top-[64px] z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Avatar className="h-10 w-10 border shadow-sm">
              <AvatarImage src={otherParty?.profileImage} className="object-cover" />
              <AvatarFallback className="bg-primary text-white font-black">{otherParty?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-secondary truncate text-sm">{otherParty?.name || listing.userName}</h3>
                {otherParty?.identificationStatus === 'Verified' && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                <p className="text-[10px] text-muted-foreground font-bold">{lastActiveText}</p>
              </div>
            </div>
          </div>

          <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-secondary text-white rounded-full px-5 font-black text-xs">ШАРТНОМА</Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-3xl">
              {profile.identificationStatus !== 'Verified' ? (
                <div className="text-center space-y-6">
                  <ShieldAlert className="h-16 w-16 text-red-500 mx-auto" />
                  <h3 className="text-xl font-black uppercase tracking-tighter">ИДЕНТИФИКАТСИЯ ЛОЗИМ</h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">Барои бастани шартнома профили худро тасдиқ кунед.</p>
                  <Button asChild className="w-full bg-primary h-12 rounded-xl font-black"><Link href="/profile">ТАСДИҚ КАРДАН</Link></Button>
                </div>
              ) : (
                <>
                  <DialogHeader><DialogTitle className="text-2xl font-black text-secondary tracking-tighter">ДАРХОСТИ КОР</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Номи кор</Label><Input placeholder="Масалан: Сохтани шкаф" value={dealTitle} onChange={e => setDealTitle(e.target.value)} className="h-12 rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Нарх (TJS)</Label><Input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} className="h-12 rounded-xl" /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Муҳлат (рӯз)</Label><Input type="number" value={dealDuration} onChange={e => setDealDuration(e.target.value)} className="h-12 rounded-xl" /></div>
                    </div>
                    {currentFee > 0 && (
                      <div className="p-4 bg-primary/5 rounded-xl border-2 border-dashed border-primary/20">
                        <p className="text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-widest"><ShieldCheck className="h-4 w-4" /> КОМИССИЯИ АМНИЯТӢ: {currentFee} TJS</p>
                      </div>
                    )}
                    <Button onClick={handleCreateDeal} className="w-full bg-primary h-14 rounded-xl font-black uppercase shadow-xl transition-all hover:scale-[1.02]">ФИРИСТОДАН</Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Character Limit Indicator */}
        <div className="px-4 pb-2 space-y-1">
          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
            <span className={isLimitReached ? "text-red-500" : "text-muted-foreground"}>Лимити аломатҳо</span>
            <span className={isLimitReached ? "text-red-500" : "text-secondary"}>{totalChars} / {CHAR_LIMIT}</span>
          </div>
          <Progress value={charProgress} className={`h-1 ${isLimitReached ? "bg-red-200" : "bg-muted"}`} />
        </div>
      </div>

      {/* MESSAGES */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
            <MessageSquare className="h-16 w-16 mb-4" />
            <p className="font-black uppercase tracking-widest text-[10px]">Муколамаи махфӣ бо {otherParty?.name || "усто"}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-[1.25rem] shadow-sm relative ${
                msg.senderId === user.uid 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white text-secondary rounded-bl-none border border-border'
              }`}>
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 opacity-60 text-[8px] font-black ${
                  msg.senderId === user.uid ? 'text-white' : 'text-muted-foreground'
                }`}>
                  <span>{msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.senderId === user.uid && (
                    msg.isRead ? <CheckCheck className="h-2.5 w-2.5 text-blue-200" /> : <Check className="h-2.5 w-2.5" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* INPUT */}
      <div className="p-4 bg-white border-t sticky bottom-0">
        {isLimitReached ? (
          <div className="bg-red-50 p-4 rounded-2xl border border-red-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-[10px] font-black text-red-600 uppercase leading-relaxed">
              Лимити 1000 аломат барои ин муколама тамом шуд. Шумо дигар паём фиристода наметавонед.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2 max-w-5xl mx-auto">
            <Input 
              placeholder="Нависед..." 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              className="rounded-full h-12 font-bold bg-muted/20 border-muted px-6 flex-1" 
            />
            <Button 
              type="submit" 
              size="icon" 
              className="bg-primary hover:bg-primary/90 rounded-full h-12 w-12 shrink-0 shadow-lg"
            >
              <Send className="h-5 w-5 text-white" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
