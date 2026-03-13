
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { Chat } from '@/lib/storage';

export function NotificationHandler() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  const lastUnreadCounts = useRef<Record<string, number>>({});

  // 1. Мониторинги чатҳои фаъол барои огоҳии фаврӣ (Foreground)
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

          if (currentUnread > previousUnread && !pathname.includes(chat.id)) {
            toast({
              title: "Паёми нав",
              description: chat.lastMessage || "Шумо паёми нав доред",
            });
            
            // Намоиши огоҳии браузерӣ агар иҷозат бошад
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

  // 2. Танзими Firebase Messaging барои Push Notifications
  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // ИНҶО КАЛИДИ VAPID-РО АЗ FIREBASE CONSOLE ГУЗОРЕД
    const VAPID_KEY = 'BC_ИНҶО_КАЛИДИ_ХУДРО_ГУЗОРЕД'; 

    const setupMessaging = async () => {
      try {
        // Регистратсияи Service Worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker бо муваффақият сабт шуд');

        const messaging = getMessaging();
        
        // Дархости иҷозат
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
          });

          if (token) {
            console.log('FCM Token:', token);
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
          }
        }

        // Қабули паём ҳангоми кушода будани сайт
        onMessage(messaging, (payload) => {
          console.log('Паёми Foreground:', payload);
          if (!pathname.includes(payload.data?.chatId || '')) {
            toast({
              title: payload.notification?.title || "Паёми нав",
              description: payload.notification?.body || "Шумо паёми нав доред",
            });
          }
        });

      } catch (error) {
        console.error('Firebase Messaging хатогӣ:', error);
      }
    };

    setupMessaging();
  }, [user, db, toast, pathname]);

  return null;
}
