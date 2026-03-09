import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='ko' className='overflow-x-hidden'>
      <Head>
        <link rel='icon' type='image/png' href='/oddscast-logo.png' />
        <link rel='apple-touch-icon' href='/oddscast-logo.png' />
        <link rel='manifest' href='/manifest.json' />
        <meta name='application-name' content='OddsCast' />
        <meta name='apple-mobile-web-app-title' content='OddsCast' />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
      </Head>
      <body className='antialiased'>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
