import Home from "./Pages/Home";
import { Login }         from "./Auth/Login";
import { Signup }        from "./Auth/Signup";
import { Forgetpin }     from "./Auth/ForgetPin";
import ProtectedRoute    from "./Auth/ProtectedR";
import Layout            from "./Layout";
import MainSubscription  from "./Pages/Subscription/MainSubscription";
import MlmProfile        from "./Pages/Mymlmprofile/MlmProfile";
import ProtectMlmProfile from "./Pages/SelectCompany/ProtectMlmProfile";
import SelectComp        from "./Pages/SelectCompany/SelectComp";
import { Routes, Route } from "react-router";

function App() {
  return (
    <Routes>

      {/* ── Public auth routes ── */}
      <Route path="/login"     element={<Login />} />
      <Route path="/signup"    element={<Signup />} />
      <Route path="/forgetpin" element={<Forgetpin />} />

      {/* ── Company selection page ──
           Only needs login. No profile guard here —
           this IS the page to fix the missing company. */}
      <Route
        path="/selectcomp"
        element={
          <ProtectedRoute>
            <Layout>
              <SelectComp />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProtectMlmProfile>
              <Layout><Home /></Layout>
            </ProtectMlmProfile>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mlmprofile"
        element={
          <ProtectedRoute>
            <ProtectMlmProfile>
              <Layout><MlmProfile /></Layout>
            </ProtectMlmProfile>
          </ProtectedRoute>
        }
      />

      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <ProtectMlmProfile>
              <Layout><MainSubscription /></Layout>
            </ProtectMlmProfile>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;