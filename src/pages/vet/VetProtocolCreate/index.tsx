import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { vetApi } from '../../../api/vetApi';
import { useFetch } from '../../../hooks/useFetch';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ProtocolForm } from './ProtocolForm';

export const VetProtocolCreate: React.FC = () => {
  const [params] = useSearchParams();
  const replaceId = params.get('replace') ?? undefined;
  const { data, loading, error, reload } = useFetch(() => vetApi.getProtocolForm({ replaceId }), [replaceId]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  return <ProtocolForm key={replaceId ?? 'new'} data={data} horseParam={params.get('horse') ?? ''} caseParam={params.get('case') ?? ''} />;
};
