import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='ko' className='overflow-x-hidden'>
      <Head>
        <link rel='icon' type='image/png' href='/oddscast-logo.png' />
        <link rel='apple-touch-icon' href='/oddscast-logo.png' />
        <link rel='manifest' href='/manifest.json' />
      </Head>
      <body className='antialiased'>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
