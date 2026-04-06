/**
 * Marketing landing page — standalone full-width design
 * No floating app bar, custom layout for conversion-focused UX
 */
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/icons";
import { routes } from "@/lib/routes";
import { CONFIG } from "@/lib/config";
import PredictionApi from "@/lib/api/predictionApi";
import SubscriptionPlansApi from "@/lib/api/subscriptionPlansApi";
import type { SubscriptionPlan } from "@/lib/api/subscriptionPlansApi";

const WEBAPP_URL = CONFIG.webapp.baseURL;

/* ─── Section wrapper ─── */
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`px-5 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20 ${className}`}
    >
      <div className="max-w-[1100px] mx-auto">{children}</div>
    </section>
  );
}

/* ─── Section label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-primary font-semibold text-xs sm:text-sm mb-2 tracking-widest uppercase">
      {children}
    </p>
  );
}

/* ─── Feature card ─── */
function FeatureCard({
  icon,
  title,
  desc,
  accent = "emerald",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: "emerald" | "blue" | "violet" | "amber" | "rose" | "teal";
}) {
  const accentMap = {
    emerald: "bg-emerald-50 border-emerald-100",
    blue: "bg-blue-50 border-blue-100",
    violet: "bg-violet-50 border-violet-100",
    amber: "bg-amber-50 border-amber-100",
    rose: "bg-rose-50 border-rose-100",
    teal: "bg-teal-50 border-teal-100",
  };
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 hover:border-stone-300 hover:shadow-md transition-all duration-200">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${accentMap[accent]}`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 leading-relaxed break-keep break-words">
        {desc}
      </p>
    </div>
  );
}

