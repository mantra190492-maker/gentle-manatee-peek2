import { useNavigate } from "react-router-dom";

export function useScrollToModule() {
  const navigate = useNavigate();

  const scrollToModule = (id: string) => {
    // If already on "/", scroll immediately
    if (location.pathname === "/") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    // Otherwise go home, then scroll after paint
    navigate("/");
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return scrollToModule;
}