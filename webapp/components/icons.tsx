/**
 * OddsCast unified icons — Lucide React
 * Semantic icons suitable for horse racing/premium theme
 */
import {
  Trophy,
  ScrollText,
  ShieldCheck,
  ReceiptText,
  Smartphone,
  Clock,
  ClipboardList,
  User,
  UserPlus,
  UserMinus,
  LogIn,
  LogOut,
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
  Copy,
  HelpCircle,
  Bug,
  Users,      // Jockey-trainer combos / group icon
  Hash,       // Gate/post position number
  Droplets,   // Track condition / weather
} from 'lucide-react';

/** Race icon — uses Flag (race start signal) */
export const Horse = Flag;

export const Icons = {
  Trophy,
  Clock,
  ClipboardList,
  User,
  UserPlus,
  UserMinus,
  LogIn,
  LogOut,
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
  ScrollText,
  ShieldCheck,
  ReceiptText,
  Smartphone,
  Copy,
  HelpCircle,
  Bug,
  Users,
  Hash,
  Droplets,
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
