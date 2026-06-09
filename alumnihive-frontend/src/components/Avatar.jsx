const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500',
  'bg-cyan-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColor(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const Avatar = ({ name = '?', className = '' }) => {
  const sizeClass = className.includes('w-') ? '' : 'w-10 h-10';
  return (
    <div className={`rounded-full flex items-center justify-center text-white font-semibold text-sm ${getColor(name)} ${sizeClass} ${className}`}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
