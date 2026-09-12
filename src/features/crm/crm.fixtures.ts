import { CalendarDays, CreditCard, UsersRound, WalletCards } from "lucide-react";

// Données fictives : aucune connexion à un compte ou à une base réelle.
export const sessions = [
  { time: "09:00", title: "Reformer Fondations", coach: "Sarah", count: "5/6" },
  { time: "10:30", title: "Pilates au sol", coach: "Nesrine", count: "8/10" },
  { time: "14:00", title: "Reformer Flow", coach: "Sarah", count: "6/6" },
  { time: "17:30", title: "Séance individuelle", coach: "Lina", count: "1/1" },
];

export const stats = [{icon:CalendarDays,value:"18",label:"Séances aujourd’hui",note:"+3 cette semaine"},{icon:UsersRound,value:"Annuaire",label:"Clientes",note:"Fiches du centre"},{icon:WalletCards,value:"32",label:"Forfaits à renouveler",note:"Avant le 30 sept."},{icon:CreditCard,value:"286 500 DA",label:"Chiffre du mois",note:"+12,4%"}];
