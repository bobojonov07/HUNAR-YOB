
"use client"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, User as UserIcon, Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export function BottomNav() {
  const { user: currentUser, loading } = useUser();
  const db = useFirestore();
  const pathname = usePathname();

  // Ҷустуҷӯи чатҳое, ки корбар дар онҳо ҳамчун мизоҷ аст
  const clientChatsQuery = useMemo(() => {
    if (!db || !currentUser) return null;
    return query(collection(db, "chats"), where("clientId", "==", currentUser.uid));
  }, [db, currentUser]);

  // Ҷустуҷӯи чатҳое, ки корбар дар онҳо ҳамчун усто аст
  const artisanChatsQuery = useMemo(() => {
    if (!db || !currentUser) return null;
    return query(collection(db, "chats"), where("artisanId", "==", currentUser.uid));
  }, [db, currentUser]);

  const { data: clientChats = [] } = useCollection(clientChatsQuery as any);
  const { data: artisanChats = [] } = useCollection(artisanChatsQuery as any);

  // Ҳисоб кардани шумораи умумии паёмҳои хонданашуда
  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    const allChats = [...clientChats, ...artisanChats];
    const uniqueChatIds = new Set();
    const uniqueChats = allChats.filter(chat => {
      if (uniqueChatIds.has(chat.id)) return false;
      uniqueChatIds.add(chat.id);
      return true;
    });

    return uniqueChats.reduce((sum, chat: any) => {
      return sum + (chat.unreadCount?.[currentUser.uid] || 0);
    }, 0);
  }, [clientChats, artisanChats, currentUser]);

  if (loading || !currentUser) return null;

  const navItems = [
    { label: "Асосӣ", icon: Home, href: "/" },
    { label: "Эълонҳо", icon: Search, href: "/listings" },
    { label: "Паёмҳо", icon: MessageSquare, href: "/messages", hasBadge: unreadCount > 0 },
    { label: "Профил", icon: UserIcon, href: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-4 h-16 flex items-center justify-around md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 transition-colors relative",
              isActive ? "text-primary" : "text-muted-foreground hover:text-secondary"
            )}
          >
            <item.icon className={cn("h-6 w-6", isActive && "fill-primary/10")} />
            {item.hasBadge && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-[9px] text-white font-black leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </span>
            )}
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
