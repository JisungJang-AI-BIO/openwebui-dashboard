import { BrowserRouter } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import { ToastProvider } from "@/components/Toast";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Dashboard />
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
