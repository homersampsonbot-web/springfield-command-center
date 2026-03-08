'use client';

import dynamic from 'next/dynamic';

const TeamPage = dynamic(
  () => import('@/components/team/TeamPage'),
  { ssr: false }
);

export default function Team() {
  return <TeamPage />;
}
