import { WaitlistForm } from './waitlist-form';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-lg text-bruma">Manta</p>
      <h1 className="mt-4 text-4xl leading-tight font-semibold text-balance sm:text-5xl">
        Tai chi en el espacio que tengas.
      </h1>
      <p className="mt-6 text-lg leading-8 text-espuma/80">
        Sentado, de pie en un metro cuadrado o con la forma completa. Las clases se descargan y
        funcionan sin internet.
      </p>
      <p className="mt-4 text-base leading-7 text-bruma">
        La empezamos para un pescador que pasa semanas en altamar.
      </p>
      <WaitlistForm />
    </main>
  );
}
