
"use client"

import { useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/storage';
import { Ban, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { NotificationHandler } from "@/components/notification-handler";
import { BottomNav } from "@/components/bottom-nav";

export function AppGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NotificationHandler />
      <UserGuardContent>
        <Heartbeat />
        <PremiumGuard />
        {children}
        <BottomNav />
      </UserGuardContent>
    </>
  );
}

function UserGuardContent({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userRef as any);

  useEffect(() => {
    if ((profile?.identificationStatus === 'Blocked' || profile?.isBlocked || (profile?.warningCount || 0) >= 5) && user) {
      const cleanupListings = async () => {
        const q = query(collection(db, "listings"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        snap.forEach((d) => deleteDoc(d.ref));
        
        if (!profile?.isBlocked && (profile?.warningCount || 0) >= 5) {
          updateDoc(userRef!, { isBlocked: true, identificationStatus: 'Blocked' }).catch(() => {});
        }
      };
      cleanupListings();
    }
  }, [profile, user, db, userRef]);

  if (profile?.identificationStatus === 'Blocked' || profile?.isBlocked || (profile?.warningCount || 0) >= 5) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="h-32 w-32 bg-red-100 rounded-[3rem] flex items-center justify-center mb-8 shadow-inner animate-bounce">
          <Ban className="h-16 w-16 text-red-600" />
        </div>
        <h1 className="text-4xl font-black text-secondary tracking-tighter uppercase mb-4">АКАУНТИ ШУМО БЛОК ШУД</h1>
        <div className="bg-red-50 p-8 rounded-[2rem] border-2 border-dashed border-red-200 max-w-md mb-8">
          <ShieldAlert className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm font-bold text-red-700 leading-relaxed uppercase">
            БО САБАБИ ВАЙРОН КАРДАНИ ҚОИДАҲОИ ПЛАТФОРМА, ИСТИФОДАИ КАЛИМАҲОИ ҚАБЕҲ ВА Ё ГИРИФТАНИ 5 ОГОҲӢ, АКАУНТИ ШУМО БАРОИ ҲАМЕША БЛОК ШУД.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-10 opacity-60">
          Тамоми эълонҳо ва паёмҳои шумо нест карда шуданд.
        </p>
        <Button onClick={() => signOut(auth)} className="bg-secondary h-16 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl">БАРОМАД</Button>
      </div>
    );
  }

  return <>{children}</>;
}

function PremiumGuard() {
  const { user } = useUser();
  const db = useFirestore();
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userRef as any);

  useEffect(() => {
    if (profile?.isPremium && profile.premiumExpiresAt) {
      const expiry = profile.premiumExpiresAt.toDate();
      if (expiry < new Date()) {
        updateDoc(userRef!, { 
          isPremium: false, 
          premiumExpiresAt: null 
        }).catch(() => {});
      }
    }
  }, [profile, userRef]);

  return null;
}

function Heartbeat() {
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    if (!user || !db) return;
    const updateStatus = () => {
      updateDoc(doc(db, "users", user.uid), {
        lastActive: serverTimestamp()
      }).catch(() => {});
    };
    updateStatus();
    const interval = setInterval(updateStatus, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, db]);

  return null;
}
