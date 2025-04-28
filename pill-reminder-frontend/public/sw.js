self.addEventListener("push", event => {
    const data = event.data ? event.data.json() : {};
    self.registration.showNotification(data.title, {
        body: data.body,
        // icon: "/icon.png", // Replace with your app icon
        // badge: "/badge.png",
        vibrate: [100, 50, 100]
    });
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(clients.openWindow("/")); 
});
