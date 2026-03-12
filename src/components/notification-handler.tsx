
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, query, collection, where, onSnapshot } from 'firebase/firestore';
import { getToken, getMessaging, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { Chat } from '@/lib/storage';

export function NotificationHandler() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  const lastUnreadCounts = useRef<Record<string, number>>({});

  // Listen to all chats where the user is a participant
  useEffect(() => {
    if (!user || !db) return;

    const qClient = query(collection(db, "chats"), where("clientId", "==", user.uid));
    const qArtisan = query(collection(db, "chats"), where("artisanId", "==", user.uid));

    const handleChatUpdate = (snapshot: any) => {
      snapshot.docChanges().forEach((change: any) => {
        if (change.type === "modified") {
          const chat = { ...change.doc.data(), id: change.doc.id } as Chat;
          const currentUnread = chat.unreadCount?.[user.uid] || 0;
          const previousUnread = lastUnreadCounts.current[chat.id] || 0;

          // If unread count increased and we are NOT on this chat's page
          if (currentUnread > previousUnread && !pathname.includes(chat.id)) {
            toast({
              title: "Паёми нав",
              description: chat.lastMessage || "Шумо паёми нав доред",
            });
            
            // Trigger browser notification if permitted
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("HUNAR-YOB: Паёми нав", {
                body: chat.lastMessage,
                icon: "/favicon.ico"
              });
            }
          }
          lastUnreadCounts.current[chat.id] = currentUnread;
        } else if (change.type === "added") {
          const chat = change.doc.data() as Chat;
          lastUnreadCounts.current[change.doc.id] = chat.unreadCount?.[user.uid] || 0;
        }
      });
    };

    const unsubClient = onSnapshot(qClient, handleChatUpdate);
    const unsubArtisan = onSnapshot(qArtisan, handleChatUpdate);

    return () => {
      unsubClient();
      unsubArtisan();
    };
  }, [user, db, pathname, toast]);

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const VAPID_KEY = 'BPE_ВАПИД_КИ_ШУМО_АЗ_ФАЙРБЕЙС_МЕГИРЕД';

    const setupMessaging = async () => {
      if (VAPID_KEY.includes('ВАПИД')) {
        return;
      }

      try {
        const messaging = getMessaging();
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY
          });

          if (token) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
          }
        }

        onMessage(messaging, (payload) => {
          if (!pathname.includes(payload.data?.chatId || '')) {
            toast({
              title: payload.notification?.title || "Паёми нав",
              description: payload.notification?.body || "Шумо паёми нав доред",
            });
          }
        });

      } catch (error) {
        console.error('Firebase Messaging setup failed:', error);
      }
    };

    setupMessaging();
  }, [user, db, toast, pathname]);

  return null;
}
