'use client';
import { useRouter } from 'next/navigation';
import TripForm from '@/components/TripForm';
import PageHeader from '@/components/ui/PageHeader';

export default function NewTripPage() {
  const router = useRouter();
  return (
    <>
      <PageHeader title="New trip" subtitle="Create a trip, then add expenses to it" />
      <div className="card p-5">
        <TripForm onSaved={(t) => router.replace(`/trips/${t.id}`)} />
      </div>
    </>
  );
}
