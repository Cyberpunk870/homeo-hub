import { useRouteError } from "react-router";
import { useEffect, useRef } from "react";

export default function ErrorPage() {
  const ref = useRef<HTMLDivElement>(null);
  const error = useRouteError() as Error;

  useEffect(() => {
    if (ref.current) {
      const ErrorOverlay = window.customElements.get('vite-error-overlay');
      ref.current.appendChild(new ErrorOverlay(error, 'runtime'));
    }
  }, [error]);

  return (
    <div ref={ref}></div>
  );
};
