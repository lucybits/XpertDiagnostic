import { Suspense } from 'react';
import type { Metadata } from 'next';
import PatientResultScreen from '@/components/result/PatientResultScreen';

export const metadata: Metadata = {
  title: 'Resultado del expediente | XpertDiagnostic',
};

/**
 * Interfaz de salida del expediente (P-105). El ID del paciente (dato de la URL) se lee dentro de
 * <Suspense>, como pide Next 16 con cacheComponents, para no atar el armazón de la página a un paciente.
 */
export default function PatientResultPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" />}>
      <ResultForPatient params={params} />
    </Suspense>
  );
}

async function ResultForPatient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientResultScreen patientId={id} />;
}
