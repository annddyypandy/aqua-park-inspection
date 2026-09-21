import { useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveOptions {
  enabled: boolean;
  delayMs?: number;
  /** When true, the first snapshot is treated as already persisted. */
  skipInitial?: boolean;
}

export function useDebouncedAutoSave<T>(
  value: T,
  save: (value: T) => Promise<void>,
  options: AutoSaveOptions,
): SaveStatus {
  const { enabled, delayMs = 400, skipInitial = true } = options;
  const [status, setStatus] = useState<SaveStatus>('idle');
  const skipFirst = useRef(skipInitial);
  const saveRef = useRef(save);
  const latestValue = useRef(value);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  saveRef.current = save;
  latestValue.current = value;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }

    dirtyRef.current = true;
    setStatus('saving');

    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      void saveRef
        .current(latestValue.current)
        .then(() => {
          dirtyRef.current = false;
          setStatus('saved');
        })
        .catch(() => {
          setStatus('error');
        });
    }, delayMs);

    return () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [delayMs, enabled, value]);

  useEffect(() => {
    const flush = () => {
      if (!enabled || !dirtyRef.current) {
        return;
      }

      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }

      dirtyRef.current = false;
      setStatus('saving');
      void saveRef
        .current(latestValue.current)
        .then(() => setStatus('saved'))
        .catch(() => {
          dirtyRef.current = true;
          setStatus('error');
        });
    };

    const onHidden = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };

    // pagehide is the reliable iOS Safari / PWA close signal.
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHidden);

    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHidden);
      flush();
    };
  }, [enabled]);

  return status;
}
