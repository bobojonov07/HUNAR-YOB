
"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Send, ShieldCheck, CheckCircle2, MessageSquare, Loader2, Crown, Sparkles, Phone, PhoneOff, Mic, MicOff, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, orderBy, setDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore";
import { Listing, Message, UserProfile, REGULAR_CHAR_LIMIT, PREMIUM_CHAR_LIMIT } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  
  // Audio Call States
  const [isCalling, setIsCalling] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

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

  const CHAR_LIMIT = (profile?.isPremium || otherParty?.isPremium) ? PREMIUM_CHAR_LIMIT : REGULAR_CHAR_LIMIT;
  const totalChars = useMemo(() => messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0), [messages]);
  const isLimitReached = totalChars >= CHAR_LIMIT;
  const charProgress = Math.min((totalChars / CHAR_LIMIT) * 100, 100);

  // Audio Call Logic
  const handleStartCall = async () => {
    if (!profile?.isPremium || !otherParty?.isPremium) {
      toast({ 
        title: "Маҳдудияти Premium", 
        description: "Аудио-занг танҳо байни корбарони Premium имконпазир аст.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setHasMicPermission(true);
      setIsCalling(true);
      toast({ title: "Занг оғоз шуд", description: `Дар ҳоли занг задан ба ${otherParty.name}...` });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setHasMicPermission(false);
      toast({
        variant: 'destructive',
        title: 'Хатогии микрофон',
        description: 'Лутфан иҷозати истифодаи микрофонро дар танзимоти браузер диҳед.',
      });
    }
  };

  const handleEndCall = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    setIsCalling(false);
    toast({ title: "Занг ба охир расид" });
  };

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

    if (totalChars + (type === 'text' ? newMessage.length : 0) > CHAR_LIMIT) {
      toast({ title: "Лимит", description: "Лимити аломатҳо гузашт", variant: "destructive" });
      return;
    }

    const chatRef = doc(db, "chats", chatId);
    const msgRef = doc(collection(db, "chats", chatId, "messages"));
    const clientId = targetClientId || user.uid;
    const artisanId = listing?.userId || otherParty?.id || "";

    const messageData = {
      id: msgRef.id,
      chatId,
      senderId: user.uid,
      senderName: profile.name,
      text: type === 'deal' ? "Дархости шартнома фиристода шуд" : newMessage,
      createdAt: serverTimestamp(),
      isRead: false,
      type,
      dealId: dealId || null,
      isPremiumSender: profile.isPremium || false
    };

    const chatUpdate = {
      id: chatId,
      listingId: listingId as string,
      clientId: clientId,
      artisanId: artisanId || "",
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
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  const isPremiumTheme = profile?.isPremium;
  const canAudioCall = profile?.isPremium && otherParty?.isPremium;

  return (
    <div className={cn("flex flex-col h-screen transition-colors duration-500", isPremiumTheme ? "bg-secondary" : "bg-background")}>
      <Navbar />
      
      <div className={cn(
        "flex flex-col border-b shadow-lg sticky top-[64px] z-10",
        isPremiumTheme ? "bg-black/40 backdrop-blur-xl border-white/10" : "bg-white"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className={cn("rounded-full shrink-0", isPremiumTheme ? "text-white" : "")}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Avatar className={cn("h-12 w-12 border-2 shrink-0", otherParty?.isPremium ? "border-yellow-400" : "border-muted")}>
              <AvatarImage src={otherParty?.profileImage} className="object-cover" />
              <AvatarFallback className="bg-primary text-white font-black">{otherParty?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className={cn("font-black text-base truncate", isPremiumTheme ? "text-white" : "text-secondary")}>
                  {otherParty?.name || "Корбар"}
                </h3>
                {otherParty?.identificationStatus === 'Verified' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                {otherParty?.isPremium && <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </div>
              <p className={cn("text-[10px] font-bold", isPremiumTheme ? "text-white/60" : "text-muted-foreground")}>{lastActiveText}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canAudioCall && (
              <Button 
                onClick={handleStartCall}
                size="icon" 
                className={cn(
                  "rounded-full h-10 w-10 shadow-xl transition-all hover:scale-110",
                  isPremiumTheme ? "bg-green-500 text-white" : "bg-secondary text-white"
                )}
              >
                <Phone className="h-5 w-5" />
              </Button>
            )}

            <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
              <Button size="sm" onClick={() => setIsDealDialogOpen(true)} className={cn(
                "rounded-full font-black text-[10px] px-6 h-10 shadow-xl transition-all hover:scale-105",
                isPremiumTheme ? "bg-yellow-500 text-secondary" : "bg-secondary text-white"
              )}>ШАРТНОМА</Button>
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
        </div>
        
        <div className="px-6 pb-3 space-y-1">
          <div className={cn("flex justify-between text-[9px] font-black uppercase tracking-widest", isPremiumTheme ? "text-yellow-400" : "text-muted-foreground")}>
            <span>Лимити аломатҳо {(profile?.isPremium || otherParty?.isPremium) && "★ PREMIUM LIMIT ★"}</span>
            <span>{totalChars} / {CHAR_LIMIT}</span>
          </div>
          <Progress value={charProgress} className={cn("h-1.5", isPremiumTheme ? "bg-white/10 [&>div]:bg-yellow-500" : "")} />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {isCalling && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="relative mb-8">
              <Avatar className="h-40 w-40 border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                <AvatarImage src={otherParty?.profileImage} className="object-cover" />
                <AvatarFallback className="text-4xl bg-primary text-white font-black">{otherParty?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 p-3 rounded-full animate-bounce">
                <Mic className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{otherParty?.name}</h2>
            <p className="text-green-500 font-bold uppercase tracking-widest text-sm animate-pulse">Дар ҳоли занг задан...</p>
            
            <div className="mt-20 flex gap-8">
              <Button 
                onClick={handleEndCall}
                className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 shadow-2xl transition-transform active:scale-90"
              >
                <PhoneOff className="h-8 w-8 text-white" />
              </Button>
            </div>
          </div>
        )}

        {hasMicPermission === false && (
          <Alert variant="destructive" className="rounded-3xl border-2 border-dashed">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Дастрасӣ ба микрофон лозим аст</AlertTitle>
            <AlertDescription>
              Барои истифодаи занги аудиоӣ, лутфан ба микрофон иҷозат диҳед.
            </AlertDescription>
          </Alert>
        )}

        {messages.length === 0 && !messagesLoading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
            <MessageSquare className={cn("h-20 w-20 mb-4", isPremiumTheme ? "text-white" : "")} />
            <p className={cn("font-black uppercase text-xs tracking-[0.3em]", isPremiumTheme ? "text-white" : "")}>Сӯҳбатро оғоз кунед</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={cn("flex flex-col group", isMe ? 'items-end' : 'items-start')}>
                <div className={cn(
                  "relative max-w-[85%] p-4 rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02]",
                  isMe 
                    ? (isPremiumTheme ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-secondary ring-4 ring-yellow-400/20" : "bg-primary text-white") 
                    : (isPremiumTheme ? "bg-white/5 backdrop-blur-md text-white border border-white/10" : "bg-white text-secondary border")
                )}>
                  <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                  
                  <div className="flex justify-between items-center mt-3 gap-4">
                    <span className="text-[8px] font-black uppercase opacity-60">
                      {msg.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={cn(
        "p-6 border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)]",
        isPremiumTheme ? "bg-black/40 border-white/10" : "bg-white"
      )}>
        {!isLimitReached ? (
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-3 max-w-4xl mx-auto items-center">
            <Input 
              placeholder="Нависед..." 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              className={cn(
                "rounded-full h-14 px-8 flex-1 text-base font-bold transition-all focus:ring-4",
                isPremiumTheme 
                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-yellow-400/20" 
                  : "bg-muted/30 border-none"
              )} 
            />
            <Button 
              type="submit" 
              size="icon" 
              className={cn(
                "rounded-full h-14 w-14 shadow-2xl transition-transform active:scale-90",
                isPremiumTheme ? "bg-yellow-500 hover:bg-yellow-400" : "bg-primary"
              )}
            >
              <Send className={cn("h-6 w-6", isPremiumTheme ? "text-secondary" : "text-white")} />
            </Button>
          </form>
        ) : (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest border border-red-500/20">
            Лимити аломатҳо ба охир расид. {(!profile?.isPremium && !otherParty?.isPremium) && "БАРОИ ИДОМА PREMIUM ГИРЕД!"}
          </div>
        )}
      </div>
    </div>
  );
}
