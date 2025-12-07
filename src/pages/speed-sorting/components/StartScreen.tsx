import { Button } from "@/components/ui/button";

interface StartScreenProps {
  onStart: () => void;
  title: string;
  thumbnailImage: string;
}

export function StartScreen({
  onStart,
  title,
  thumbnailImage,
}: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-20 space-y-6 sm:space-y-8 lg:space-y-10">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 mb-2 sm:mb-4 max-w-md text-center px-4 font-bold">
        Speed Sorting
      </h1>
      {thumbnailImage && (
        <div className="w-full max-w-md">
          <img
            src={thumbnailImage}
            alt={title}
            className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-lg"
          />
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-700 mb-2 sm:mb-4 text-center px-4">
        {title}
      </h2>
      <Button
        onClick={onStart}
        size="lg"
        className="px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-semibold"
      >
        Start Game
      </Button>
    </div>
  );
}
