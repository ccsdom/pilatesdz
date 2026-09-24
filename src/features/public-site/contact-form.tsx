"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Demande d'information générale");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de transmettre le message.");
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-[#cdae72]/40 bg-white p-8 lg:p-10 shadow-sm text-center space-y-4 animate-fadeIn">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b7893b]/15 text-[#99702d]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-3xl font-light text-[#1c1917]">Message enregistré dans la base !</h3>
        <p className="text-sm text-[#61574b] max-w-md mx-auto leading-relaxed">
          Merci <strong className="text-[#1c1917]">{name}</strong>. Votre demande a bien été transmise et synchronisée avec le CRM du studio. Notre équipe vous recontactera au <strong>{phone}</strong> dans les plus brefs délais.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setName("");
            setPhone("");
            setEmail("");
            setMessage("");
          }}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-[#cdae72]/60 px-6 py-2.5 text-xs font-semibold text-[#1c1917] hover:bg-[#faf7f2] transition-colors"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#e5dacf] bg-white p-8 lg:p-10 shadow-sm">
      <h2 className="font-serif text-3xl font-light text-[#1c1917]">Envoyez-nous un message</h2>
      <p className="mt-2 text-sm text-[#61574b]">
        Complétez le formulaire ci-dessous, vos informations seront transmises directement à l&apos;équipe du studio.
      </p>

      {errorMessage && (
        <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-2">
              Nom & Prénom *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom complet"
              className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-2">
              Numéro de Téléphone *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05 53 02 17 14"
              className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-2">
            Adresse E-mail *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre.email@exemple.com"
            className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-2">
            Sujet de votre demande
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
          >
            <option value="Demande d'information générale">Demande d&apos;information générale</option>
            <option value="Réservation d'un cours d'essai">Réservation d&apos;un cours d&apos;essai</option>
            <option value="Renseignements sur les Abonnements">Renseignements sur les Abonnements</option>
            <option value="Cours Individuel 1-on-1">Cours Individuel 1-on-1</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-2">
            Message *
          </label>
          <textarea
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Précisez votre demande ou vos disponibilités..."
            className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1c1917] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[#b7893b] hover:text-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#e5be78]" />
              <span>Enregistrement en cours...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Envoyer votre message</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
