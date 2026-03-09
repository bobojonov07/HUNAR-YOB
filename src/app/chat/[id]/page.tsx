
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
  Info,
  Trash2,
  Edit2,
  X
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
  deleteDoc,
  arrayUnion
} from "firebase/firestore";
import { Message, UserProfile, REGULAR_CHAR_LIMIT, PREMIUM_CHAR_LIMIT } from "@/lib/storage";
import { cn, hasProfanity } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

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

    if (editingMessage) {
      await updateDoc(doc(db, "chats", chatId, "messages", editingMessage.id), {
        text: newMessage,
        isEdited: true,
        updatedAt: serverTimestamp()
      });
      setEditingMessage(null);
      setNewMessage("");
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

  const handleDeleteForMe = async () => {
    if (!messageToDelete || !user || !chatId) return;
    const msgRef = doc(db, "chats", chatId, "messages", messageToDelete.id);
    await updateDoc(msgRef, {
      deletedBy: arrayUnion(user.uid)
    });
    setIsDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const handleDeleteForEveryone = async () => {
    if (!messageToDelete || !user || !chatId) return;
    const msgRef = doc(db, "chats", chatId, "messages", messageToDelete.id);
    await updateDoc(msgRef, {
      text: "Паём нест карда шуд",
      isDeleted: true,
      updatedAt: serverTimestamp()
    });
    setIsDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (authLoading || !profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  const isPremiumTheme = profile?.isPremium;

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
        </div>
        <div className="px-6 pb-3 space-y-1">
          <Progress value={charProgress} className="h-1" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.filter(m => !m.deletedBy?.includes(user?.uid || "")).map((msg) => {
          const isMe = msg.senderId === user?.uid;
          const canEdit = isMe && profile.isPremium && (Date.now() - (msg.createdAt?.toMillis() || 0)) < 10 * 60 * 1000 && !msg.isDeleted;

          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? 'items-end' : 'items-start')}>
              <div className={cn(
                "relative max-w-[85%] p-4 rounded-[2rem] shadow-xl group",
                isMe ? (isPremiumTheme ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-secondary" : "bg-primary text-white") : (isPremiumTheme ? "bg-white/5 text-white" : "bg-white text-secondary border")
              )}>
                <p className={cn("text-sm font-bold", msg.isDeleted && "italic opacity-50")}>{msg.text}</p>
                {msg.isEdited && !msg.isDeleted && <span className="text-[8px] opacity-50 ml-1">(таҳрир)</span>}
                
                {profile.isPremium && !msg.isDeleted && (
                  <div className="absolute -top-8 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg" onClick={() => { setEditingMessage(msg); setNewMessage(msg.text); }}><Edit2 className="h-3 w-3" /></Button>}
                    <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg" onClick={() => { setMessageToDelete(msg); setIsDeleteDialogOpen(true); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
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
        {editingMessage && (
          <div className="flex justify-between items-center mb-2 px-4 py-2 bg-muted/30 rounded-xl text-[10px] font-bold uppercase">
            <span>Таҳрири паём...</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingMessage(null); setNewMessage(""); }}><X className="h-3 w-3" /></Button>
          </div>
        )}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader><DialogTitle className="font-black uppercase text-center">Несткунии паём</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-4">
            <Button variant="outline" className="w-full rounded-xl h-12 font-bold" onClick={handleDeleteForMe}>БАРОИ ХУДАМ</Button>
            {messageToDelete?.senderId === user?.uid && (
              <Button variant="destructive" className="w-full rounded-xl h-12 font-bold" onClick={handleDeleteForEveryone}>БАРОИ ҲАМА</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
