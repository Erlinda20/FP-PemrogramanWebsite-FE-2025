import { useNavigate, useParams } from "react-router-dom";
import { CategoryBuckets } from "./components/CategoryBuckets";
import { CountdownScreen } from "./components/CountdownScreen";
import { GameEndScreen } from "./components/GameEndScreen";
import { GameHeader } from "./components/GameHeader";
import { StartScreen } from "./components/StartScreen";
import { WordCardsAnimation } from "./components/WordCardsAnimation";
import { useGetDetailSpeedSorting } from "./hooks/useGetDetailSpeedSorting";
import {
  getScrollAnimation,
  useSpeedSortingGame,
} from "./hooks/useSpeedSortingGame";

export default function SpeedSorting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading, error } = useGetDetailSpeedSorting(id!);

  const game = useSpeedSortingGame(detail);
  const scrollAnimation = getScrollAnimation();

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  if (error || !detail)
    return (
      <div className="flex justify-center items-center min-h-screen">
        {error || "Game not found"}
      </div>
    );

  if (game.gameEnded) {
    return (
      <>
        <style>{scrollAnimation}</style>
        <GameEndScreen
          finalTime={game.finalTime}
          totalWords={game.totalWords}
          incorrectAttempts={game.incorrectAttempts}
          onPlayAgain={game.resetGame}
          onBackToHome={() => (window.location.href = "/")}
        />
      </>
    );
  }

  return (
    <>
      <style>{scrollAnimation}</style>
      <div className="w-full bg-slate-50 min-h-screen flex flex-col">
        <GameHeader
          timer={game.timer}
          score={game.score}
          onExit={() => navigate(-1)}
        />

        <div className="w-full flex-1 p-2 sm:p-4 lg:p-6 flex justify-center items-center">
          <div className="w-full max-w-7xl space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="bg-white w-full p-4 sm:p-8 lg:p-12 text-center space-y-6 sm:space-y-8 lg:space-y-10 rounded-xl lg:rounded-2xl border sm:border-2 shadow-md lg:shadow-lg min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] flex flex-col justify-center">
              {game.gameState === "waiting" && (
                <StartScreen
                  onStart={game.startGame}
                  title={detail.name}
                  thumbnailImage={`${import.meta.env.VITE_API_URL}/${detail.thumbnail_image}`}
                />
              )}

              {game.gameState === "countdown" && (
                <CountdownScreen countdown={game.countdown} />
              )}

              {game.gameState === "playing" && (
                <>
                  <WordCardsAnimation
                    words={game.words}
                    speed={game.speed}
                    draggedItem={game.draggedItem}
                    onDragStart={game.handleDragStart}
                    onDragEnd={game.handleDragEnd}
                  />

                  <CategoryBuckets
                    categories={game.categories}
                    hoveredCategory={game.hoveredCategory}
                    dropFeedback={game.dropFeedback}
                    onDragOver={game.handleDragOver}
                    onDragEnter={game.handleDragEnter}
                    onDragLeave={game.handleDragLeave}
                    onDrop={game.handleDrop}
                  />

                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-4 sm:mt-6 lg:mt-8">
                    {game.completedWords} of {game.totalWords} words completed
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
