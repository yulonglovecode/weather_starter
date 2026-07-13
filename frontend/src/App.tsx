import { StoreProvider } from './state/store';
import { ThemeProvider } from './theme/ThemeContext';
import { Layout } from './components/Layout';

export function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <Layout />
      </StoreProvider>
    </ThemeProvider>
  );
}
