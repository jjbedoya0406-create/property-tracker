import { QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./auth";
import { queryClient } from "./queryClient";
import {
  CapturePage,
  Layout,
  PropertiesListPage,
  PropertyDetailPage,
  SignInPage,
} from "./routes";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/properties" replace />} />
              <Route path="sign-in" element={<SignInPage />} />
              <Route
                path="properties"
                element={
                  <ProtectedRoute>
                    <PropertiesListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="properties/:propertyId"
                element={
                  <ProtectedRoute>
                    <PropertyDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="capture"
                element={
                  <ProtectedRoute>
                    <CapturePage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
