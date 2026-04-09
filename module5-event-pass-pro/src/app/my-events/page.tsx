'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMyEvents } from '@/actions/eventActions';
import { EventCard } from '@/components/EventCard';
import type { Event } from '@/types/event';

export default function MyEventsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
      if (!loading && !user) {
        router.push('/auth');
      }
    }, [user, loading, router]);

    useEffect(() => {
      if (user) {
        getMyEvents(user.uid)
          .then(setEvents)
          .finally(() => setFetching(false));
      }
    }, [user]);

    if (loading || fetching) {
      return <div className="container py-8">Cargando...</div>;
    }

    return (
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Mis Eventos</h1>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No tienes eventos creados aún.</p>
            <a href="/events/new" className="text-primary underline">
              Crear mi primer evento
            </a>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <EventCard key={event.id} event={event} currentUserId={user?.uid} />
            ))}
          </div>
        )}
      </main>
    );
}