import type { GetServerSideProps } from 'next';

// Permanent redirect — results are now inline in /races
export default function ResultsRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/races',
      permanent: true,
    },
  };
};
