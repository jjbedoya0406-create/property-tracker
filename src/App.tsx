import { QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./auth";
import { queryClient } from "./queryClient";
import { RequirePortfolio } from "./portfolio/RequirePortfolio";
import {
  CapturePage,
  CategoriesListPage,
  Layout,
  PropertiesListPage,
  PropertyDetailPage,
  SignInPage,
} from "./routes";

function PortfolioLayout() {
  return (
    <ProtectedRoute>
      <RequirePortfolio>
        <Outlet />
      </RequirePortfolio>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/properties" replace />} />
              <Route path="sign-in" element={<SignInPage />} />
              <Route element={<PortfolioLayout />}>
                <Route path="properties" element={<PropertiesListPage />} />
                <Route
                  path="properties/:propertyId"
                  element={<PropertyDetailPage />}
                />
                <Route path="capture" element={<CapturePage />} />
                <Route path="categories" element={<CategoriesListPage />} />
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
