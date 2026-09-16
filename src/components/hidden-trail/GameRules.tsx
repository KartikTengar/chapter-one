export function GameRules() {
  return (
    <div className="bg-[var(--surface)]/20 border border-white/[0.06] rounded-2xl p-8">
<h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
        HOW IT WORKS
      </h2>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 items-center justify-center bg-[var(--accent)]/20 rounded-full">
            <span className="text-xs font-black text-[var(--accent)]">01</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[var(--foreground)]">SCAN THE MARKER</h3>
<p className="text-sm text-zinc-400">
               Find the QR code and scan it with your phone&rsquo;s camera to begin the challenge.
             </p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 items-center justify-center bg-[var(--accent)]/20 rounded-full">
            <span className="text-xs font-black text-[var(--accent)]">02</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[var(--foreground)]">SOLVE THE CLUE</h3>
            <p className="text-sm text-zinc-400">
              Answer the riddle correctly to complete the marker and earn points.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 items-center justify-center bg-[var(--accent)]/20 rounded-full">
            <span className="text-xs font-black text-[var(--accent)]">03</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[var(--foreground)]">FOLLOW THE TRAIL</h3>
            <p className="text-sm text-zinc-400">
              Use the location riddle to find the next marker and continue your journey.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 items-center justify-center bg-[var(--accent)]/20 rounded-full">
            <span className="text-xs font-black text-[var(--accent)]">04</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[var(--foreground)]">EARN YOUR SCORE</h3>
            <p className="text-sm text-zinc-400">
              Earlier completions earn more points. All successful players earn at least 30 points.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/[0.06]">
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
          RULES
        </h3>
        <div className="space-y-3 text-sm text-zinc-400">
          <p>• Follow the QR sequence in order - skipping markers earns 0 points</p>
          <p>• Each marker can only be completed once per player</p>
          <p>• Wrong answers earn 0 points but can be retried unlimited times</p>
          <p>• Only successful completions award points based on completion position</p>
          <p>• Earlier successful players receive higher scores</p>
          <p>• Minimum score per marker is 30 points</p>
          <p>• Do not move, remove, or tamper with physical QR markers</p>
          <p>• One account equals one player - no sharing or team play</p>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">
          READY TO BEGIN?
        </p>
      </div>
    </div>
  );
}