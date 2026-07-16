import {
  Home, CalendarDays, Brain, Target, Cake, Award, Settings,
  Newspaper, Radio, Sparkles, Lightbulb, MessageSquare, BookOpen,
  Link2, PartyPopper, Trophy, Clock, Palette, Presentation,
  ChevronLeft, ChevronRight, Plus, Trash2, Star, ExternalLink,
  Users, Ticket, Image,
} from 'lucide-react'

// Central icon map. Lucide gives the thin "outline / hollow" look (fill:none,
// stroke) that matches VIBE-Quiniela. Reference icons by name so pages never
// import from lucide directly.
const ICONS = {
  home: Home, calendar: CalendarDays, brain: Brain, target: Target,
  cake: Cake, award: Award, settings: Settings, news: Newspaper,
  live: Radio, sparkles: Sparkles, idea: Lightbulb, slack: MessageSquare,
  wiki: BookOpen, link: Link2, contest: PartyPopper, trophy: Trophy,
  clock: Clock, art: Palette, ppt: Presentation, prev: ChevronLeft,
  next: ChevronRight, plus: Plus, trash: Trash2, star: Star,
  external: ExternalLink, users: Users, ticket: Ticket, image: Image,
}

// Usage: <Icon name="trophy" size={20} glow />
export default function Icon({ name, size = 18, glow = false, className = '', style = {} }) {
  const Cmp = ICONS[name] || Sparkles
  return (
    <Cmp
      size={size}
      strokeWidth={1.75}
      className={`vibe-ico ${glow ? 'glow' : ''} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}
