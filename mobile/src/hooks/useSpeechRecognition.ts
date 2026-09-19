import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import {
  addEventListener,
  startListening,
  stopListening,
  speechRecogntionEvents,
} from 'react-native-speech-recognition-kit';

interface ResultsPayload {
  value: string;
}

interface ErrorPayload {
  message: string;
  code: number;
}

// Wraps react-native-speech-recognition-kit's event-based API (see the library's own
// README — there's no promise-based "listen once and get the final transcript" call) into
// a hook that resolves once with the final transcript, which is all every call site here
// needs; live partial results are exposed too for showing text as the user speaks.
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Resolves the in-flight `listen()` promise from the RESULTS event — a ref because the
  // event listener closure is set up once and must see whichever promise is currently open.
  const resolveRef = useRef<((transcript: string) => void) | null>(null);

  useEffect(() => {
    const startSub = addEventListener(speechRecogntionEvents.START, () => {
      setIsListening(true);
      setError(null);
      setPartialTranscript('');
    });
    const endSub = addEventListener(speechRecogntionEvents.END, () => {
      setIsListening(false);
    });
    const partialSub = addEventListener(
      speechRecogntionEvents.PARTIAL_RESULTS,
      (event: ResultsPayload) => setPartialTranscript(event.value || ''),
    );
    const resultsSub = addEventListener(speechRecogntionEvents.RESULTS, (event: ResultsPayload) => {
      resolveRef.current?.(event.value || '');
      resolveRef.current = null;
    });
    const errorSub = addEventListener(speechRecogntionEvents.ERROR, (event: ErrorPayload) => {
      setIsListening(false);
      setError(event.message || 'Speech recognition failed');
      resolveRef.current?.('');
      resolveRef.current = null;
    });

    return () => {
      startSub.remove();
      endSub.remove();
      partialSub.remove();
      resultsSub.remove();
      errorSub.remove();
    };
  }, []);

  // Starts listening and resolves with the final transcript once the user stops speaking
  // (or `stop()` is called). Resolves to '' on error rather than rejecting, since a failed
  // listen (permission denied, no speech detected) is a normal outcome callers handle via
  // the `error` state, not an exceptional one.
  //
  // Android's native module checks RECORD_AUDIO itself but only ever rejects if it's
  // missing — it never prompts — so the request has to happen here first. iOS's module
  // calls SFSpeechRecognizer/AVAudioSession authorization internally on startListening(),
  // so no equivalent pre-request is needed there.
  const listen = useCallback(async (): Promise<string> => {
    if (Platform.OS === 'android') {
      let status = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
      if (status !== RESULTS.GRANTED) {
        status = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      }
      if (status !== RESULTS.GRANTED) {
        setError('Microphone permission is required to add tasks by voice.');
        return '';
      }
    }

    const result = new Promise<string>(resolve => {
      resolveRef.current = resolve;
    });
    try {
      await startListening();
    } catch (err: any) {
      resolveRef.current = null;
      setError(err?.message || 'Could not start listening');
      return '';
    }
    return result;
  }, []);

  const stop = useCallback(() => {
    stopListening();
  }, []);

  return { isListening, partialTranscript, error, listen, stop };
}
