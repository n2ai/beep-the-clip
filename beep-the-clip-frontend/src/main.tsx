import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Amplify } from "aws-amplify"
import { amplifyConfig } from "@/lib/amplify-config"
import "./index.css"
import App from "./App.tsx"

Amplify.configure(amplifyConfig)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
