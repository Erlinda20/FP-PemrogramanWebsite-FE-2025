import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, Minimize2, Volume2 } from "lucide-react";
import { useState } from "react";
import { formatTime } from "../hooks/useSpeedSortingGame";

interface GameHeaderProps {
  timer: number;
  score: number;
  onExit: () => void;
}

export function GameHeader({ timer, score, onExit }: GameHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4 shadow-sm">
      <div>
        <Button
          size="sm"
          variant="ghost"
          className="hidden md:flex"
          onClick={onExit}
        >
          <ArrowLeft /> Exit Game
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="block md:hidden"
          onClick={onExit}
        >
          <ArrowLeft />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-gray-900">
          {formatTime(timer)}
        </div>
        <div className="flex items-center gap-1 text-lg font-semibold text-gray-900">
          <span>✓</span>
          <span>{score}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" className="p-2">
          <Volume2 className="w-5 h-5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="p-2"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
