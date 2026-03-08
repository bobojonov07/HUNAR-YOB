
"use client"

import { useMemo, useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, CheckCheck, Check, ChevronLeft, Loader2, CheckCircle2, Crown, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, query, where, orderBy, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Chat, UserProfile, Message } from "@/lib/storage";

interface Conversation extends Chat {
  otherParty: UserProfile | null;
  lastMessageFull?: Message | null;
}

export default function MessagesList() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const profilesCache = useRef<Record<string, UserProfile>>({});

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const clientChatsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "chats"),
      where("clientId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
  }, [db, user]);

  const artisanChatsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "chats"),
      where("artisanId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
  }, [db, user]);

  const { data: clientChats = [], loading: clientLoading } = useCollection<Chat>(clientChatsQuery as any);
  const { data: artisanChats = [], loading: artisanLoading } = useCollection<Chat>(artisanChatsQuery as any);

  useEffect(() => {
    async function fetchConversationDetails() {
      if (!user || clientLoading || artisanLoading) return;

      const allChatsMap = new Map<string, Chat>();
      [...clientChats, ...artisanChats].forEach(chat => {
        if (!chat.deletedBy?.includes(user.uid)) {
          allChatsMap.set(chat.id, chat);
        }
      });
      
      const sortedChats = Array.from(allChatsMap.values()).sort((a, b) => {
        const timeA = a.updatedAt?.toMillis() || 0;
        const timeB = b.updatedAt?.toMillis() || 0;
        return timeB - timeA;
      });

      if (sortedChats.length === 0) {
        setConversations([]);
        setInitialLoading(false);
        return;
      }

      const results: Conversation[] = [];
      for (const chat of sortedChats) {
        const otherId = user.uid === chat.clientId ? chat.artisanId : chat.clientId;
        if (!otherId) continue;
        
        let otherProfile = profilesCache.current[otherId];
        if (!otherProfile) {
          const otherSnap = await getDoc(doc(db, "users", otherId));
          if (otherSnap.exists()) {
            otherProfile = { ...(otherSnap.data() as UserProfile), id: otherSnap.id };
            profilesCache.current[otherId] = otherProfile;
          }
        }
        
        // Fetch last message details for read status
        let lastMsgDetails = null;
        try {
          const msgQuery = query(
            collection(db, "chats", chat.id, "messages"),
            orderBy("createdAt", "desc"),
            where("senderId", "==", user.uid),
            limit(1)
          );
          const msgSnap = await getDocs(msgQuery);
          if (!msgSnap.empty) {
            lastMsgDetails = { ...msgSnap.docs[0].data(), id: msgSnap.docs[0].id } as Message;
          }
        } catch (e) {}

        results.push({
          ...chat,
          otherParty: otherProfile || null,
          lastMessageFull: lastMsgDetails
        });
      }
      
      setConversations(results);
      setInitialLoading(false);
    }

    fetchConversationDetails();
  }, [clientChats, artisanChats, user, db, clientLoading, artisanLoading]);

  const filteredConversations = useMemo(() => {
    if (!showUnreadOnly) return conversations;
    return conversations.filter(conv => (conv.unreadCount?.[user?.uid || ""] || 0) > 0);
  }, [conversations, showUnreadOnly, user]);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !db) return;
    
    if (!confirm("Оё мехоҳед ин чатро аз рӯйхати худ нест кунед?")) return;

    const chatRef = doc(db, "chats", chatId);
    updateDoc(chatRef, {
      deletedBy: arrayUnion(user.uid)
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: chatRef.path,
        operation: 'update',
        requestResourceData: { deletedBy: user.uid }
      }));
    });
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Вуруд лозим аст...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="w-fit hover:text-primary p-0 font-black">
              <ChevronLeft className="mr-2 h-5 w-5" />
              БОЗГАШТ
            </Button>
            <h1 className="text-3xl font-black text-secondary tracking-tighter uppercase">Паёмҳо</h1>
          </div>
          
          <Button 
            onClick={() => setShowUnreadOnly(!showUnreadOnly)} 
            variant={showUnreadOnly ? "default" : "outline"}
            className={cn(
              "rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest transition-all",
              showUnreadOnly ? "bg-primary shadow-xl scale-105" : "border-2"
            )}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showUnreadOnly ? "ҲАМАИ ЧАТҲО" : "ТАНҲО НОХОНДАҲО"}
          </Button>
        </div>

        {initialLoading ? (
          <div className="text-center py-20 opacity-50 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="font-black uppercase tracking-widest text-[10px]">Дар ҳоли боргузорӣ...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="space-y-3">
            {filteredConversations.map((conv) => (
              <div key={conv.id} className="relative group">
                <ConversationItem conv={conv} currentUser={user} />
                {profile?.isPremium && (
                  <button 
                    onClick={(e) => handleDeleteChat(e, conv.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-3 rounded-xl shadow-xl hover:scale-110 active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-muted shadow-inner">
            <MessageSquare className="h-16 w-16 mx-auto text-muted mb-4 opacity-30" />
            <p className="text-muted-foreground font-black text-lg uppercase tracking-widest opacity-40">
              {showUnreadOnly ? "ПАЁМИ НАВ НЕСТ" : "ҲОЛО ПАЁМ НАДОРЕД"}
            </p>
            <Button asChild variant="link" className="mt-4 font-black text-primary">
              <Link href="/listings">Ҷустуҷӯи устоҳо</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conv, currentUser }: { conv: Conversation, currentUser: any }) {
  const formattedTime = useMemo(() => {
    if (!conv.updatedAt) return "";
    try {
      const date = conv.updatedAt.toDate();
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch (e) {
      return "";
    }
  }, [conv.updatedAt]);

  const chatLink = `/chat/${conv.listingId}?client=${conv.clientId}`;

  return (
    <Link href={chatLink}>
      <Card className="hover:bg-muted/30 transition-all duration-200 cursor-pointer border shadow-sm rounded-xl bg-white group">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-14 w-14 border shadow-sm shrink-0">
            <AvatarImage src={conv.otherParty?.profileImage} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
              {conv.otherParty?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pr-10">
            <div className="flex justify-between items-center mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-black text-secondary text-base truncate">
                  {conv.otherParty?.name || "Корбар"}
                </h3>
                {conv.otherParty?.identificationStatus === 'Verified' && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                {conv.otherParty?.isPremium && <Crown className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
              </div>
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest shrink-0">
                {formattedTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {conv.lastSenderId === currentUser.uid && (
                <div className="shrink-0">
                  {conv.lastMessageFull?.isRead ? (
                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                  )}
                </div>
              )}
              <p className={cn(
                "text-xs truncate font-medium text-muted-foreground",
                (conv.unreadCount?.[currentUser.uid] || 0) > 0 && "font-black text-secondary"
              )}>
                {conv.lastMessage}
              </p>
            </div>
          </div>
          {(conv.unreadCount?.[currentUser.uid] || 0) > 0 && (
            <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-[9px] text-white font-black shrink-0">
              {conv.unreadCount[currentUser.uid]}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
