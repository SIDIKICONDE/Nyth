/**
 * React Native (iOS/Android) stub for audio worker to avoid bundling web worker code.
 */

import { useMemo } from 'react';

export const useAudioWorker = () => {
	const api = useMemo(() => {
		return {
			isReady: false,
			error: new Error('Web Workers are not supported on React Native'),
			processSpectrum: async (audioData: Float32Array | Float64Array) => audioData,
			calculateRMS: async (_audioData: Float32Array, _windowSize: number = 1024) => new Float32Array(0),
			applyFilter: async (audioData: Float32Array) => audioData,
			processBatch: async (operations: any[]) => operations,
		};
	}, []);

	return api;
};
