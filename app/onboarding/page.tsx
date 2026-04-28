'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage(): JSX.Element {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const router = useRouter();

  const submitPhone = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setStep('otp');
    console.log(`[Mock OTP] ${phone} => 123456`);
  };

  const submitOtp = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    const result = await signIn('credentials', { phone, otp, redirect: false });

    if (result?.ok) {
      router.replace('/feed');
      return;
    }

    setError('Kod yanlış. Test kodu 123456');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6">
      <h1 className="text-3xl font-black">FabrikaFiyat</h1>
      <p className="mt-2 text-zinc-500">Üretici fiyatına mobilya</p>

      {step === 'phone' ? (
        <form onSubmit={submitPhone} className="mt-8 space-y-4">
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Telefon numaranız"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3"
            required
          />
          <button className="w-full rounded-xl bg-brand py-3 font-semibold text-white">OTP Gönder</button>
        </form>
      ) : (
        <form onSubmit={submitOtp} className="mt-8 space-y-4">
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="6 haneli kod"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3"
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button className="w-full rounded-xl bg-brand py-3 font-semibold text-white">Devam Et</button>
        </form>
      )}
    </div>
  );
}
