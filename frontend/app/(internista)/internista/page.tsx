import type { Metadata } from 'next';
import InternistScreen from '@/components/internist/InternistScreen';

export const metadata: Metadata = {
  title: 'Internista | XpertDiagnostic',
};

/**
 * Ruta /internista: pantalla del médico internista (rol I, P-140). Solo internistas: proxy.ts
 * redirige a los demás a la pantalla de su rol. El contenido está aplazado; la vista vive en
 * components/internist/.
 */
export default function InternistPage() {
  return <InternistScreen />;
}
