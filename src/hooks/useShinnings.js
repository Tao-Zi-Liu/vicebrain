import { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';

const useShinnings = (user, currentView, sortBy) => {
  const db = getFirestore(); 
  const [shinnings, setShinnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const collectionPath = `users/${user.uid}/shinnings`;
      let statusFilter = 'active';
      if (currentView === 'trash') {
          statusFilter = 'trashed';
      } else if (currentView === 'archive') {
          statusFilter = 'archived';
      }

      // REMOVED: The orderBy clause is removed from the query to avoid the index requirement.
      const q = query(
        collection(db, collectionPath), 
        where("status", "==", statusFilter)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const shinningsData = [];
        querySnapshot.forEach((doc) => {
          shinningsData.push({ ...doc.data(), id: doc.id });
        });

        // ADDED: Sorting is now handled here, on the client-side.
        shinningsData.sort((a, b) => {
            const field = sortBy.field; // 'updatedAt', 'createdAt', or 'title'
            const direction = sortBy.direction === 'asc' ? 1 : -1;
    
            let valA = a[field];
            let valB = b[field];
    
            // Handle Firestore Timestamp objects by converting them to Dates for comparison
            if (valA && typeof valA.toDate === 'function') {
              valA = valA.toDate();
            }
            if (valB && typeof valB.toDate === 'function') {
              valB = valB.toDate();
            }
            
            // Comparison logic
            if (valA < valB) {
              return -1 * direction;
            }
            if (valA > valB) {
              return 1 * direction;
            }
            return 0;
        });


        setShinnings(shinningsData);
        setLoading(false);
      }, (error) => {
        console.error("Firestore snapshot error in useShinnings:", error);
        setLoading(false);
      });

      // Cleanup function
      return () => unsubscribe();
    }
  }, [user, currentView, sortBy]);

  return { shinnings, loading };
};

export default useShinnings;
