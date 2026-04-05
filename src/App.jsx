import Home from "./Pages/Home";
import { Login } from "./Auth/Login";
import { Signup } from "./Auth/Signup";
import { Forgetpin } from "./Auth/ForgetPin";
import ProtectedRoute from "./Auth/ProtectedR";
import Layout from "./Layout";
import MainSubscription from "./Pages/Subscription/MainSubscription";
import MlmProfile from "./Pages/Mymlmprofile/MlmProfile";
import ProtectMlmProfile from "./Pages/SelectCompany/ProtectMlmProfile";
import ProtectSelectComp from "./Pages/SelectCompany/ProtectSelectComp"; // ✅ new
import SelectComp from "./Pages/SelectCompany/SelectComp";
import { Routes, Route } from "react-router";
import AllTemplates from "./Pages/Homepage/Component/AllTemplates";
import Mainform from "./Pages/mainform/Mainform";
import MainEditor from "./Pages/Editor/MainEditor";

function App() {
  return (
    <Routes>

      {/* ── Public auth routes ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgetpin" element={<Forgetpin />} />

      {/* ── Company selection ── blocked if profile already exists */}
      <Route
        path="/selectcomp"
        element={
          <ProtectedRoute>
            <ProtectSelectComp>  {/* ✅ redirects to "/" if mlmProfile exists */}
              <Layout>
                <SelectComp />
              </Layout>
            </ProtectSelectComp>
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
        path="/alltemp"
        element={
          <ProtectedRoute>
            <ProtectMlmProfile>
              <Layout><AllTemplates /></Layout>
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
        path="/mlmform"
        element={
          <ProtectedRoute>
            <ProtectMlmProfile>
              <Layout>
                <Mainform/>
                </Layout>
            </ProtectMlmProfile>
          </ProtectedRoute>
        }
      />
       <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <ProtectMlmProfile>
              <Layout>
              <MainEditor/>
                </Layout>
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