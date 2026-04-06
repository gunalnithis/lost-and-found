const ItemCard = ({ item, onEdit, onDelete, onView }) => {
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="group theme-card transform overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-950/30">
      {/* Image Container with Overlay */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={item.image || "https://via.placeholder.com/400x300"}
          alt={item.itemName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span
            className={`px-4 py-1.5 text-xs font-semibold rounded-full backdrop-blur-md shadow-lg
            ${
              item.category === "lost"
                ? "bg-red-500/90 text-white"
                : "bg-emerald-500/90 text-white"
            }`}
          >
            {item.category === "lost" ? "🔍 Lost" : "✓ Found"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="mb-2 text-xl font-bold text-slate-100 transition-colors group-hover:text-sky-400">
          {item.itemName}
        </h3>

        <div className="mb-4 flex items-center gap-2 text-sm text-deep-muted">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{timeAgo(item.createdAt)}</span>
        </div>

        {onEdit || onDelete ? (
          <div className="flex gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 rounded-xl bg-gradient-accent py-2 font-semibold text-white shadow-md transition-all duration-300 hover:bg-gradient-accent-hover"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex-1 rounded-xl border border-red-500/40 bg-red-950/50 py-2 font-semibold text-red-400 transition-all duration-300 hover:bg-red-950/70"
              >
                Delete
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onView}
            className="group/btn relative w-full transform overflow-hidden rounded-xl bg-gradient-accent py-3 font-semibold text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-gradient-accent-hover hover:shadow-xl"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              View Details
              <svg
                className="h-4 w-4 transition-transform group-hover/btn:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
