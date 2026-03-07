
"use client"

import { useMemo, useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, CheckCheck, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, doc, getDoc } from "firebase/firestore";
import { Chat, UserProfile } from "@/lib/storage";

interface Conversation extends Chat {
  otherParty: UserProfile | null;
}

export default function MessagesList() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const profilesCache = useRef<Record<string, UserProfile>>({});

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
      [...clientChats, ...artisanChats].forEach(chat => allChatsMap.set(chat.id, chat));
      
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
        
        let profile = profilesCache.current[otherId];
        if (!profile) {
          const otherSnap = await getDoc(doc(db, "users", otherId));
          if (otherSnap.exists()) {
            profile = { ...(otherSnap.data() as UserProfile), id: otherSnap.id };
            profilesCache.current[otherId] = profile;
          }
        }
        
        results.push({
          ...chat,
          otherParty: profile || null
        });
      }
      
      setConversations(results);
      setInitialLoading(false);
    }

    fetchConversationDetails();
  }, [clientChats, artisanChats, user, db, clientLoading, artisanLoading]);

  if (!user) return <div className="min-h-screen flex items-center justify-center">Вуруд лозим аст...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 flex flex-col gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="w-fit hover:text-primary p-0 font-black">
            <ChevronLeft className="mr-2 h-5 w-5" />
            БОЗГАШТ
          </Button>
          <h1 className="text-3xl font-black text-secondary tracking-tighter uppercase">Паёмҳо</h1>
        </div>

        {initialLoading ? (
          <div className="text-center py-20 opacity-50 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="font-black uppercase tracking-widest text-[10px]">Дар ҳоли боргузорӣ...</p>
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <ConversationItem key={conv.id} conv={conv} currentUser={user} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-muted shadow-inner">
            <MessageSquare className="h-16 w-16 mx-auto text-muted mb-4 opacity-30" />
            <p className="text-muted-foreground font-black text-lg uppercase tracking-widest opacity-40">ҲОЛО ПАЁМ НАДОРЕД</p>
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

  // Гузариш ба чат бо истифода аз listingId ва clientId барои муайян кардани chatId
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
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-black text-secondary text-base truncate">
                  {conv.otherParty?.name || "Корбар"}
                </h3>
                {conv.otherParty?.identificationStatus === 'Verified' && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest shrink-0">
                {formattedTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {conv.lastSenderId === currentUser.uid && (
                <CheckCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
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
