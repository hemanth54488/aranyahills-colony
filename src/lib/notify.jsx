import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const CONFIGS = {
  success: {
    Icon: CheckCircle,
    iconBg: 'bg-forest-500',
    iconColor: 'text-white',
    bar: 'bg-gradient-to-b from-forest-400 to-forest-600',
    title: 'text-forest-900',
    desc: 'text-forest-600',
    border: 'border-forest-100',
    bg: 'bg-white',
    ring: 'shadow-forest-100',
  },
  error: {
    Icon: XCircle,
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    bar: 'bg-gradient-to-b from-red-400 to-red-600',
    title: 'text-red-900',
    desc: 'text-red-600',
    border: 'border-red-100',
    bg: 'bg-white',
    ring: 'shadow-red-100',
  },
  warning: {
    Icon: AlertTriangle,
    iconBg: 'bg-amber-400',
    iconColor: 'text-amber-900',
    bar: 'bg-gradient-to-b from-amber-300 to-amber-500',
    title: 'text-amber-900',
    desc: 'text-amber-700',
    border: 'border-amber-100',
    bg: 'bg-white',
    ring: 'shadow-amber-100',
  },
  info: {
    Icon: Info,
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    bar: 'bg-gradient-to-b from-blue-400 to-blue-600',
    title: 'text-blue-900',
    desc: 'text-blue-600',
    border: 'border-blue-100',
    bg: 'bg-white',
    ring: 'shadow-blue-100',
  },
}

function ToastCard({ t: toastObj, type, title, description }) {
  const cfg = CONFIGS[type]
  const { Icon } = cfg

  return (
    <div
      className={`
        flex items-stretch gap-0 rounded-2xl border overflow-hidden
        shadow-xl ${cfg.ring} ${cfg.border} ${cfg.bg}
        transition-all duration-300
        ${toastObj.visible ? 'animate-fade-up opacity-100' : 'opacity-0 translate-y-2'}
      `}
      style={{ minWidth: 300, maxWidth: 380 }}
    >
      {/* Left accent bar */}
      <div className={`w-1.5 shrink-0 ${cfg.bar}`} />

      {/* Icon */}
      <div className="flex items-center px-4 py-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg} shadow-sm`}>
          <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-4 pr-2 min-w-0">
        <p className={`font-bold text-sm leading-snug ${cfg.title}`}>{title}</p>
        {description && (
          <p className={`text-xs mt-1 leading-relaxed ${cfg.desc}`}>{description}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => toast.dismiss(toastObj.id)}
        className="flex items-start pt-3.5 pr-3.5 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function show(type, title, description, opts = {}) {
  return toast.custom(
    (t) => <ToastCard t={t} type={type} title={title} description={description} />,
    { duration: opts.duration ?? 4000, ...opts }
  )
}

const notify = {
  success: (title, description, opts) => show('success', title, description, opts),
  error:   (title, description, opts) => show('error',   title, description, opts),
  warning: (title, description, opts) => show('warning', title, description, opts),
  info:    (title, description, opts) => show('info',    title, description, opts),
}

export default notify
