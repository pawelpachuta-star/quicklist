function Icon({ size = 22, color = 'currentColor', stroke = 1.75, children, style, ...rest }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...rest}
    >
      {children}
    </svg>
  )
}

export const TodoIcon      = (p) => <Icon {...p}><path d="M5 12l5 5L20 7" /></Icon>
export const CartIcon      = (p) => <Icon {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.5 12h11l2-8H6" /></Icon>
export const PlusIcon      = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const TrashIcon     = (p) => <Icon {...p}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></Icon>
export const DragIcon      = (p) => <Icon {...p} stroke="none"><circle cx="9" cy="6" r="1.1" fill="currentColor" /><circle cx="15" cy="6" r="1.1" fill="currentColor" /><circle cx="9" cy="12" r="1.1" fill="currentColor" /><circle cx="15" cy="12" r="1.1" fill="currentColor" /><circle cx="9" cy="18" r="1.1" fill="currentColor" /><circle cx="15" cy="18" r="1.1" fill="currentColor" /></Icon>
export const ChevronDown   = (p) => <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>
export const SearchIcon    = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>
export const MoreIcon      = (p) => <Icon {...p} stroke="none"><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></Icon>
export const CheckIcon     = (p) => <Icon {...p}><path d="M5 12l4.5 4.5L19 7" /></Icon>
export const BriefcaseIcon = (p) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></Icon>
export const NoteIcon      = (p) => <Icon {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 13h7M8 17h5" /></Icon>
export const BookIcon      = (p) => <Icon {...p}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /></Icon>
export const HeartIcon     = (p) => <Icon {...p}><path d="M12 20.5s-7-4.35-7-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5c0 5.65-7 10-7 10z" /></Icon>
export const SparkIcon     = (p) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" /><circle cx="12" cy="12" r="3" /></Icon>
export const HomeIcon      = (p) => <Icon {...p}><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" /></Icon>
export const StarIcon      = (p) => <Icon {...p}><path d="M12 4l2.5 5.2 5.7.8-4.1 4 1 5.6L12 17l-5.1 2.6 1-5.6-4.1-4 5.7-.8z" /></Icon>
export const CoffeeIcon    = (p) => <Icon {...p}><path d="M4 8h11a3 3 0 0 1 0 6h-1" /><path d="M4 8v8a4 4 0 0 0 4 4h3a4 4 0 0 0 4-4V8z" /><path d="M7 4v2M11 4v2" /></Icon>
export const MusicIcon     = (p) => <Icon {...p}><path d="M9 17V6l11-2v11" /><circle cx="6" cy="17" r="3" /><circle cx="17" cy="15" r="3" /></Icon>
export const MapIcon       = (p) => <Icon {...p}><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" /><path d="M9 4v16M15 6v16" /></Icon>
export const CalendarIcon  = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></Icon>
export const CodeIcon      = (p) => <Icon {...p}><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 6l-4 12" /></Icon>
export const PencilIcon    = (p) => <Icon {...p}><path d="M4 20h4l10.5-10.5a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z" /><path d="M13 7l3.5 3.5" /></Icon>
export const XIcon         = (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>

export const ICON_REGISTRY = {
  todo: TodoIcon, cart: CartIcon, briefcase: BriefcaseIcon,
  note: NoteIcon, book: BookIcon, heart: HeartIcon,
  spark: SparkIcon, home: HomeIcon, star: StarIcon,
  coffee: CoffeeIcon, music: MusicIcon, map: MapIcon,
  calendar: CalendarIcon, code: CodeIcon,
}

export const ICON_KEYS = [
  'todo', 'cart', 'briefcase', 'note', 'book', 'heart',
  'spark', 'home', 'star', 'coffee', 'music', 'map',
  'calendar', 'code',
]
