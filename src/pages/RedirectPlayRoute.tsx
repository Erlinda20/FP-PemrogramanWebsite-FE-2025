import { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "@/api/axios";
import { Typography } from "@/components/ui/typography";

/**
 * Component to handle malformed play routes (e.g., /undefined/play/:id)
 * Attempts to fetch game info and redirect to correct route
 */
export default function RedirectPlayRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirectToCorrectRoute = async () => {
      const gameId = id;

      if (!gameId) {
        console.error(
          "Could not extract game ID from path:",
          location.pathname,
        );
        navigate("/");
        return;
      }

      try {
        // Try to fetch game info to determine the correct route
        // We'll try common game types
        const gameTypes = [
          "quiz",
          "speed-sorting",
          "anagram",
          "pair-or-no-pair",
        ];

        for (const gameType of gameTypes) {
          try {
            await api.get(
              `/api/game/game-type/${gameType}/${gameId}/play/public`,
            );
            // If successful, redirect to correct route
            navigate(`/${gameType}/play/${gameId}`, { replace: true });
            return;
          } catch {
            // Continue to next game type
            continue;
          }
        }

        // If none worked, redirect to home
        navigate("/");
      } catch (err) {
        console.error("Failed to redirect:", err);
        navigate("/");
      }
    };

    redirectToCorrectRoute();
  }, [id, navigate, location.pathname]);

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
      <Typography variant="p">Redirecting...</Typography>
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
    </div>
  );
}
