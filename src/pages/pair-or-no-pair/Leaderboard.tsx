import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/api/axios";

interface LeaderboardEntry {
  id: string;
  score: number;
  max_combo: number;
  time_taken: number;
  matched_pairs: number;
  total_pairs: number;
  created_at: string;
  user: {
    id: string;
    username: string;
    profile_picture: string | null;
  };
}

interface LeaderboardData {
  data: LeaderboardEntry[];
  meta: {
    page?: number;
    currentPage?: number;
    per_page: number;
    perPage?: number;
    total: number;
    total_pages?: number;
    lastPage?: number;
    prev: number | null;
    next: number | null;
  };
}

export default function Leaderboard() {
  const { gameId } = useParams<{ gameId: string }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!gameId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/api/game/score/leaderboard/${gameId}`,
          {
            params: {
              page,
              per_page: perPage,
            },
          }
        );

        if (response.data.success) {
          setLeaderboard({
            data: response.data.data,
            meta: response.data.meta,
          });
        } else {
          setError("Failed to load leaderboard");
        }
      } catch (err: unknown) {
        console.error("Error fetching leaderboard:", err);
        setError(
          (err as any)?.response?.data?.message || "Failed to load leaderboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [gameId, page]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <Link
            to={gameId ? `/pair-or-no-pair/play/${gameId}` : "/"}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Back to Game
          </Link>
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.data.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">No scores yet!</div>
          <Link
            to={gameId ? `/pair-or-no-pair/play/${gameId}` : "/"}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Be the first to play!
          </Link>
        </div>
      </div>
    );
  }

  const startRank = (page - 1) * perPage + 1;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-blue-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-teal-400 mb-4">
            🏆 Leaderboard
          </h1>
          <Link
            to={gameId ? `/pair-or-no-pair/play/${gameId}` : "/"}
            className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full transition-all transform hover:scale-105"
          >
            ← Back to Game
          </Link>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/20">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-bold">Rank</th>
                  <th className="px-6 py-4 text-left text-white font-bold">Player</th>
                  <th className="px-6 py-4 text-center text-white font-bold">Score</th>
                  <th className="px-6 py-4 text-center text-white font-bold">Max Combo</th>
                  <th className="px-6 py-4 text-center text-white font-bold">Time</th>
                  <th className="px-6 py-4 text-center text-white font-bold">Pairs</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.data.map((entry, index) => {
                  const rank = startRank + index;
                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-white/10 ${
                        rank <= 3
                          ? "bg-linear-to-r from-yellow-500/20 to-orange-500/20"
                          : "hover:bg-white/5"
                      } transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-2xl font-bold text-white">
                          {getRankEmoji(rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {entry.user.profile_picture ? (
                            <img
                              src={entry.user.profile_picture}
                              alt={entry.user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                              {entry.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-white font-semibold">
                            {entry.user.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-yellow-400 font-bold text-lg">
                          {entry.score.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {entry.max_combo > 0 ? (
                          <span className="text-orange-400 font-bold">
                            🔥 {entry.max_combo}x
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-blue-300 font-semibold">
                          {formatTime(entry.time_taken)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-green-300 font-semibold">
                          {entry.matched_pairs}/{entry.total_pairs}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(leaderboard.meta.total_pages || leaderboard.meta.lastPage || 1) > 1 && (
            <div className="bg-white/10 px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!leaderboard.meta.prev}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  leaderboard.meta.prev
                    ? "bg-blue-500 hover:bg-blue-400 text-white"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
              >
                ← Prev
              </button>

              <span className="text-white font-semibold">
                Page {leaderboard.meta.currentPage || leaderboard.meta.page} of{" "}
                {leaderboard.meta.total_pages || leaderboard.meta.lastPage} (
                {leaderboard.meta.total} total players)
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!leaderboard.meta.next}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  leaderboard.meta.next
                    ? "bg-blue-500 hover:bg-blue-400 text-white"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

