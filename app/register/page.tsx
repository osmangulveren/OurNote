import { ALL_COUNTRIES } from "@/lib/config";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Open a trade account" };

export default function RegisterPage() {
  const countries = Object.entries(ALL_COUNTRIES).sort((a, b) => a[1].localeCompare(b[1]));
  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-2xl p-8">
        <h1 className="h1 mb-1">Open a trade account</h1>
        <p className="muted mb-6">
          For retailers and businesses only. We review every application, usually within one business day.
          Once approved you will see wholesale prices and can place orders.
        </p>
        <RegisterForm countries={countries} />
      </div>
    </div>
  );
}
