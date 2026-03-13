const variants = {
  default:
    'bg-primary text-primary-foreground hover:bg-primary/90',
  outline:
    'border border-border bg-background hover:bg-secondary hover:text-foreground',
  ghost:
    'hover:bg-accent hover:text-accent-foreground',
}
const sizes = {
  default: 'h-9 px-4 py-2 text-sm',
  lg: 'h-10 rounded-md px-6 text-base',
  icon: 'h-9 w-9 shrink-0',
}

export default function Button({
  className = '',
  variant = 'default',
  size = 'default',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
