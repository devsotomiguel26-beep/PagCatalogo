interface FloatingCartButtonProps {
  count: number;
  onClick: () => void;
}

export default function FloatingCartButton({ count, onClick }: FloatingCartButtonProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-red-700 transition-all transform hover:scale-105 z-50 flex items-center gap-3 animate-slideUp"
    >
      <svg
        className="w-6 h-6"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      <div className="text-left">
        <div className="text-sm font-medium">
          {count} {count === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
        </div>
        <div className="text-xs opacity-90">Click para solicitar</div>
      </div>
      <div className="bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
        {count}
      </div>
    </button>
  );
}
