import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DesktopUpdateMenu, useDesktopUpdate } from "./DesktopUpdateMenu";
import "./styles.css";

function Harness() {
  const [presenting, setPresenting] = useState(false);
  const update = useDesktopUpdate(presenting);
  const trigger = useRef<HTMLButtonElement>(null);
  Object.assign(window, { setPresenting });
  return <header className="topbar"><div className="topbar-actions settings-menu">
    <button ref={trigger} onClick={update.show}>Version und Updates</button>
    <DesktopUpdateMenu update={update} returnFocusRef={trigger}/>
  </div></header>;
}

createRoot(document.getElementById("root")!).render(<Harness/>);
