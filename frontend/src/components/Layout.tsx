import { Sidebar } from './Sidebar';
import { Hero } from './Hero';
import { ThemeSelector } from './ThemeSelector';

export function Layout() {
  return (
    <div className="flex h-full min-h-screen w-full">
      <Sidebar />
      <Hero />
      {/* Theme selector — fixed top-right, always on top */}
      <div className="fixed right-4 top-4 z-[10000]">
        <ThemeSelector />
      </div>
    </div>
  );
}
