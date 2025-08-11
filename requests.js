// Requests management module
class Requests {
  constructor() {
    this.db = window.db;
    this.auth = window.auth;
    this.geoFirestore = window.geoFirestore;
  }

  // Create a new blood request
  async createRequest(requestData) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const request = {
        requester_id: user.uid,
        blood_type: requestData.blood_type,
        urgency: requestData.urgency,
        location: requestData.location,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
      };

      const docRef = await this.db.collection('requests').add(request);
      console.log('Request created with ID:', docRef.id);

      // Find nearby donors and send notifications
      await this.notifyNearbyDonors(request);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  // Notify nearby donors about the request
  async notifyNearbyDonors(request) {
    try {
      const nearbyDonors = await this.geoFirestore.queryUsersWithinRadius(
        request.location.lat,
        request.location.lng,
        25, // 25 km radius
        request.blood_type
      );

      console.log(`Found ${nearbyDonors.length} nearby donors`);

      // Send push notifications to nearby donors
      for (const donor of nearbyDonors) {
        if (donor.id !== request.requester_id) {
          await this.sendDonorNotification(donor.id, request);
        }
      }
    } catch (error) {
      console.error('Error notifying nearby donors:', error);
    }
  }

  // Send notification to a specific donor
  async sendDonorNotification(donorId, request) {
    try {
      // Store notification in Firestore
      await this.db.collection('notifications').add({
        recipient_id: donorId,
        request_id: request.id,
        type: 'blood_request',
        title: `New ${request.urgency} Blood Request`,
        message: `${request.blood_type} blood needed within 25km`,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      });

      // TODO: Implement Firebase Cloud Messaging push notification
      console.log(`Notification sent to donor ${donorId}`);
    } catch (error) {
      console.error('Error sending donor notification:', error);
    }
  }

  // Get requests for a donor (nearby requests)
  async getDonorRequests() {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's location
      const userDoc = await this.db.collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      if (!userData.location) {
        throw new Error('User location not set');
      }

      // Get nearby requests
      const requests = await this.geoFirestore.queryRequestsWithinRadius(
        userData.location.lat,
        userData.location.lng,
        25 // 25 km radius
      );

      return requests;
    } catch (error) {
      console.error('Error getting donor requests:', error);
      throw error;
    }
  }

  // Get requests created by the current user
  async getUserRequests() {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const snapshot = await this.db.collection('requests')
        .where('requester_id', '==', user.uid)
        .orderBy('created_at', 'desc')
        .get();

      const requests = [];
      snapshot.forEach(doc => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return requests;
    } catch (error) {
      console.error('Error getting user requests:', error);
      throw error;
    }
  }

  // Respond to a blood request (accept/reject)
  async respondToRequest(requestId, response) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const responseData = {
        request_id: requestId,
        donor_id: user.uid,
        status: response, // 'accepted' or 'rejected'
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Add response to responses collection
      await this.db.collection('responses').add(responseData);

      // Update request status if accepted
      if (response === 'accepted') {
        await this.db.collection('requests').doc(requestId).update({
          status: 'accepted',
          donor_id: user.uid
        });

        // Notify requester
        await this.notifyRequester(requestId, 'accepted');
      }

      console.log(`Response ${response} recorded for request ${requestId}`);
      return true;
    } catch (error) {
      console.error('Error responding to request:', error);
      throw error;
    }
  }

  // Notify requester about donor response
  async notifyRequester(requestId, response) {
    try {
      const requestDoc = await this.db.collection('requests').doc(requestId).get();
      if (!requestDoc.exists) {
        return;
      }

      const requestData = requestDoc.data();
      
      // Store notification for requester
      await this.db.collection('notifications').add({
        recipient_id: requestData.requester_id,
        request_id: requestId,
        type: 'donor_response',
        title: 'Donor Response',
        message: `A donor has ${response} your blood request`,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      });

      console.log(`Requester notified about ${response} response`);
    } catch (error) {
      console.error('Error notifying requester:', error);
    }
  }

  // Get responses for a specific request
  async getRequestResponses(requestId) {
    try {
      const snapshot = await this.db.collection('responses')
        .where('request_id', '==', requestId)
        .orderBy('created_at', 'desc')
        .get();

      const responses = [];
      snapshot.forEach(doc => {
        responses.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return responses;
    } catch (error) {
      console.error('Error getting request responses:', error);
      throw error;
    }
  }

  // Delete a request (only by requester)
  async deleteRequest(requestId) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user is the requester
      const requestDoc = await this.db.collection('requests').doc(requestId).get();
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();
      if (requestData.requester_id !== user.uid) {
        throw new Error('Unauthorized to delete this request');
      }

      // Delete the request
      await this.db.collection('requests').doc(requestId).delete();
      
      // Delete related responses
      const responsesSnapshot = await this.db.collection('responses')
        .where('request_id', '==', requestId)
        .get();
      
      const batch = this.db.batch();
      responsesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      console.log(`Request ${requestId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  }
}

// Initialize requests module
window.requestsModule = new Requests(); 