import type { GetStaticPropsContext } from 'next';
import { getMessages } from '@/i18n';

/**
 * Shared getStaticProps for i18n message loading.
 * Use in pages: export { getStaticProps } from '@/lib/i18nProps';
 * Or spread into existing getStaticProps.
 */
export async function getStaticProps(ctx: GetStaticPropsContext) {
  const locale = ctx.locale ?? 'ko';
  return {
    props: {
      messages: await getMessages(locale),
    },
  };
}

/** Helper for pages with existing getStaticProps — merge messages into props */
export async function loadI18nMessages(locale: string | undefined) {
  return getMessages(locale ?? 'ko');
}
