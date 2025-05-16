import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { ThemeProvider as ShadcnThemeProvider } from './components/ui/theme-provider';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { HomePage } from './pages/HomePage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { HealthCheck } from './components/HealthCheck';
import './App.css';

// Lazy loaded components
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage').then(module => ({ default: module.SearchResultsPage })));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage').then(module => ({ default: module.CreatePostPage })));
const EditPostPage = lazy(() => import('./pages/EditPostPage').then(module => ({ default: module.EditPostPage })));
const MyPostsPage = lazy(() => import('./pages/MyPostsPage').then(module => ({ default: module.MyPostsPage })));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage').then(module => ({ default: module.PostDetailPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const CreateAdvertPage = lazy(() => import('./pages/CreateAdvertPage').then(module => ({ default: module.CreateAdvertPage })));
const EditAdvertPage = lazy(() => import('./pages/EditAdvertPage').then(module => ({ default: module.EditAdvertPage })));
const MyAdvertsPage = lazy(() => import('./pages/MyAdvertsPage').then(module => ({ default: module.MyAdvertsPage })));
const AdvertDetailPage = lazy(() => import('./pages/AdvertDetailPage').then(module => ({ default: module.AdvertDetailPage })));

function App() {
  useEffect(() => {
    // Clear console in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.clear();
    }
  }, []);

  // Add a log at the beginning of the App component to see all routes
  console.log("Available routes in App:", [
    // List all your routes here that are defined in the Router
    { path: '/', element: 'HomePage' },
    { path: '/login', element: 'Login' },
    { path: '/register', element: 'Register' },
    { path: '/my-adverts', element: <Navigate to="/my-posts" replace /> },
    { path: '/adverts/:id', element: 'AdvertDetailPage' },
    { path: '/edit-advert/:id', element: 'EditAdvertPage' },
    // Add all other routes here
  ]);

  console.log("HealthCheck import:", HealthCheck);
  console.log("Before rendering HealthCheck component:", HealthCheck);

  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ShadcnThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <div className="w-full min-h-screen">
              <HealthCheck />
              <Suspense fallback={<div className="loading">Loading...</div>}>
                <Routes>
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/posts/:id" element={<PostDetailPage />} />
                    <Route path="/adverts/:id" element={<AdvertDetailPage />} />
                    <Route path="/create-post" element={
                      <ProtectedRoute>
                        <CreatePostPage />
                      </ProtectedRoute>
                    } />
                  </Route>

                  <Route element={<Layout />}>
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/posts/create" element={
                      <ProtectedRoute>
                        <CreatePostPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/posts/edit/:id" element={
                      <ProtectedRoute>
                        <EditPostPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/my-posts" element={
                      <ProtectedRoute>
                        <MyPostsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/adverts/create" element={
                      <ProtectedRoute>
                        <CreateAdvertPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/adverts/edit/:id" element={
                      <ProtectedRoute>
                        <EditAdvertPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/my-adverts" element={
                      <ProtectedRoute>
                        <MyAdvertsPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/edit-advert/:id" element={
                      <ProtectedRoute>
                        <EditAdvertPage />
                      </ProtectedRoute>
                    } />
                  </Route>
                </Routes>
              </Suspense>
              <Toaster position="top-right" />
            </div>
          </ShadcnThemeProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;