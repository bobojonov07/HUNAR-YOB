
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Send, ShieldCheck, ShieldAlert, CheckCircle2, Check, CheckCheck, MessageSquare, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, orderBy, setDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore";
import { Listing, Message, UserProfile } from "@/lib/storage";

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
  return date.toLocaleDateString();
}

export default function ChatPage() {
  const { id: listingId } = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetClientId = searchParams.get("client");
  
  const [newMessage, setNewMessage] = useState("");
  const [dealTitle, setDealTitle] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [dealDuration, setDealDuration] = useState("");
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);

  const listingRef = useMemo(() => listingId ? doc(db, "listings", listingId as string) : null, [db, listingId]);
  const { data: listing, loading: listingLoading } = useDoc<Listing>(listingRef as any);

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userProfileRef as any);

  const chatId = useMemo(() => {
    if (!listingId || !user) return null;
    const clientId = targetClientId || user.uid;
    return `${listingId}_${clientId}`;
  }, [listingId, user, targetClientId]);

  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!chatId || !user || !db) return;
    
    getDoc(doc(db, "chats", chatId)).then(snap => {
      if (snap.exists()) {
        const chatData = snap.data();
        const otherId = user.uid === chatData.clientId ? chatData.artisanId : chatData.clientId;
        if (otherId) {
          getDoc(doc(db, "users", otherId)).then(uSnap => {
            if (uSnap.exists()) setOtherParty(uSnap.data() as UserProfile);
          });
        }
      } else if (listing) {
        const otherId = user.uid === listing.userId ? targetClientId : listing.userId;
        if (otherId) {
          getDoc(doc(db, "users", otherId)).then(uSnap => {
            if (uSnap.exists()) setOtherParty(uSnap.data() as UserProfile);
          });
        }
      }
    });
  }, [db, chatId, user, listing, targetClientId]);

  const messagesQuery = useMemo(() => {
    if (!db || !chatId) return null;
    return query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
  }, [db, chatId]);
  const { data: messages = [], loading: messagesLoading } = useCollection<Message>(messagesQuery as any);

  const CHAR_LIMIT = 1000;
  const totalChars = useMemo(() => messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0), [messages]);
  const isLimitReached = totalChars >= CHAR_LIMIT;
  const charProgress = Math.min((totalChars / CHAR_LIMIT) * 100, 100);

  useEffect(() => {
    if (!chatId || !user || !db || messagesLoading) return;
    updateDoc(doc(db, "chats", chatId), { [`unreadCount.${user.uid}`]: 0 }).catch(() => {});
  }, [chatId, user, db, messagesLoading]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, type: 'text' | 'deal' = 'text', dealId?: string) => {
    if (e) e.preventDefault();
    if (type === 'text' && !newMessage.trim()) return;
    if (!user || !listingId || !profile || !chatId) return;

    if (type === 'deal' && profile.identificationStatus !== 'Verified') {
      toast({ 
        title: "Верификатсия лозим аст", 
        description: "Танҳо корбарони тасдиқшуда метавонанд шартнома банданд.", 
        variant: "destructive" 
      });
      return;
    }

    if (totalChars + (type === 'text' ? newMessage.length : 0) > CHAR_LIMIT) {
      toast({ title: "Лимит", description: "Лимити аломатҳо гузашт", variant: "destructive" });
      return;
    }

    const chatRef = doc(db, "chats", chatId);
    const msgRef = doc(collection(db, "chats", chatId, "messages"));
    const clientId = targetClientId || user.uid;
    const artisanId = listing?.userId || (chatId.split('_')[0] === listingId ? (otherParty?.id || "") : "");

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
      clientId: clientId,
      artisanId: artisanId || otherParty?.id || "",
      lastMessage: messageData.text,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherParty?.id || ""}`]: increment(1)
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

  const handleOpenDealDialog = () => {
    if (profile?.identificationStatus !== 'Verified') {
      toast({ 
        title: "Верификатсия лозим аст", 
        description: "Барои бастани шартнома аввал шахсияти худро тасдиқ кунед.", 
        variant: "destructive" 
      });
      return;
    }
    setIsDealDialogOpen(true);
  };

  const lastActiveText = useMemo(() => {
    if (!otherParty?.lastActive) return "Офлайн";
    try {
      const lastActive = otherParty.lastActive.toDate();
      const now = new Date();
      if ((now.getTime() - lastActive.getTime()) / 1000 / 60 < 5) return "Дар хат";
      return formatDistanceToNowTajik(lastActive);
    } catch (e) { return "Офлайн"; }
  }, [otherParty]);

  if (authLoading || listingLoading || profileLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />
      
      <div className="flex flex-col bg-white border-b shadow-sm sticky top-[64px] z-10">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={otherParty?.profileImage} className="object-cover" />
              <AvatarFallback className="bg-primary text-white font-black">{otherParty?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-secondary text-sm truncate max-w-[120px]">{otherParty?.name || "Корбар"}</h3>
                {otherParty?.identificationStatus === 'Verified' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="text-[9px] text-muted-foreground font-bold">{lastActiveText}</p>
            </div>
          </div>

          <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
            <Button size="sm" onClick={handleOpenDealDialog} className="bg-secondary text-white rounded-full font-black text-[10px]">ШАРТНОМА</Button>
            <DialogContent className="rounded-3xl p-8 max-w-sm">
              <DialogHeader><DialogTitle className="font-black uppercase tracking-tighter">ДАРХОСТИ КОР</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Номи кор</Label><Input placeholder="Масалан: Сохтани шкаф" value={dealTitle} onChange={e => setDealTitle(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Нарх (TJS)</Label><Input type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Мӯҳлат (рӯз)</Label><Input type="number" value={dealDuration} onChange={e => setDealDuration(e.target.value)} /></div>
                </div>
                <Button onClick={() => { handleSendMessage(undefined, 'deal'); setIsDealDialogOpen(false); }} className="w-full bg-primary h-12 font-black uppercase">ФИРИСТОДАН</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="px-4 pb-2 space-y-1">
          <div className="flex justify-between text-[8px] font-black uppercase">
            <span>Лимити аломатҳо</span>
            <span>{totalChars} / {CHAR_LIMIT}</span>
          </div>
          <Progress value={charProgress} className="h-1" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !messagesLoading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p className="font-black uppercase text-[10px]">Муколамаро оғоз кунед</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.senderId === user?.uid ? 'bg-primary text-white' : 'bg-white text-secondary border'}`}>
                <p className="text-sm font-medium">{msg.text}</p>
                <div className="flex justify-end mt-1 opacity-60 text-[8px] font-black">
                  {msg.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t">
        {!isLimitReached ? (
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2">
            <Input placeholder="Нависед..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="rounded-full h-11 px-6 flex-1" />
            <Button type="submit" size="icon" className="bg-primary rounded-full h-11 w-11 shrink-0"><Send className="h-5 w-5 text-white" /></Button>
          </form>
        ) : (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black text-center uppercase">Лимит ба охир расид</div>
        )}
      </div>
    </div>
  );
}
