/**
 * GOLDEN RACE 통일 아이콘 — Lucide React
 * 경마/프리미엄 테마에 어울리는 시맨틱 아이콘
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
  Flag,      // 경주/레이스
  Sparkles,  // AI 예측
  Crown,     // 구독/프리미엄
  Gem,       // 포인트/고급
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
} from 'lucide-react';

/** 경주 아이콘 — 깃발(Flag) 사용 (경주 시작 신호) */
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
