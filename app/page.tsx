import TaskManager from '@/components/TaskManager';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <TaskManager />
    </main>
  );
}