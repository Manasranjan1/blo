// Notifications module for Firebase Cloud Messaging
class Notifications {
  constructor() {
    this.messaging = window.messaging;
    this.db = window.db;
    this.auth = window.auth;
    this.setupMessaging();
  }

  // Setup Firebase Cloud Messaging
  async setupMessaging() {
    try {
      // Request permission for notifications
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        
        // Get FCM token
        const token = await this.messaging.getToken();
        if (token) {
          console.log('FCM Token:', token);
          await this.saveTokenToDatabase(token);
        }

        // Handle token refresh
        this.messaging.onTokenRefresh(() => {
          this.messaging.getToken().then((refreshedToken) => {
            console.log('Token refreshed:', refreshedToken);
            this.saveTokenToDatabase(refreshedToken);
          });
        });

        // Handle foreground messages
        this.messaging.onMessage((payload) => {
          console.log('Message received:', payload);
          this.showNotification(payload.notification.title, payload.notification.body);
        });
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error setting up messaging:', error);
    }
  }

  // Save FCM token to user's profile
  async saveTokenToDatabase(token) {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await this.db.collection('users').doc(user.uid).update({
          fcm_token: token,
          token_updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('FCM token saved to database');
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  // Show browser notification
  showNotification(title, body) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  // Send push notification to specific user
  async sendPushNotification(userId, title, body, data = {}) {
    try {
      // Get user's FCM token
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      if (!userData.fcm_token) {
        console.log('User has no FCM token');
        return;
      }

      // Store notification in Firestore
      await this.db.collection('notifications').add({
        recipient_id: userId,
        title: title,
        message: body,
        data: data,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      });

      // TODO: Send actual FCM message using Firebase Functions
      // For now, we'll just log it
      console.log(`Push notification prepared for user ${userId}:`, {
        token: userData.fcm_token,
        title: title,
        body: body,
        data: data
      });

    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Get user's notifications
  async getUserNotifications() {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const snapshot = await this.db.collection('notifications')
        .where('recipient_id', '==', user.uid)
        .orderBy('created_at', 'desc')
        .limit(50)
        .get();

      const notifications = [];
      snapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      await this.db.collection('notifications').doc(notificationId).update({
        read: true
      });
      console.log(`Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const snapshot = await this.db.collection('notifications')
        .where('recipient_id', '==', user.uid)
        .where('read', '==', false)
        .get();

      const batch = this.db.batch();
      snapshot.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();

      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        return 0;
      }

      const snapshot = await this.db.collection('notifications')
        .where('recipient_id', '==', user.uid)
        .where('read', '==', false)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Update notification badge in UI
  updateNotificationBadge() {
    this.getUnreadCount().then(count => {
      const badge = document.getElementById('notification-badge');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
      }
    });
  }
}

// Initialize notifications module
window.notificationsModule = new Notifications(); 