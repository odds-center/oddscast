import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='ko'>
      <Head>
        <link rel='icon' type='image/png' href='/oddscast-logo.png' />
        <link rel='apple-touch-icon' href='/oddscast-logo.png' />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
