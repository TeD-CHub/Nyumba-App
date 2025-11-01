import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import PropertyDetailPage from './components/PropertyDetailPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import PropertyForm from './components/PropertyForm';
import { SearchParams } from './components/HomePage';

type Page = 'home' | 'search' | 'property' | 'login' | 'dashboard' | 'add-property' | 'edit-property';

interface PageState {
  page: Page;
  data?: {
    propertyId?: string;
    searchParams?: SearchParams;
  };
}

function App() {
  const [pageState, setPageState] = useState<PageState>({ page: 'home' });

  const navigate = (page: string, data?: PageState['data']) => {
    setPageState({ page: page as Page, data });
  };

  return (
    
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={navigate} currentPage={pageState.page} />

        {pageState.page === 'home' && <HomePage onNavigate={navigate} />}
        {pageState.page === 'search' && (
          <SearchPage onNavigate={navigate} initialParams={pageState.data?.searchParams} />
        )}
        {pageState.page === 'property' && pageState.data?.propertyId && (
          <PropertyDetailPage propertyId={pageState.data.propertyId} onNavigate={navigate} />
        )}
        {pageState.page === 'login' && <AuthPage onNavigate={navigate} />}
        {pageState.page === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {pageState.page === 'add-property' && <PropertyForm onNavigate={navigate} />}
        {pageState.page === 'edit-property' && pageState.data?.propertyId && (
          <PropertyForm propertyId={pageState.data.propertyId} onNavigate={navigate} />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
