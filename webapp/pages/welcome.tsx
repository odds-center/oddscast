/**
 * Marketing landing page — standalone full-width design
 * No floating app bar, custom layout for conversion-focused UX
 */
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
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

/* ─── Feature card ─── */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-600 leading-relaxed break-keep break-words">
        {desc}
      </p>
    </div>
  );
}

/* ─── Step card ─── */
function StepCard({
  step,
  title,
  desc,
}: {
  step: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
        {step}
      </div>
      <h4 className="text-base font-bold text-stone-900 mb-1.5">{title}</h4>
      <p className="text-sm text-stone-600 leading-relaxed break-keep break-words">
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
      className={`rounded-2xl border-2 p-6 sm:p-7 relative ${recommended ? "border-primary bg-primary/3 shadow-md" : "border-stone-200 bg-white"}`}
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

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
  // Hit rate: races where at least 1 predicted horse finished top-3
  // More intuitive than averageAccuracy (partial overlap score)
  const pct =
    totalPredictions > 0 ? Math.round((hitCount / totalPredictions) * 100) : null;

  const activePlans = (plans ?? [])
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Ensure absolute URL for OG image — crawlers cannot access relative or localhost URLs
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
        {/* Open Graph */}
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
        <meta
          property="og:image:alt"
          content="OddsCast - AI 경마 예측 서비스"
        />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="OddsCast - AI 경마 예측 서비스" />
        <meta
          name="twitter:description"
          content="데이터와 AI가 분석하는 경마 예측. 수학 기반 분석, 실시간 경주 정보, 투명한 적중률 공개."
        />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <div
        className="min-h-screen bg-white text-stone-900"
        style={{
          fontFamily:
            "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        }}
      >
        {/* ─── NAV ─── */}
        <header className="fixed top-0 left-0 right-0 z-50 px-0 transition-all duration-300">
          <div
            className={`mx-auto transition-all duration-300 ease-in-out ${
              scrolled
                ? 'mt-3 mx-4 sm:mx-6 rounded-2xl bg-white shadow-lg shadow-stone-900/10 border border-stone-100'
                : 'mt-0 mx-0 rounded-none bg-white border-b border-stone-100'
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
        <section className="relative overflow-hidden text-white pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-28 px-5 sm:px-8 lg:px-12">
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f0d]/80 via-[#0d1f0d]/75 to-[#0d1f0d]/90" />
          {/* Green glow */}
          <div className="absolute top-0 right-0 w-[60%] h-full bg-[radial-gradient(ellipse_at_80%_30%,rgba(22,163,74,0.12),transparent_60%)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />

          <div className="max-w-[1100px] mx-auto relative z-10">
            <p className="text-primary font-semibold text-sm sm:text-base mb-3 tracking-wide">
              AI HORSE RACING ANALYTICS
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4 lg:mb-6">
              데이터가 말하는
              <br />
              <span className="text-primary">경마의 흐름</span>을 읽다
            </h1>
            <p className="text-stone-300 text-base sm:text-lg leading-relaxed max-w-[540px] mb-8 break-keep break-words">
              KRA 공식 데이터와 AI 수학 분석으로 경주를 객관적으로 예측합니다.
              감이 아닌 데이터로, 경마를 더 스마트하게.
            </p>

            {/* Live stats */}
            {pct != null && (
              <div className="flex flex-wrap gap-4 sm:gap-6 mb-8">
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-primary">
                    {pct}%
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    예측 적중률
                  </p>
                </div>
                <div className="w-px bg-stone-700" />
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white">
                    {totalPredictions.toLocaleString()}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">누적 예측</p>
                </div>
                <div className="w-px bg-stone-700" />
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                    {hitCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">적중</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                href={routes.auth.register}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white text-base font-bold hover:bg-primary-dark transition-colors touch-manipulation shadow-[0_0_20px_rgba(22,163,74,0.35)]"
              >
                <Icon name="UserPlus" size={18} />
                무료로 시작하기
              </Link>
              <Link
                href={routes.predictions.matrix}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 text-stone-200 text-base font-semibold hover:bg-white/15 transition-colors touch-manipulation border border-white/15 backdrop-blur-sm"
              >
                <Icon name="BarChart2" size={18} />
                예상표 미리보기
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <Section id="features" className="bg-stone-50">
          <div className="text-center mb-10">
            <p className="text-primary font-semibold text-sm mb-2">
              WHY ODDSCAST
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              왜 OddsCast인가요?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={
                <Icon name="BarChart2" size={24} className="text-primary" />
              }
              title="수학 기반 AI 분석"
              desc="Python 수학 엔진과 AI가 출전마, 기수, 훈련 데이터를 종합 분석합니다. 감이 아닌 수치로 예측합니다."
            />
            <FeatureCard
              icon={<Icon name="Target" size={24} className="text-primary" />}
              title="투명한 적중률 공개"
              desc="모든 예측 결과를 숨기지 않고 공개합니다. 경마장별, 월별 정확도를 직접 확인하세요."
            />
            <FeatureCard
              icon={
                <Icon name="RefreshCw" size={24} className="text-primary" />
              }
              title="KRA 실시간 데이터"
              desc="한국마사회 공공데이터를 실시간으로 수집합니다. 출전마, 기수 성적, 훈련 기록까지 자동 반영됩니다."
            />
            <FeatureCard
              icon={
                <Icon name="ClipboardList" size={24} className="text-primary" />
              }
              title="종합 예상표"
              desc="매 경주일마다 전 경주를 종합 분석한 예상표를 제공합니다. 한눈에 오늘의 흐름을 파악하세요."
            />
            <FeatureCard
              icon={<Icon name="Star" size={24} className="text-primary" />}
              title="매일 경마 운세"
              desc="AI가 생성하는 오늘의 경마 운세로 하루를 시작하세요. 행운의 번호와 키워드를 확인할 수 있습니다."
            />
            <FeatureCard
              icon={<Icon name="Bell" size={24} className="text-primary" />}
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
          {/* Overlay: darker on left for text, lighter on right to show image */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1f0d]/90 via-[#0d1f0d]/70 to-[#0d1f0d]/40" />

          <div className="max-w-[1100px] mx-auto relative z-10">
            <div className="max-w-[520px]">
              <p className="text-primary font-semibold text-sm mb-3 tracking-wide">
                AI POWERED
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
                데이터가 보이지 않던
                <br />
                <span className="text-primary">패턴을 발견합니다</span>
              </h2>
              <p className="text-stone-300 text-base leading-relaxed mb-6 break-keep break-words">
                12가지 수학적 지표로 말의 컨디션을 수치화하고, AI가
                AI가 기수 궁합·페이스 전개·주로 바이어스까지 정성적으로
                분석합니다.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  "출전마 폼 분석",
                  "기수 성적",
                  "훈련 강도",
                  "당일 피로도",
                  "AI 추론",
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
        <Section className="bg-white">
          <div className="text-center mb-10">
            <p className="text-primary font-semibold text-sm mb-2">
              HOW IT WORKS
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              이용 방법
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
            <StepCard
              step={1}
              title="회원가입"
              desc="이메일로 간편하게 가입하세요. 가입 즉시 예측 티켓을 드립니다."
            />
            <StepCard
              step={2}
              title="경주 확인"
              desc="오늘의 경주 목록과 AI 종합 예상표를 확인하세요. 출전마 데이터도 한눈에."
            />
            <StepCard
              step={3}
              title="AI 분석 열람"
              desc="예측 티켓으로 상세 AI 분석을 열람하세요. 수학 기반 점수와 AI 추론을 확인합니다."
            />
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
            {/* Heavy dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d1f0d]/92 via-[#0d1f0d]/85 to-[#0d1f0d]/70" />

            <div className="max-w-[1100px] mx-auto relative z-10">
              <div className="text-center mb-10">
                <p className="text-primary font-semibold text-sm mb-2">
                  TRACK RECORD
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  검증된 예측 성과
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-6 max-w-[700px] mx-auto">
                <div className="text-center">
                  <p className="text-5xl sm:text-6xl font-extrabold text-primary leading-none">
                    {pct}%
                  </p>
                  <p className="text-stone-400 text-sm mt-2">예측 적중률</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl sm:text-6xl font-extrabold text-white leading-none">
                    {totalPredictions.toLocaleString()}
                  </p>
                  <p className="text-stone-400 text-sm mt-2">누적 예측 건수</p>
                </div>
                <div className="text-center">
                  <p className="text-5xl sm:text-6xl font-extrabold text-emerald-400 leading-none">
                    {hitCount.toLocaleString()}
                  </p>
                  <p className="text-stone-400 text-sm mt-2">적중 건수</p>
                </div>
              </div>
              <p className="text-center text-stone-500 text-xs mt-8 break-keep break-words">
                모든 수치는 실제 경주 결과와 대조한 실측 데이터입니다.
              </p>
            </div>
          </section>
        )}

        {/* ─── PRICING ─── */}
        {activePlans.length > 0 && (
          <Section id="pricing" className="bg-stone-50">
            <div className="text-center mb-10">
              <p className="text-primary font-semibold text-sm mb-2">PRICING</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-2">
                구독 플랜
              </h2>
              <p className="text-stone-500 text-sm break-keep break-words">
                매월 자동 결제, 언제든지 해지 가능
              </p>
            </div>
            <div
              className={`grid gap-5 max-w-[900px] mx-auto ${activePlans.length === 3 ? "sm:grid-cols-3" : activePlans.length === 2 ? "sm:grid-cols-2" : ""}`}
            >
              {activePlans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} recommended={i === 1} />
              ))}
            </div>
            <p className="text-center text-stone-400 text-xs mt-6 break-keep break-words">
              구독 없이도 개별 구매가 가능합니다. 개별 예측권 500원, 종합 예상
              티켓 1일 1장 1,000원.
            </p>
          </Section>
        )}

        {/* ─── FAQ ─── */}
        <Section className="bg-white">
          <div className="text-center mb-10">
            <p className="text-primary font-semibold text-sm mb-2">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              자주 묻는 질문
            </h2>
          </div>
          <div className="max-w-[700px] mx-auto space-y-4">
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
                className="group rounded-xl border border-stone-200 bg-white"
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
        <section className="bg-gradient-to-b from-[#0d1f0d] to-[#1a2b1a] text-white px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
          <div className="max-w-[700px] mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
              지금 시작하세요
            </h2>
            <p className="text-stone-400 text-base mb-8 leading-relaxed break-keep break-words">
              회원가입은 무료이며, 가입 즉시 AI 예측 분석을 체험할 수 있습니다.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={routes.auth.register}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white text-base font-bold hover:bg-primary-dark transition-colors touch-manipulation shadow-[0_0_24px_rgba(22,163,74,0.3)]"
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
        <footer className="bg-[#0a170a] text-stone-500 px-5 sm:px-8 lg:px-12 py-8">
          <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              <span className="font-bold text-stone-400">OddsCast</span> &copy;{" "}
              {new Date().getFullYear()}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <Link
                href={routes.legal.terms}
                className="hover:text-stone-300 transition-colors"
              >
                이용약관
              </Link>
              <Link
                href={routes.legal.privacy}
                className="hover:text-stone-300 transition-colors"
              >
                개인정보처리방침
              </Link>
              <Link
                href={routes.legal.refund}
                className="hover:text-stone-300 transition-colors"
              >
                환불정책
              </Link>
            </div>
            <p className="text-xs text-stone-600 break-keep break-words">
              AI 분석 콘텐츠 서비스이며, 베팅을 권유하지 않습니다.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
