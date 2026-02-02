export function DashboardFooter({ text }: { text: string }) {
  return (
    <footer className="relative z-10 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {text}
        </p>
      </div>
    </footer>
  );
}
