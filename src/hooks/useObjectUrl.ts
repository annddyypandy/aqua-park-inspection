import { useEffect, useState } from 'react';

export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!blob || blob.size === 0) {
      setUrl(undefined);
      return;
    }

    const next = URL.createObjectURL(blob);
    setUrl(next);

    return () => {
      URL.revokeObjectURL(next);
    };
  }, [blob]);

  return url;
}
