import { useEffect, useRef } from 'react';

const VAPID_PUBLIC_KEY = 'BKWcIAr6bDO2XGPBhLX8TJWJU5DQhVkZCRHJFv6QjaBAT_4MWul7cYwp0CZSHrSJEMS_zKw4mNsfmpZQ7VegwMo';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription(
  send: (message: any) => void,
  isConnected: boolean,
  characterId: string | null,
) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || !characterId || subscribedRef.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const subscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        send({
          action: 'pushSubscribe',
          characterId,
          subscription: subscription.toJSON(),
        });

        subscribedRef.current = true;
        console.log('Push subscription sent to server');
      } catch (e) {
        console.warn('Push subscription failed:', e);
      }
    };

    subscribe();
  }, [isConnected, characterId, send]);
}
