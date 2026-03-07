
"use client"

import { useUser, useAuth, useFirestore, useDoc } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hammer, LogOut, Heart, LogIn, UserPlus, Menu, Info, Search, MessageSquare, User, Home, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useMemo } from "react";
import { doc } from "firebase/firestore";
import { UserProfile } from "@/lib/storage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef as any);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const menuItems = [
    { label: "Асосӣ", icon: Home, href: "/" },
    { label: "Эълонҳо", icon: Search, href: "/listings" },
    { label: "Паёмҳо", icon: MessageSquare, href: "/messages", authRequired: true },
    { label: "Писандидаҳо", icon: Heart, href: "/favorites", authRequired: true },
    { label: "Профил", icon: User, href: "/profile", authRequired: true },
    { label: "Оиди мо", icon: Info, href: "/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                <Menu className="h-6 w-6 text-secondary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col rounded-r-[2rem] p-0 overflow-hidden border-none shadow-3xl bg-white w-80">
              <SheetHeader className="p-8 bg-secondary text-white shrink-0">
                <SheetTitle className="text-3xl font-black font-headline tracking-tighter text-white flex items-center gap-3">
                  <Hammer className="h-8 w-8 text-primary fill-primary/20" />
                  KORYOB 2
                </SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Амнияти 100% кафолат</p>
                </div>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {menuItems.map((item) => {
                  if (item.authRequired && !user) return null;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted transition-all group">
                        <item.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-black text-secondary text-sm tracking-tight">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}

                {!user && (
                  <>
                    <Link href="/login">
                      <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/5 transition-all group">
                        <LogIn className="h-5 w-5 text-primary" />
                        <span className="font-black text-secondary text-sm tracking-tight uppercase">Воридшавӣ</span>
                      </div>
                    </Link>
                    <Link href="/register">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/10 transition-all group">
                        <UserPlus className="h-5 w-5 text-primary" />
                        <span className="font-black text-primary text-sm tracking-tight uppercase">Сабти ном</span>
                      </div>
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-auto p-8 border-t bg-muted/5">
                {user && (
                  <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 mb-4 rounded-2xl hover:bg-red-50 transition-all group text-red-500">
                    <LogOut className="h-5 w-5" />
                    <span className="font-black text-sm tracking-tight uppercase">Баромад</span>
                  </button>
                )}
                <div className="p-5 bg-white rounded-3xl border-2 border-dashed border-primary/20 text-center shadow-sm">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Version 1.0.0 (2026)</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">ТАҲИЯШУДА ТАВАССУТИ TAJ.WEB</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black font-headline tracking-tighter text-secondary uppercase">KORYOB 2</span>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild className="text-secondary hover:text-primary rounded-full hidden sm:flex">
                <Link href="/favorites">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
              <Link href="/profile" className="hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-lg">
                  <AvatarImage src={profile?.profileImage || user.photoURL || ""} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white font-black text-xs">
                    {profile?.name?.charAt(0) || user.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="flex text-secondary font-black uppercase tracking-widest text-[10px] hover:text-primary">
                <Link href="/login">Воридшавӣ</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary text-white hover:bg-primary/90 font-black rounded-xl px-5 h-10 uppercase tracking-widest text-[10px] shadow-lg hidden xs:flex">
                <Link href="/register">Сабти ном</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
