import { QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./auth";
import { BottomTabBar } from "./components/BottomTabBar";
import { queryClient } from "./queryClient";
import { RequirePortfolio } from "./portfolio/RequirePortfolio";
import { PickerSpikePage } from "./spike/PickerSpikePage";
import {
  CapturePage,
  CategoriesListPage,
  Layout,
  PropertiesListPage,
  PropertyDetailPage,
  SettingsPage,
  SignInPage,
} from "./routes";

function PortfolioLayout() {
  return (
    <ProtectedRoute>
      <RequirePortfolio>
        {/* BottomTabBar needs PortfolioContext (for translations), so it
            renders here, inside RequirePortfolio's ready state, rather
            than in the outer Layout — which sits outside this provider
            and would crash on mount (e.g. right after sign-in, before
            settings resolve). */}
        <div className="flex flex-1 flex-col pb-24">
          <Outlet />
        </div>
        <BottomTabBar />
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
                <Route path="settings" element={<SettingsPage />} />
                {/* Spike for issue #3 — not linked from nav, direct-URL
                    only (#/spike/picker). See PickerSpikePage.tsx. */}
                <Route path="spike/picker" element={<PickerSpikePage />} />
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
