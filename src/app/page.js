'use client';
import { useState } from 'react';
import Spinner from '@/app/components/loader/Spinner';
import Image from 'next/image';

export default function Home() {
  const [file, setFile] = useState (null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState (null);

  if (loading) return <Spinner />;

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Take a photo of your purchase receipt to get started 🍕</h1>
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setData(null);
        const formData = new FormData();
        formData.append('file', file);
        fetch('/api', {
          method: 'POST',
          body: formData
        }).then(res => res.json())
          .then(data => setData(data))
          .finally(() => setLoading(false));
      }}>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.item(0) || null)} />
        <button type="submit" className="p-2 text-white bg-blue-500 rounded">Magic!</button>
      </form>
      {file && <div className="relative w-96 h-96">
        <Image alt='MX ID Front' src={URL.createObjectURL(file)} layout="fill" objectFit="contain" />
      </div>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </main>
  )

}