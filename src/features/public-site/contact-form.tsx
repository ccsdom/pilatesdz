"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import v from "./contact-form.module.css";

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
      if (!res.ok) throw new Error(data.error || "Impossible de transmettre le message.");
      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue lors de l’envoi.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return <div className={`${v.panel} ${v.success}`} role="status">
    <CheckCircle2 size={38}/><p className={v.eyebrow}>Merci pour votre confiance</p><h2>Votre message est bien reçu.</h2>
    <p>Merci {name}. L’équipe du studio prendra connaissance de votre demande et pourra vous recontacter au {phone}.</p>
    <button className={v.submit} onClick={() => { setSubmitted(false); setName(""); setPhone(""); setEmail(""); setMessage(""); setSubject("Demande d'information générale"); }}>Écrire un autre message <ArrowUpRight size={17}/></button>
  </div>;

  return <div className={v.panel}>
    <p className={v.eyebrow}>Écrivez-nous</p><h2>À vous la parole.</h2><p className={v.intro}>Quelques mots suffisent pour commencer. Les champs marqués d’un astérisque sont obligatoires.</p>
    {errorMessage && <div role="alert" className={v.error}><AlertCircle size={18}/><span>{errorMessage}</span></div>}
    <form onSubmit={handleSubmit} className={v.form} aria-label="Contacter le studio" aria-busy={loading}>
      <div className={v.row}>
        <div><label htmlFor="contact-name">Nom et prénom <span>*</span></label><input id="contact-name" name="name" autoComplete="name" type="text" required value={name} onChange={e=>setName(e.target.value)} placeholder="Votre nom complet"/></div>
        <div><label htmlFor="contact-phone">Téléphone <span>*</span></label><input id="contact-phone" name="phone" autoComplete="tel" type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Votre numéro de téléphone"/></div>
      </div>
      <div><label htmlFor="contact-email">Adresse e-mail <span>*</span></label><input id="contact-email" name="email" autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com"/></div>
      <div><label htmlFor="contact-subject">Votre demande concerne</label><select id="contact-subject" name="subject" value={subject} onChange={e=>setSubject(e.target.value)}><option value="Demande d'information générale">Une question sur le studio</option><option value="Réservation d'un cours d'essai">Une première séance</option><option value="Renseignements sur les Abonnements">Les abonnements</option><option value="Cours Individuel 1-on-1">Un accompagnement privé</option></select></div>
      <div><label htmlFor="contact-message">Votre message <span>*</span></label><textarea id="contact-message" name="message" rows={5} required value={message} onChange={e=>setMessage(e.target.value)} placeholder="Vos envies, vos questions, vos disponibilités…"/></div>
      <p className={v.privacy}>Vos coordonnées permettent à l’équipe de répondre à votre demande. <Link href="/politique-de-confidentialite">En savoir plus sur vos données.</Link></p>
      <button type="submit" disabled={loading} className={v.submit}>{loading ? <><span>Envoi en cours…</span><Loader2 size={18} className={v.spinner}/></> : <><span>Envoyer mon message</span><ArrowUpRight size={18}/></>}</button>
    </form>
  </div>;
}
