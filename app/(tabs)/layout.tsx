import { BottomNav } from '@/components/bottom-nav';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function TabsLayout({ children }: { children: React.ReactNode }): Promise<JSX.Element> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/onboarding');
  }

  return (
    <div className="px-4 py-4">
      {children}
      <BottomNav />
    </div>
  );
}
