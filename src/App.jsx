// src/App.js
import React from "react";
import "animate.css";
import "./index.css";
import Menu from "./components/menu";
import AdminPage from "./components/AdminPage";
import GalleryPage from "./components/GalleryPage";

function App() {
  const currentPath = window.location.pathname.replace(/\/+$/, "");
  if (currentPath === "/admin") {
    return <AdminPage />;
  }
  if (currentPath === "/gallery") {
    return <GalleryPage />;
  }

  return (
    <>
      <Menu />
    </>
  );
}

export default App;
