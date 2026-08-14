import receipt from '@assets/generated_images/educpay-receipt.jpg';

export default function ReceiptBand() {
  return <section className="receipt-band" aria-label="Le reçu comme trace de confiance"><img src={receipt} alt="Une remise de reçu au comptoir de l'établissement scolaire" /><div className="container receipt-content"><div className="receipt-copy"><span className="eyebrow">Chaque versement compte</span><h2 className="display">Un reçu, c’est une trace. Et une relation qui s’éclaire.</h2><p>Avec EducPAY, l’encaissement ne disparaît plus dans un carnet : il devient une information retrouvable, partageable et utile à toute l’équipe.</p></div></div></section>;
}