import { createContext } from 'react';

interface LoadingContextProps {
  loadingGame: boolean;
  loadingSlider: boolean;
  setLoadingGame: (loading: boolean) => void;
  setLoadingSlider: (loading: boolean) => void;
}

export const LoadingContext = createContext<LoadingContextProps>({
  loadingSlider: false,
  setLoadingSlider: () => {},
  loadingGame: false,
  setLoadingGame: () => {},
});
