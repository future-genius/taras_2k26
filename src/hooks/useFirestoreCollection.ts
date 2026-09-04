/**
 * TARAS 2K26 — Phase 9
 * useFirestoreCollection — real-time Firestore collection listener
 *
 * Usage:
 *   const { data, loading, error } = useFirestoreCollection('participants');
 *
 * Returns live-updating data via Firestore onSnapshot.
 * Unsubscribes automatically on component unmount.
 */

import { useEffect, useState, useRef } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

interface UseFirestoreCollectionOptions {
  orderByField?: string;
  orderByDirection?: 'asc' | 'desc';
  limitTo?: number;
  whereField?: string;
  whereValue?: unknown;
}

interface UseFirestoreCollectionResult<T = Record<string, unknown>> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useFirestoreCollection<T = Record<string, unknown>>(
  collectionName: string,
  options: UseFirestoreCollectionOptions = {}
): UseFirestoreCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize options to detect changes without reference equality issues
  const optionsKey = JSON.stringify(options);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const constraints: QueryConstraint[] = [];

    if (options.whereField && options.whereValue !== undefined) {
      constraints.push(where(options.whereField, '==', options.whereValue));
    }

    if (options.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderByDirection ?? 'desc'));
    }

    if (options.limitTo && options.limitTo > 0) {
      constraints.push(limit(options.limitTo));
    }

    const q =
      constraints.length > 0
        ? query(collection(firestore, collectionName), ...constraints)
        : query(collection(firestore, collectionName));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(`useFirestoreCollection [${collectionName}]:`, err);
        setError(err.message || 'Firestore listener error');
        setLoading(false);
      }
    );

    unsubRef.current = unsub;

    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, optionsKey]);

  return { data, loading, error };
}
