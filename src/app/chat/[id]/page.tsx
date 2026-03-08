"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Send, ShieldCheck, CheckCircle2, MessageSquare, Loader2, Crown, Sparkles, AlertCircle, Flag } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, orderBy, setDoc, serverTimestamp, getDoc, updateDoc, increment, addDoc } from "firebase/firestore";
import { Listing, Message, UserProfile, REGULAR_CHAR_LIMIT, PREMIUM_CHAR_LIMIT } from "@/lib/storage";
import { cn, hasProfanity } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

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
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);

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

  const handleSendReport = async () => {
    if (!user || !otherParty || reportReason.length < 50 || reportReason.length > 100) return;
    setIsSendingReport(true);
    try {
      await addDoc(collection(db, "complaints"), {
        reportedUserId: otherParty.id,
        reporterUserId: user.uid,
        reason: reportReason,
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      toast({ title: "Шикоят қабул шуд", description: "Мо онро дар муддати кӯтоҳ баррасӣ мекунем." });
      setIsReportDialogOpen(false);
      setReportReason("");
    } catch (e) {
      toast({ title: "Хатогӣ", variant: "destructive" });
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, type: 'text' | 'deal' = 'text', dealId?: string) => {
    if (e) e.preventDefault();
    if (type === 'text' && !newMessage.trim()) return;
    if (!user || !listingId || !profile || !chatId) return;

    if (type === 'text') {
      // Manual Profanity Check
      if (hasProfanity(newMessage)) {
        const newWarningCount = (profile.warningCount || 0) + 1;
        await updateDoc(userProfileRef!, { 
          warningCount: increment(1),
          isBlocked: newWarningCount >= 5,
          identificationStatus: newWarningCount >= 5 ? 'Blocked' : profile.identificationStatus
        });
        toast({ 
          title: "Огоҳӣ!", 
          description: `Шумо калимаҳои қабеҳ истифода бурдед. Огоҳии шумо: ${newWarningCount}/5. Баъди 5 бор акаунтон БЛОК мешавад.`, 
          variant: "destructive" 
        });
        setNewMessage("");
        return;
      }
    }

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

    setDoc(chatRef, {
      id: chatId,
      listingId: listingId as string,
      clientId: clientId,
      artisanId: artisanId || "",
      lastMessage: messageData.text,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherParty?.id || ""}`]: increment(1)
    }, { merge: true });

    setDoc(msgRef, messageData).catch((err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: msgRef.path,
        operation: 'create',
        requestResourceData: messageData,
      }));
    });

    if (type === 'text') setNewMessage("");
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (authLoading || listingLoading || profileLoading) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  const isPremiumTheme = profile?.isPremium;

  return (
    <div className={cn("flex flex-col h-screen transition-colors duration-500", isPremiumTheme ? "bg-secondary" : "bg-background")}>
      <Navbar />
      
      <div className={cn("flex flex-col border-b shadow-lg sticky top-[64px] z-10", isPremiumTheme ? "bg-black/40 backdrop-blur-xl border-white/10" : "bg-white")}>
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
              <p className={cn("text-[10px] font-bold", isPremiumTheme ? "text-white/60" : "text-muted-foreground")}>{otherParty?.lastActive ? "Дар хат" : "Офлайн"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
              <Button variant="ghost" size="icon" onClick={() => setIsReportDialogOpen(true)} className="rounded-full text-red-500 hover:bg-red-50">
                <Flag className="h-5 w-5" />
              </Button>
              <DialogContent className="rounded-[2.5rem] p-10 max-w-sm">
                <DialogHeader><DialogTitle className="font-black uppercase text-center text-red-500">ШИКОЯТ (REPORT)</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Сабаби шикоят (50-100 аломат)</Label>
                    <Textarea 
                      placeholder="Сабабро нависед..." 
                      className="rounded-2xl bg-muted/20 border-muted p-4 min-h-[120px]" 
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                    />
                    <p className={cn("text-[9px] font-black text-right", (reportReason.length < 50 || reportReason.length > 100) ? "text-red-500" : "text-green-500")}>
                      {reportReason.length} / 50-100
                    </p>
                  </div>
                  <Button 
                    disabled={isSendingReport || reportReason.length < 50 || reportReason.length > 100} 
                    onClick={handleSendReport} 
                    className="w-full bg-red-500 h-14 rounded-2xl font-black uppercase text-xs"
                  >
                    {isSendingReport ? <Loader2 className="animate-spin h-5 w-5" /> : "ФИРИСТОДАНИ ШИКОЯТ"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
              <Button disabled={profile?.identificationStatus !== 'Verified'} size="sm" onClick={() => setIsDealDialogOpen(true)} className={cn("rounded-full font-black text-[10px] px-6 h-10 shadow-xl", isPremiumTheme ? "bg-yellow-500 text-secondary" : "bg-secondary text-white")}>ШАРТНОМА</Button>
              <DialogContent className="rounded-3xl p-8 max-w-sm">
                <DialogHeader><DialogTitle className="font-black uppercase">ДАРХОСТИ КОР</DialogTitle></DialogHeader>
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
            <span>Лимит {CHAR_LIMIT}</span>
            <span>{totalChars} / {CHAR_LIMIT}</span>
          </div>
          <Progress value={charProgress} className={cn("h-1.5", isPremiumTheme ? "bg-white/10 [&>div]:bg-yellow-500" : "")} />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={cn("flex flex-col group", isMe ? 'items-end' : 'items-start')}>
              <div className={cn(
                "relative max-w-[85%] p-4 rounded-[2rem] shadow-2xl transition-all",
                isMe 
                  ? (isPremiumTheme ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-secondary" : "bg-primary text-white") 
                  : (isPremiumTheme ? "bg-white/5 backdrop-blur-md text-white border border-white/10" : "bg-white text-secondary border")
              )}>
                <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                <span className="text-[8px] font-black uppercase opacity-60 block mt-2">
                  {msg.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn("p-6 border-t shadow-lg", isPremiumTheme ? "bg-black/40 border-white/10" : "bg-white")}>
        {!isLimitReached ? (
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-3 max-w-4xl mx-auto items-center">
            <Input 
              placeholder="Нависед..." 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              className={cn("rounded-full h-14 px-8 flex-1 font-bold", isPremiumTheme ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-muted/30 border-none")} 
            />
            <Button type="submit" size="icon" className={cn("rounded-full h-14 w-14 shadow-2xl", isPremiumTheme ? "bg-yellow-500" : "bg-primary")}>
              <Send className={cn("h-6 w-6", isPremiumTheme ? "text-secondary" : "text-white")} />
            </Button>
          </form>
        ) : (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest border border-red-500/20">
            ЛИМИТИ АЛОМАТҲО БА ОХИР РАСИД.
          </div>
        )}
      </div>
    </div>
  );
}
