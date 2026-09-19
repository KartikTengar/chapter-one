import { NextResponse } from "next/server";
import { 
  getGameConfigAdmin, 
  getGameLevelsAdmin, 
  getScanLogsAdmin, 
  getLeaderboardAdmin
} from "@/lib/hidden-trail/admin";
import type { 
  GameLevel, 
  ScanLogWithRelations, 
  LeaderboardEntry 
} from "@/lib/hidden-trail/game";

export async function GET() {
  try {
    // Handle missing game as empty state, not server error
    let gameConfig = null;
    try {
      gameConfig = await getGameConfigAdmin();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isNotFound = 
        message.includes("No rows found") ||
        message.includes("Row not found") ||
        message.includes("PGRST116");
      if (!isNotFound) {
        throw err;
      }
      // gameConfig stays null for empty state
    }

    if (!gameConfig) {
      return NextResponse.json({
        gameConfig: null,
        stats: {
          totalParticipants: 0,
          activeParticipants: 0,
          challengesCompleted: 0,
          averageProgress: 0
        },
        recentScans: [],
        leaderboard: [],
        levelStats: []
      });
    }
    
    const [gameLevels, recentScans, leaderboard] = await Promise.all([
      getGameLevelsAdmin(),
      getScanLogsAdmin(null, 20),
      getLeaderboardAdmin(null, 10),
    ]);

    // Calculate level stats
    const levelStats = gameLevels.map((level: GameLevel) => {
      const completedForLevel = recentScans.filter(
        (scan: ScanLogWithRelations) => scan.level_id === level.id && scan.result === "answer_correct"
      ).length;
      
      return {
        ...level,
        successfulCompletions: completedForLevel,
        currentValue: Math.max(
          gameConfig?.score_floor ?? 30,
          (gameConfig?.starting_score ?? 100) - (completedForLevel * (completedForLevel - 1))
        )
      };
    });
    
    const stats = {
      totalParticipants: leaderboard.length,
      activePlayers: leaderboard.filter((l: LeaderboardEntry) => l.status === "active").length,
      completedPlayers: leaderboard.filter((l: LeaderboardEntry) => l.status === "completed").length,
      successfulCompletions: recentScans.filter((s: ScanLogWithRelations) => s.result === "answer_correct").length,
      wrongAnswers: recentScans.filter((s: ScanLogWithRelations) => s.result === "wrong_answer").length,
      invalidScans: recentScans.filter((s: ScanLogWithRelations) => s.result === "invalid_token" || s.result === "wrong_sequence" || s.result === "duplicate").length,
      levelStats
    };

    return NextResponse.json({
      gameConfig,
      levels: gameLevels,
      recentScans,
      leaderboard,
      stats,
    });
  } catch (error) {
    console.error("Failed to load game overview:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load game overview" },
      { status: 500 }
    );
  }
}