/**
 * GOLDEN RACE unified icons — Lucide React
 * Semantic icons suitable for horse racing/premium theme
 */
import {
  Trophy,
  Clock,
  ClipboardList,
  User,
  UserPlus,
  LogIn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Ruler,
  Target,
  Star,
  Bookmark,
  AlertCircle,
  Loader2,
  BarChart2,
  Trash2,
  Bell,
  Check,
  Settings,
  CheckCircle,
  CreditCard,
  Flag,      // Race
  Sparkles,  // AI prediction
  Crown,     // Subscription/premium
  Gem,       // Points/premium
  TrendingUp,
  Medal,
  Award,
  Heart,
  Ticket,
  X,
  Key,
  Mail,
  RefreshCw,
  Lock,
  Unlock,
  Plus,
  Minus,
  ShoppingCart,
  PanelLeft,
  PanelBottom,
  GripVertical,
  Grip,
  Wifi,
  WifiOff,
} from 'lucide-react';

/** Race icon — uses Flag (race start signal) */
export const Horse = Flag;

export const Icons = {
  Trophy,
  Clock,
  ClipboardList,
  User,
  UserPlus,
  LogIn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Ruler,
  Target,
  Star,
  Bookmark,
  AlertCircle,
  Loader2,
  BarChart2,
  Horse,
  Trash2,
  Bell,
  Check,
  Settings,
  CheckCircle,
  CreditCard,
  Flag,
  Sparkles,
  Crown,
  Gem,
  TrendingUp,
  Medal,
  Award,
  Heart,
  Ticket,
  X,
  Key,
  Mail,
  RefreshCw,
  Lock,
  Unlock,
  Plus,
  Minus,
  ShoppingCart,
  PanelLeft,
  PanelBottom,
  GripVertical,
  Grip,
  Wifi,
  WifiOff,
} as const;

export type IconName = keyof typeof Icons;

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, className = '', strokeWidth = 2 }: IconProps) {
  const LucideIcon = Icons[name];
  return <LucideIcon size={size} className={className} strokeWidth={strokeWidth} />;
}
