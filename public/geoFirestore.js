// GeoFirestore utilities for location-based queries
class GeoFirestore {
  constructor() {
    this.db = window.db;
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Query users within a certain radius
  async queryUsersWithinRadius(centerLat, centerLng, radiusKm, bloodType = null) {
    try {
      let query = this.db.collection('users');
      
      if (bloodType) {
        query = query.where('blood_type', '==', bloodType);
      }

      const snapshot = await query.get();
      const users = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.location && userData.location.lat && userData.location.lng) {
          const distance = this.calculateDistance(
            centerLat, 
            centerLng, 
            userData.location.lat, 
            userData.location.lng
          );
          
          if (distance <= radiusKm) {
            users.push({
              id: doc.id,
              ...userData,
              distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
            });
          }
        }
      });

      // Sort by distance
      users.sort((a, b) => a.distance - b.distance);
      return users;
    } catch (error) {
      console.error('Error querying users within radius:', error);
      throw error;
    }
  }

  // Query requests within a certain radius
  async queryRequestsWithinRadius(centerLat, centerLng, radiusKm, bloodType = null) {
    try {
      let query = this.db.collection('requests');
      
      if (bloodType) {
        query = query.where('blood_type', '==', bloodType);
      }

      const snapshot = await query.get();
      const requests = [];
      
      snapshot.forEach(doc => {
        const requestData = doc.data();
        if (requestData.location && requestData.location.lat && requestData.location.lng) {
          const distance = this.calculateDistance(
            centerLat, 
            centerLng, 
            requestData.location.lat, 
            requestData.location.lng
          );
          
          if (distance <= radiusKm) {
            requests.push({
              id: doc.id,
              ...requestData,
              distance: Math.round(distance * 10) / 10
            });
          }
        }
      });

      // Sort by urgency first, then by distance
      requests.sort((a, b) => {
        if (a.urgency === 'Urgent' && b.urgency !== 'Urgent') return -1;
        if (a.urgency !== 'Urgent' && b.urgency === 'Urgent') return 1;
        return a.distance - b.distance;
      });
      
      return requests;
    } catch (error) {
      console.error('Error querying requests within radius:', error);
      throw error;
    }
  }
}

// Initialize and export GeoFirestore
window.geoFirestore = new GeoFirestore(); 