/* ─── Plan card ─── */
function PlanCard({
  plan,
  recommended,
}: {
  plan: SubscriptionPlan;
  recommended?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-6 sm:p-7 relative ${recommended ? "border-primary bg-primary/3 shadow-lg shadow-primary/10" : "border-stone-200 bg-white"}`}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
          추천
        </span>
      )}
      <h4 className="text-lg font-bold text-stone-900 mb-1">
        {plan.displayName}
      </h4>
      <p className="text-xs text-stone-500 mb-4 break-keep break-words">
        {plan.description}
      </p>
      <div className="mb-4">
        <span className="text-3xl font-extrabold text-stone-900">
          {plan.totalPrice.toLocaleString()}
        </span>
        <span className="text-sm text-stone-500">원/월</span>
      </div>
      <ul className="space-y-2 mb-6 text-sm text-stone-700">
        <li className="flex items-center gap-2">
          <Icon name="Check" size={16} className="text-primary shrink-0" />
          경주 예측 티켓{" "}
          <span className="font-bold">{plan.totalTickets}장</span>/월
        </li>
        {plan.matrixTickets > 0 && (
          <li className="flex items-center gap-2">
            <Icon name="Check" size={16} className="text-primary shrink-0" />
            종합 예상 티켓{" "}
            <span className="font-bold">{plan.matrixTickets}장</span>/월
          </li>
        )}
        {plan.bonusTickets > 0 && (
          <li className="flex items-center gap-2">
            <Icon name="Check" size={16} className="text-primary shrink-0" />
            보너스 티켓{" "}
            <span className="font-bold">+{plan.bonusTickets}장</span>
          </li>
        )}
      </ul>
      <Link
        href={routes.mypage.subscriptions}
        className={`block text-center py-3 rounded-xl text-sm font-bold transition-colors touch-manipulation ${
          recommended
            ? "bg-primary text-white hover:bg-primary-dark"
            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
        }`}
      >
        시작하기
      </Link>
    </div>
  );
}

/* ─── Mock Prediction Card ─── */
function MockPredictionCard({ compact = false }: { compact?: boolean }) {
  const horses = [
    { rank: 1, no: 3, name: "청풍대로", prob: 34, pct: "w-[85%]", color: "bg-emerald-500", score: 87, jockey: "문세영" },
    { rank: 2, no: 7, name: "황금날개", prob: 22, pct: "w-[55%]", color: "bg-emerald-400", score: 74, jockey: "박철민" },
    { rank: 3, no: 1, name: "질풍노도", prob: 18, pct: "w-[45%]", color: "bg-amber-400", score: 68, jockey: "이재훈" },
    { rank: 4, no: 5, name: "번개발굽", prob: 14, pct: "w-[35%]", color: "bg-stone-300", score: 55, jockey: "김도현" },
    { rank: 5, no: 9, name: "하늘바람", prob: 8, pct: "w-[20%]", color: "bg-stone-200", score: 42, jockey: "최승우" },
    { rank: 6, no: 2, name: "폭풍질주", prob: 4, pct: "w-[10%]", color: "bg-stone-100", score: 31, jockey: "오준혁" },
  ];
  const displayHorses = compact ? horses.slice(0, 4) : horses;

  return (
    <div className="rounded-2xl bg-white border border-stone-200 shadow-xl shadow-stone-900/12 overflow-hidden">
      {/* Header */}
      <div className="bg-[#0d1f0d] px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] text-stone-400 font-medium tracking-wide">서울경마공원 · 제5경주</p>
            <p className="text-white text-sm font-bold mt-0.5">AI 예측 결과</p>
            <p className="text-stone-400 text-[10px] mt-1">1,800m · 잔디 · 4세 이상 오픈</p>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              신뢰도 높음
            </span>
            <p className="text-[10px] text-stone-500 mt-1.5">출전 {horses.length}두</p>
          </div>
        </div>
      </div>

      {/* Horse list */}
      <div className={`${compact ? "p-3.5 space-y-2.5" : "p-4 space-y-3"}`}>
        {displayHorses.map((h) => {
          const rankStyle =
            h.rank === 1 ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" :
            h.rank === 2 ? "bg-stone-100 text-stone-600" :
            h.rank === 3 ? "bg-orange-50 text-orange-500" :
            "bg-stone-50 text-stone-400";
          return (
            <div key={h.no} className="flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${rankStyle}`}>
                {h.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-xs font-bold ${h.rank <= 3 ? "text-stone-900" : "text-stone-500"}`}>
                      {h.no}번 {h.name}
                    </span>
                    {!compact && (
                      <span className="text-[10px] text-stone-400 truncate">({h.jockey})</span>
                    )}
                  </div>
                  <span className={`text-xs font-bold shrink-0 ml-2 ${h.rank === 1 ? "text-primary" : h.rank <= 3 ? "text-emerald-600" : "text-stone-400"}`}>
                    {h.prob}%
                  </span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${h.color} ${h.pct}`} />
                </div>
              </div>
              {!compact && (
                <div className="shrink-0 w-8 text-right">
                  <span className="text-[10px] font-semibold text-stone-400">{h.score}점</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bet types */}
      {!compact && (
        <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/60">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-2">베팅 타입 추천</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: "단승", pick: "3번", desc: "청풍대로" },
              { type: "연승", pick: "3-7", desc: "1·2위권" },
              { type: "복승", pick: "3·7", desc: "조합 추천" },
            ].map((b) => (
              <div key={b.type} className="rounded-lg bg-white border border-stone-200 p-2 text-center">
                <p className="text-[10px] font-bold text-stone-400 mb-0.5">{b.type}</p>
                <p className="text-sm font-extrabold text-primary leading-none">{b.pick}</p>
                <p className="text-[9px] text-stone-400 mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Commentary */}
      {!compact && (
        <div className="border-t border-stone-100 px-4 py-3">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">AI 종합 분석</p>
          <p className="text-xs text-stone-600 leading-relaxed">
            3번 청풍대로는 최근 3전 2승으로 폼이 최고조입니다. 기수 문세영과의 궁합도 우수하며, 1,800m 잔디 코스에서 특히 강한 면모를 보여왔습니다.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-stone-100 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon name="Sparkles" size={11} className="text-primary" />
          <p className="text-[10px] text-stone-400">AI 추론 · 15요소 수학 분석</p>
        </div>
        <p className="text-[10px] text-stone-300">샘플 데이터</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const { data: accuracyData } = useQuery({
    queryKey: ["predictions", "accuracy-stats", "landing"],
    queryFn: () => PredictionApi.getAccuracyStats(),
    staleTime: 30 * 60 * 1000,
  });

  const { data: plans } = useQuery({
    queryKey: ["subscription-plans", "landing"],
    queryFn: () => SubscriptionPlansApi.getSubscriptionPlans(),
    staleTime: 30 * 60 * 1000,
  });

  const totalPredictions = accuracyData?.overall?.totalCount ?? 0;
  const hitCount = accuracyData?.overall?.hitCount ?? 0;
  const pct =
    totalPredictions > 0 ? Math.round((hitCount / totalPredictions) * 100) : null;

  const activePlans = (plans ?? [])
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const baseUrl = WEBAPP_URL.startsWith("http")
    ? WEBAPP_URL
    : "https://oddscast-webapp.vercel.app";
  const ogImage = `${baseUrl}/image/ogImage.jpg`;
  const pageUrl = `${baseUrl}/welcome`;

  return (
    <>
      <Head>
        <title>OddsCast - AI 경마 예측 서비스</title>
        <meta
          name="description"
          content="데이터와 AI가 분석하는 경마 예측. 수학 기반 분석, 실시간 경주 정보, 투명한 적중률 공개. 지금 무료로 시작하세요."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0d1f0d" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content="OddsCast - AI 경마 예측 서비스" />
        <meta
          property="og:description"
          content="데이터와 AI가 분석하는 경마 예측. 수학 기반 분석, 실시간 경주 정보, 투명한 적중률 공개."
        />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="OddsCast - AI 경마 예측 서비스" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="OddsCast - AI 경마 예측 서비스" />
        <meta
          name="twitter:description"
          content="데이터와 AI가 분석하는 경마 예측. 수학 기반 분석, 실시간 경주 정보, 투명한 적중률 공개."
        />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <div
        ref={scrollContainerRef}
        className="h-dvh overflow-y-auto bg-white text-stone-900"
        style={{
          fontFamily:
            "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        }}
      >
        {/* ─── NAV ─── */}
        <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 pt-3 transition-all duration-300 pointer-events-none">
          <div
            className={`pointer-events-auto rounded-2xl transition-all duration-300 ease-in-out ${
              scrolled
                ? 'bg-white shadow-lg shadow-stone-900/10 border border-stone-100'
                : 'bg-white/90 backdrop-blur-md shadow-sm border border-white/60'
            }`}
          >
            <div className="px-5 sm:px-6 h-14 flex items-center justify-between">
              <Link
                href={routes.home}
                className="text-lg font-extrabold text-primary tracking-tight"
              >
                OddsCast
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  href={routes.auth.login}
                  className="text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors px-3 py-2 touch-manipulation"
                >
                  로그인
                </Link>
                <Link
                  href={routes.auth.register}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors touch-manipulation"
                >
                  무료 시작
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden text-white pt-32 pb-16 sm:pt-36 sm:pb-20 lg:pt-44 lg:pb-28 px-5 sm:px-8 lg:px-12">
          {/* Background image */}
          <Image
            src="/image/1.jpg"
            alt="Horse racing at the track"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a0a]/90 via-[#0d1f0d]/80 to-[#0d1f0d]/85" />
          {/* Radial green glow top-right */}
          <div className="absolute top-0 right-0 w-[70%] h-[80%] bg-[radial-gradient(ellipse_at_85%_20%,rgba(22,163,74,0.15),transparent_55%)] pointer-events-none" />
          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="max-w-[1100px] mx-auto relative z-10">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
              {/* Left: text */}
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-primary text-xs font-semibold tracking-wide">AI HORSE RACING ANALYTICS</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4 lg:mb-5">
                  데이터가 말하는
                  <br />
                  <span className="text-primary">경마의 흐름</span>을 읽다
                </h1>
                <p className="text-stone-300 text-base sm:text-lg leading-relaxed max-w-[520px] mb-7 break-keep break-words">
                  KRA 공식 데이터와 AI 수학 분석으로 경주를 객관적으로 예측합니다.
                  감이 아닌 데이터로, 경마를 더 스마트하게.
                </p>

                {/* Live stats */}
                {pct != null && (
                  <div className="flex items-center gap-5 sm:gap-8 mb-8">
                    <div>
                      <p className="text-3xl sm:text-4xl font-extrabold text-primary leading-none">
                        {pct}%
                      </p>
                      <p className="text-xs text-stone-400 mt-1">예측률</p>
                    </div>
                    <div className="w-px h-10 bg-stone-700" />
                    <div>
                      <p className="text-3xl sm:text-4xl font-extrabold text-white leading-none">
                        {totalPredictions.toLocaleString()}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">누적 예측</p>
                    </div>
                    <div className="w-px h-10 bg-stone-700" />
                    <div>
                      <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 leading-none">
                        {hitCount.toLocaleString()}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">적중</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={routes.auth.register}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white text-base font-bold hover:bg-primary-dark transition-colors touch-manipulation shadow-[0_0_24px_rgba(22,163,74,0.4)]"
                  >
                    <Icon name="UserPlus" size={18} />
                    무료로 시작하기
                  </Link>
                  <Link
                    href={routes.predictions.matrix}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 text-stone-200 text-base font-semibold hover:bg-white/15 transition-colors touch-manipulation border border-white/20 backdrop-blur-sm"
                  >
                    <Icon name="BarChart2" size={18} />
                    예상표 미리보기
                  </Link>
                </div>
              </div>

              {/* Right: mock prediction card (desktop only) */}
              <div className="hidden lg:flex justify-center items-center">
                <div className="w-full max-w-[360px]">
                  <MockPredictionCard compact />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TRUST STRIP ─── */}
        <div className="bg-stone-900 border-y border-stone-800">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-8 lg:px-12 py-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-6 gap-y-2">
              {[
                { icon: "ShieldCheck" as const, label: "KRA 공공데이터 기반" },
                { icon: "BarChart2" as const, label: "15요소 수학 분석" },
                { icon: "Target" as const, label: "투명한 예측률 공개" },
                { icon: "RefreshCw" as const, label: "매 경주일 자동 업데이트" },
                { icon: "Bell" as const, label: "경주 시작 전 알림" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-stone-400">
                  <Icon name={item.icon} size={13} className="text-primary shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── PREVIEW CARD SECTION (mobile full / desktop hidden in hero) ─── */}
        <div className="lg:hidden bg-stone-900 px-5 sm:px-8 py-10">
          <div className="max-w-[560px] mx-auto">
            <p className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">AI PREDICTION PREVIEW</p>
            <h3 className="text-center text-lg font-extrabold text-white mb-6">실제로 이런 분석을 받아보세요</h3>
            <MockPredictionCard />
          </div>
        </div>

        {/* ─── FEATURES ─── */}
        <Section id="features" className="bg-white">
          <div className="text-center mb-10">
            <SectionLabel>WHY ODDSCAST</SectionLabel>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              왜 OddsCast인가요?
            </h2>
            <p className="text-stone-500 text-sm mt-3 max-w-[480px] mx-auto break-keep break-words">
              감이 아닌 데이터로 경마를 분석합니다. 수학과 AI가 만든 객관적인 예측 정보를 제공합니다.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              accent="emerald"
              icon={<Icon name="BarChart2" size={22} className="text-emerald-600" />}
              title="수학 기반 AI 분석"
              desc="Python 수학 엔진과 AI가 출전마, 기수, 훈련 데이터를 종합 분석합니다. 감이 아닌 수치로 예측합니다."
            />
            <FeatureCard
              accent="blue"
              icon={<Icon name="Target" size={22} className="text-blue-600" />}
              title="투명한 예측률 공개"
              desc="모든 예측 결과를 숨기지 않고 공개합니다. 경마장별, 월별 정확도를 직접 확인하세요."
            />
            <FeatureCard
              accent="teal"
              icon={<Icon name="RefreshCw" size={22} className="text-teal-600" />}
              title="KRA 실시간 데이터"
              desc="한국마사회 공공데이터를 실시간으로 수집합니다. 출전마, 기수 성적, 훈련 기록까지 자동 반영됩니다."
            />
            <FeatureCard
              accent="violet"
              icon={<Icon name="ClipboardList" size={22} className="text-violet-600" />}
              title="종합 예상표"
              desc="매 경주일마다 전 경주를 종합 분석한 예상표를 제공합니다. 한눈에 오늘의 흐름을 파악하세요."
            />
            <FeatureCard
              accent="amber"
              icon={<Icon name="Star" size={22} className="text-amber-600" />}
              title="매일 경마 운세"
              desc="AI가 생성하는 오늘의 경마 운세로 하루를 시작하세요. 행운의 번호와 키워드를 확인할 수 있습니다."
            />
            <FeatureCard
              accent="rose"
              icon={<Icon name="Bell" size={22} className="text-rose-600" />}
              title="경주 알림"
              desc="경주 시작 전 푸시 알림으로 놓치지 않게 알려드립니다. 서울, 부산, 제주 경마장 모두 지원합니다."
            />
          </div>
        </Section>

        {/* ─── AI VISUAL DIVIDER ─── */}
        <section className="relative overflow-hidden py-16 sm:py-24 px-5 sm:px-8 lg:px-12">
          <Image
            src="/image/2.jpg"
            alt="AI horse racing data analysis visualization"
            fill
            className="object-cover object-center"
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1f0d]/92 via-[#0d1f0d]/75 to-[#0d1f0d]/40" />

          <div className="max-w-[1100px] mx-auto relative z-10">
            <div className="max-w-[520px]">
              <SectionLabel>AI POWERED</SectionLabel>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
                데이터가 보이지 않던
                <br />
                <span className="text-primary">패턴을 발견합니다</span>
              </h2>
              <p className="text-stone-300 text-base leading-relaxed mb-6 break-keep break-words">
                12가지 수학적 지표로 말의 컨디션을 수치화하고,
                AI가 기수 궁합·페이스 전개·주로 바이어스까지 정성적으로
                분석합니다.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {[
                  "출전마 폼 분석",
                  "기수 성적",
                  "훈련 강도",
                  "당일 피로도",
                  "AI 추론",
                  "페이스 전개",
                  "주로 바이어스",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <Section className="bg-stone-50">
          <div className="text-center mb-10">
            <SectionLabel>HOW IT WORKS</SectionLabel>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              3단계로 시작하세요
            </h2>
          </div>
          <div className="max-w-[700px] mx-auto">
            <div className="grid sm:grid-cols-3 gap-0 sm:gap-0 relative">
              {/* connecting line (desktop) */}
              <div className="hidden sm:block absolute top-5 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-px bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
              {[
                {
                  step: 1,
                  icon: "UserPlus" as const,
                  title: "무료 회원가입",
                  desc: "이메일로 간편하게 가입. 가입 즉시 예측 티켓을 드립니다.",
                },
                {
                  step: 2,
                  icon: "ClipboardList" as const,
                  title: "경주 확인",
                  desc: "오늘의 경주 목록과 AI 종합 예상표를 한눈에 확인합니다.",
                },
                {
                  step: 3,
                  icon: "Sparkles" as const,
                  title: "AI 분석 열람",
                  desc: "티켓으로 상세 AI 분석을 열람. 수학 점수와 AI 추론을 확인합니다.",
                },
              ].map((item, idx) => (
                <div key={item.step} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center relative pb-6 sm:pb-0">
                  {/* Mobile connector */}
                  {idx < 2 && (
                    <div className="sm:hidden absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-primary/40 to-stone-200" />
                  )}
                  <div className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                    <Icon name={item.icon} size={18} />
                  </div>
                  <div className="sm:mt-4 sm:px-3">
                    <p className="text-[10px] font-bold text-primary tracking-widest mb-1">STEP {item.step}</p>
                    <h4 className="text-sm font-bold text-stone-900 mb-1">{item.title}</h4>
                    <p className="text-xs text-stone-500 leading-relaxed break-keep break-words">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── ACCURACY STATS ─── */}
        {pct != null && (
          <section className="relative overflow-hidden py-16 sm:py-20 px-5 sm:px-8 lg:px-12 text-white">
            <Image
              src="/image/3.jpg"
              alt="Thoroughbred racehorse close-up"
              fill
              className="object-cover object-[center_25%]"
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d1f0d]/92 via-[#0d1f0d]/85 to-[#0d1f0d]/70" />

            <div className="max-w-[1100px] mx-auto relative z-10">
              <div className="text-center mb-10">
                <SectionLabel>TRACK RECORD</SectionLabel>
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  검증된 예측 성과
                </h2>
                <p className="text-stone-400 text-sm mt-2 break-keep break-words">
                  실제 경주 결과와 대조한 실측 데이터입니다
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-6 max-w-[720px] mx-auto">
                <div className="text-center rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                  <p className="text-5xl sm:text-6xl font-extrabold text-primary leading-none">
                    {pct}%
                  </p>
                  <p className="text-stone-300 text-sm mt-3 font-medium">예측률</p>
                  <p className="text-stone-500 text-xs mt-1">3착 이내 적중 기준</p>
                </div>
                <div className="text-center rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                  <p className="text-5xl sm:text-6xl font-extrabold text-white leading-none">
                    {totalPredictions.toLocaleString()}
                  </p>
                  <p className="text-stone-300 text-sm mt-3 font-medium">누적 예측 건수</p>
                  <p className="text-stone-500 text-xs mt-1">서울·부산·제주 합산</p>
                </div>
                <div className="text-center rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                  <p className="text-5xl sm:text-6xl font-extrabold text-emerald-400 leading-none">
                    {hitCount.toLocaleString()}
                  </p>
                  <p className="text-stone-300 text-sm mt-3 font-medium">적중 건수</p>
                  <p className="text-stone-500 text-xs mt-1">AI 예측 vs 실제 결과</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── PRICING ─── */}
        {activePlans.length > 0 && (
          <Section id="pricing" className="bg-stone-50">
            <div className="text-center mb-10">
              <SectionLabel>PRICING</SectionLabel>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-2">
                구독 플랜
              </h2>
              <p className="text-stone-500 text-sm break-keep break-words">
                매월 자동 결제 · 언제든지 해지 가능
              </p>
            </div>
            <div
              className={`grid gap-5 max-w-[900px] mx-auto ${activePlans.length === 3 ? "sm:grid-cols-3" : activePlans.length === 2 ? "sm:grid-cols-2" : ""}`}
            >
              {activePlans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} recommended={i === 1} />
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-stone-400">
              <span className="flex items-center gap-1.5"><Icon name="Check" size={12} className="text-primary" />구독 없이 개별 구매 가능</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={12} className="text-primary" />경주 예측 1장 500원</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={12} className="text-primary" />종합 예상 1일 1,000원</span>
            </div>
          </Section>
        )}

        {/* ─── FAQ ─── */}
        <Section className="bg-white">
          <div className="text-center mb-10">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              자주 묻는 질문
            </h2>
          </div>
          <div className="max-w-[700px] mx-auto space-y-3">
            {[
              {
                q: "OddsCast는 베팅 사이트인가요?",
                a: "아닙니다. OddsCast는 AI 데이터 분석 콘텐츠 서비스입니다. 베팅이나 배팅 기능은 일절 제공하지 않습니다.",
              },
              {
                q: "AI 예측은 어떤 데이터를 기반으로 하나요?",
                a: "KRA 공공데이터포털의 경주 기록, 출전마 성적, 기수 성적, 훈련 기록 등을 수학적으로 분석하고, AI가 종합 추론합니다.",
              },
              {
                q: "무료로 이용할 수 있나요?",
                a: "회원가입 시 예측 티켓을 무료로 드립니다. 이후 개별 예측권(500원)이나 종합 예상 티켓(1,000원)을 구매하거나, 구독 플랜으로 더 저렴하게 이용할 수 있습니다.",
              },
              {
                q: "구독은 어떻게 해지하나요?",
                a: "마이페이지에서 언제든 해지할 수 있으며, 해지 후에도 남은 기간까지는 정상 이용 가능합니다.",
              },
              {
                q: "어떤 경마장을 지원하나요?",
                a: "서울(과천), 부산(경남), 제주 경마장의 모든 경주를 지원합니다.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl border border-stone-200 bg-stone-50 hover:border-stone-300 transition-colors"
              >
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-bold text-stone-900 touch-manipulation list-none [&::-webkit-details-marker]:hidden">
                  {q}
                  <Icon
                    name="ChevronDown"
                    size={16}
                    className="text-stone-400 group-open:rotate-180 transition-transform shrink-0 ml-2"
                  />
                </summary>
                <div className="px-5 pb-4 text-sm text-stone-600 leading-relaxed break-keep break-words">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </Section>

        {/* ─── FINAL CTA ─── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1a0a] via-[#0d1f0d] to-[#1a2b1a] text-white px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(22,163,74,0.12),transparent_60%)] pointer-events-none" />
          <div className="max-w-[700px] mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 mb-5">
              <Icon name="Sparkles" size={12} className="text-primary" />
              <span className="text-primary text-xs font-semibold">무료로 시작하세요</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
              지금 시작하세요
            </h2>
            <p className="text-stone-400 text-base mb-8 leading-relaxed break-keep break-words">
              회원가입은 무료이며, 가입 즉시 AI 예측 분석을 체험할 수 있습니다.
              구독 없이도 개별 구매로 이용 가능합니다.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={routes.auth.register}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white text-base font-bold hover:bg-primary-dark transition-colors touch-manipulation shadow-[0_0_28px_rgba(22,163,74,0.35)]"
              >
                <Icon name="UserPlus" size={18} />
                무료 회원가입
              </Link>
              <Link
                href={routes.home}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white/10 text-stone-300 text-base font-semibold hover:bg-white/15 transition-colors touch-manipulation border border-white/10"
              >
                홈페이지 둘러보기
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="bg-[#081208] text-stone-600 px-5 sm:px-8 lg:px-12 py-8">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-5 mb-5">
              <div>
                <p className="font-extrabold text-stone-300 text-base mb-1">OddsCast</p>
                <p className="text-xs text-stone-600 break-keep">AI 분석 콘텐츠 서비스 · 베팅을 권유하지 않습니다</p>
              </div>
              <div className="flex items-center gap-5 text-xs">
                <Link href={routes.legal.terms} className="hover:text-stone-400 transition-colors">이용약관</Link>
                <Link href={routes.legal.privacy} className="hover:text-stone-400 transition-colors">개인정보처리방침</Link>
                <Link href={routes.legal.refund} className="hover:text-stone-400 transition-colors">환불정책</Link>
              </div>
            </div>
            <div className="border-t border-stone-800 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-stone-700">
              <p>© {new Date().getFullYear()} OddsCast. All rights reserved.</p>
              <p>고객센터: support@oddscast.com</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
