/**
 * Update Log page — renders /public/update-log.md as styled HTML
 */
import { GetStaticProps } from 'next';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import { routes } from '@/lib/routes';

interface Props {
  sections: UpdateSection[];
}

interface UpdateSection {
  version: string;
  date: string;
  groups: UpdateGroup[];
}

interface UpdateGroup {
  title: string;
  items: string[];
}

/** Parse the markdown into structured sections */
function parseUpdateLog(md: string): UpdateSection[] {
  const sections: UpdateSection[] = [];
  let currentSection: UpdateSection | null = null;
  let currentGroup: UpdateGroup | null = null;

  for (const line of md.split('\n')) {
    const trimmed = line.trim();

    // ## v2.4.0 — 2026년 3월 19일
    const sectionMatch = trimmed.match(/^## (v[\d.]+)\s*[—–-]\s*(.+)$/);
    if (sectionMatch) {
      if (currentGroup && currentSection) currentSection.groups.push(currentGroup);
      if (currentSection) sections.push(currentSection);
      currentSection = { version: sectionMatch[1]!, date: sectionMatch[2]!, groups: [] };
      currentGroup = null;
      continue;
    }

    // ### AI 예측 정확도 대폭 개선
    const groupMatch = trimmed.match(/^### (.+)$/);
    if (groupMatch && currentSection) {
      if (currentGroup) currentSection.groups.push(currentGroup);
      currentGroup = { title: groupMatch[1]!, items: [] };
      continue;
    }

    // - **15요소 분석 모델**: description
    const itemMatch = trimmed.match(/^- (.+)$/);
    if (itemMatch && currentGroup) {
      currentGroup.items.push(itemMatch[1]!);
      continue;
    }
  }

  if (currentGroup && currentSection) currentSection.groups.push(currentGroup);
  if (currentSection) sections.push(currentSection);

  return sections;
}

/** Convert markdown bold **text** to HTML */
function renderInline(text: string) {
  const parts: Array<{ bold: boolean; text: string }> = [];
  let remaining = text;
  while (remaining) {
    const match = remaining.match(/\*\*(.+?)\*\*/);
    if (!match || match.index === undefined) {
      parts.push({ bold: false, text: remaining });
      break;
    }
    if (match.index > 0) {
      parts.push({ bold: false, text: remaining.slice(0, match.index) });
    }
    parts.push({ bold: true, text: match[1]! });
    remaining = remaining.slice(match.index + match[0].length);
  }
  return parts.map((p, i) =>
    p.bold ? <strong key={i} className='font-semibold text-foreground'>{p.text}</strong> : <span key={i}>{p.text}</span>,
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const mdPath = path.join(process.cwd(), 'public', 'update-log.md');
  const md = fs.readFileSync(mdPath, 'utf-8');
  const sections = parseUpdateLog(md);
  return { props: { sections } };
};

export default function UpdateLogPage({ sections }: Props) {
  return (
    <Layout title='업데이트 내역 | OddsCast'>
      <Head>
        <meta name='description' content='OddsCast 서비스 업데이트 내역 — 새로운 기능, UI 개선, AI 분석 강화' />
      </Head>
      <div className='max-w-2xl mx-auto pb-16'>
        <CompactPageTitle title='업데이트 내역' backHref={routes.profile.index} />

        <div className='space-y-8 mt-2'>
          {sections.map((section) => (
            <article
              key={section.version}
              className='rounded-xl border border-border bg-card overflow-hidden'
            >
              {/* Version header */}
              <div className='bg-primary/5 border-b border-border px-4 py-3 md:px-5'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-bold text-primary'>{section.version}</span>
                  <span className='text-xs text-text-tertiary'>{section.date}</span>
                </div>
              </div>

              {/* Groups */}
              <div className='px-4 py-4 md:px-5 space-y-5'>
                {section.groups.map((group, gi) => (
                  <div key={gi}>
                    <h3 className='text-sm font-semibold text-foreground mb-2'>{group.title}</h3>
                    <ul className='space-y-1.5'>
                      {group.items.map((item, ii) => (
                        <li key={ii} className='flex items-start gap-2 text-sm text-text-secondary leading-relaxed'>
                          <span className='text-primary mt-1.5 shrink-0'>
                            <svg width='6' height='6' viewBox='0 0 6 6' fill='currentColor'>
                              <circle cx='3' cy='3' r='3' />
                            </svg>
                          </span>
                          <span className='break-keep'>{renderInline(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className='text-center text-xs text-text-tertiary mt-8'>
          더 이전 버전의 변경 사항은 준비 중입니다.
        </p>
      </div>
    </Layout>
  );
}
