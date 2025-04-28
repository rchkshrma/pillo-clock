import { useEffect } from "react";

const token = localStorage.getItem('token');
const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

const PUBLIC_VAPID_KEY = "BFUvcqFb-BmwKm7Bwu96koFg1jhHYePwPGBGM3TXHTopfdM3vcr8xMwasZXlG_lgxAWU8L37o7736ksoJ5owkUY"; //

export function usePushNotifications() {
    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            navigator.serviceWorker.register("/sw.js")
                .then(registration => {
                    console.log("Service Worker registered:", registration);
                    subscribeUser(registration);
                })
                .catch(error => console.error("Service Worker registration failed:", error));
        }
    }, []);
}

export async function unsub() {
    try{
        await fetch("http://localhost:3001/deletesub", {method: 'DELETE', headers: authHeaders});
        alert("Successfully unsubscribed from push notifications!");
    } catch (error) {
        console.error("error unsubscribing user: ", error);
        alert("Failed to unsubscribe from push notifications.");
    }
}

// async function subscribeUser(registration) {
//     try {
//         const permission = await Notification.requestPermission();
//         if (permission !== "granted") {
//             console.warn("Push notifications permission denied.");
//             return;
//         }

//         const existingSubscription = await registration.pushManager.getSubscription();
//         if (existingSubscription) {
//             console.log("Already subscribed to push notifications.");
//             return;
//         } /////// instead check here if user id is already subscribed, if not add sub, if yes replace existing one.
//         const existingSub = await fetch('http://localhost:3001/subscription',{ method: 'GET', headers: authHeaders });
//         if(existingSub){
//             unsub();
//         }

//         const subscription = await registration.pushManager.subscribe({
//             userVisibleOnly: true,
//             applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
//         });

//         await fetch("http://localhost:3001/subscribe", {
//             method: "POST",
//             headers: authHeaders,//{ "Content-Type": "application/json" },
//             body: JSON.stringify(subscription)
//         });

//         // console.log("Push subscription saved.");
//     } catch (error) {
//         console.error("Error subscribing to push notifications:", error);
//     }
// }

async function subscribeUser(registration) {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            alert("Push notifications permission denied.");
            return;
        }

        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            await existingSubscription.unsubscribe();
            console.log("Old browser subscription removed.");
        }

        const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });
        await fetch("http://localhost:3001/subscribe", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(newSubscription)
        });

        alert("Successfully subscribed to push notifications!");
    } catch (error) {
        console.error("Error handling push subscription:", error);
        alert("Failed to subscribe to push notifications.");
    }
}


function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}
