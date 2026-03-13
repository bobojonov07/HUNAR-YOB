
"use client"

import { useUser, useAuth, useFirestore, useDoc, useCollection } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hammer, LogOut, Heart, LogIn, UserPlus, Menu, Info, Search, MessageSquare, User, Home, ShieldCheck, Crown, Globe, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useMemo } from "react";
import { doc, collection, query, where } from "firebase/firestore";
import { UserProfile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { t, lang, changeLanguage } = useTranslation();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  // Ҳисоб кардани паёмҳои хонданашуда барои Navbar
  const clientChatsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "chats"), where("clientId", "==", user.uid));
  }, [db, user]);

  const artisanChatsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "chats"), where("artisanId", "==", user.uid));
  }, [db, user]);

  const { data: clientChats = [] } = useCollection(clientChatsQuery as any);
  const { data: artisanChats = [] } = useCollection(artisanChatsQuery as any);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    const allChats = [...clientChats, ...artisanChats];
    const uniqueChatIds = new Set();
    const uniqueChats = allChats.filter(chat => {
      if (uniqueChatIds.has(chat.id)) return false;
      uniqueChatIds.add(chat.id);
      return true;
    });

    return uniqueChats.reduce((sum, chat: any) => {
      return sum + (chat.unreadCount?.[user.uid] || 0);
    }, 0);
  }, [clientChats, artisanChats, user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const menuItems = [
    { label: t.nav.home, icon: Home, href: "/" },
    { label: t.nav.listings, icon: Search, href: "/listings" },
    { label: t.nav.messages, icon: MessageSquare, href: "/messages", authRequired: true, badge: unreadCount },
    { label: t.nav.favorites, icon: Heart, href: "/favorites", authRequired: true },
    { label: t.nav.profile, icon: User, href: "/profile", authRequired: true },
    { label: t.nav.about, icon: Info, href: "/about" },
  ];

  const isUsto = profile?.role === 'Usto';

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 relative">
                <Menu className="h-6 w-6 text-secondary" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col rounded-r-[2rem] p-0 overflow-hidden border-none shadow-3xl bg-white w-80">
              <SheetHeader className="p-8 bg-secondary text-white shrink-0">
                <SheetTitle className="text-3xl font-black font-headline tracking-tighter text-white flex items-center gap-3">
                  <Hammer className="h-8 w-8 text-primary fill-primary/20" />
                  HUNAR-YOB
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {isUsto && (
                  <Link href="/create-listing">
                    <div className="flex items-center gap-4 p-4 mb-2 rounded-2xl bg-primary/10 border-2 border-dashed border-primary/30 transition-all hover:bg-primary/20 group">
                      <PlusCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-black text-primary text-sm tracking-tight uppercase">Нашри эълон</span>
                    </div>
                  </Link>
                )}

                {menuItems.map((item) => {
                  if (item.authRequired && !user) return null;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted transition-all group">
                        <div className="flex items-center gap-4">
                          <item.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                          <span className="font-black text-secondary text-sm tracking-tight">{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse shadow-md">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}

                {!user && (
                  <>
                    <Link href="/login">
                      <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/5 transition-all group">
                        <LogIn className="h-5 w-5 text-primary" />
                        <span className="font-black text-secondary text-sm tracking-tight uppercase">{t.nav.login}</span>
                      </div>
                    </Link>
                    <Link href="/register">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/10 transition-all group">
                        <UserPlus className="h-5 w-5 text-primary" />
                        <span className="font-black text-primary text-sm tracking-tight uppercase">{t.nav.register}</span>
                      </div>
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-auto p-8 border-t bg-muted/5">
                <div className="flex gap-2 mb-4">
                  <Button onClick={() => changeLanguage('tj')} variant={lang === 'tj' ? 'default' : 'outline'} size="sm" className="flex-1 rounded-xl">TJ</Button>
                  <Button onClick={() => changeLanguage('ru')} variant={lang === 'ru' ? 'default' : 'outline'} size="sm" className="flex-1 rounded-xl">RU</Button>
                  <Button onClick={() => changeLanguage('en')} variant={lang === 'en' ? 'default' : 'outline'} size="sm" className="flex-1 rounded-xl">EN</Button>
                </div>
                {user && (
                  <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 mb-4 rounded-2xl hover:bg-red-50 transition-all group text-red-500">
                    <LogOut className="h-5 w-5" />
                    <span className="font-black text-sm tracking-tight uppercase">{t.nav.logout}</span>
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black font-headline tracking-tighter text-secondary uppercase">HUNAR-YOB</span>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl">
              <DropdownMenuItem onClick={() => changeLanguage('tj')} className="font-black">TJ - Тоҷикӣ</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('ru')} className="font-black">RU - Русский</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')} className="font-black">EN - English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <Link href="/profile" className="hover:opacity-80 transition-opacity relative">
              <Avatar className={cn(
                "h-10 w-10 border-2 shadow-lg",
                profile?.isPremium ? "border-yellow-400" : "border-primary/20"
              )}>
                <AvatarImage src={profile?.profileImage} className="object-cover" />
                <AvatarFallback className="bg-primary text-white font-black text-xs">
                  {profile?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-md animate-pulse">
                  <span className="text-[8px] text-white font-black">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </span>
              )}
            </Link>
          ) : (
            <Button size="sm" asChild className="bg-primary text-white font-black rounded-xl px-5 h-10 uppercase tracking-widest text-[10px] shadow-lg">
              <Link href="/login">{t.nav.login}</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
