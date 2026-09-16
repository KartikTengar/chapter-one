import { NextResponse } from "next/server";
import { 
  getGameConfigAdmin, 
  getGameLevelsAdmin, 
  getScanLogsAdmin, 
  getLeaderboardAdmin
} from "@/lib/hidden-trail/admin";
import type { 
  GameConfig, 
  GameLevel, 
  ScanLogWithRelations, 
  LeaderboardEntry 
} from "@/lib/hidden-trail/game";

export async function GET() {
  try {
    const gameId = "00000000-0000-0000-0000-000000000001";
    
    const [gameConfig, gameLevels, recentScans, leaderboard] = await Promise.all([
      getGameConfigAdmin(gameId),
      getGameLevelsAdmin(gameId),
      getScanLogsAdmin(gameId, 20),
      getLeaderboardAdmin(gameId, 10),
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