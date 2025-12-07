import type { Category, DropFeedback } from "../hooks/useSpeedSortingGame";

interface CategoryBucketsProps {
  categories: Category[];
  hoveredCategory: string | null;
  dropFeedback: DropFeedback | null;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>, categoryId: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, categoryId: string) => void;
}

export function CategoryBuckets({
  categories,
  hoveredCategory,
  dropFeedback,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}: CategoryBucketsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10">
      {categories.map((category) => (
        <div
          key={category.id}
          onDragOver={onDragOver}
          onDragEnter={(e) => onDragEnter(e, category.id)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, category.id)}
          className={`
            bg-white text-black border-2 sm:border-3 rounded-xl lg:rounded-2xl 
            px-4 py-3 sm:px-8 sm:py-6 lg:px-12 lg:py-8
            text-sm sm:text-lg lg:text-2xl font-semibold sm:font-bold text-center cursor-pointer
            transform transition-all duration-200 hover:scale-105 shadow-md sm:shadow-lg
            w-full sm:w-auto min-w-[140px] sm:min-w-40 lg:min-w-[200px]
            min-h-20 sm:min-h-[120px] lg:min-h-[140px]
            flex items-center justify-center
            ${
              dropFeedback?.categoryId === category.id
                ? dropFeedback.isCorrect
                  ? "scale-125 border-green-500 bg-green-100 shadow-xl sm:shadow-2xl"
                  : "scale-90 border-red-500 bg-red-100 shadow-xl sm:shadow-2xl"
                : hoveredCategory === category.id
                  ? "scale-110 border-blue-400 bg-blue-50 shadow-lg sm:shadow-xl"
                  : "border-gray-300"
            }
          `}
        >
          {category.name}
        </div>
      ))}
    </div>
  );
}
