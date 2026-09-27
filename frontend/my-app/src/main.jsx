import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";
import "./index.css"; // Import the global stylesheet
import premiumTheme from "./theme/premiumTheme";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={premiumTheme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);