import { Link } from "react-router-dom";
import Icon from "@/components/Icon";

export default function NotFoundPage() {
  return (
    <div className="py-10 text-center">
      <Icon name="mood-sad" className="mx-auto h-14 w-14 text-accent-700" />
      <h1 className="mt-3 text-3xl font-semibold">This page wandered off</h1>
      <p className="mt-2 text-ink-700">We can’t find what you’re looking for.</p>
      <Link to="/" className="mt-4 inline-block font-semibold text-accent-700 underline">
        ← Back to the map
      </Link>
    </div>
  );
}
