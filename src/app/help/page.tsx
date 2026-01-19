
const glossaryTerms = [
  {
    term: 'Pista Financiera',
    definition:
      'El tiempo que tu negocio puede operar con el dinero disponible antes de quedarse sin fondos. Se mide en meses. Por ejemplo, si tienes $10,000,000 y gastas $1,000,000 al mes, tu pista financiera es de 10 meses.',
  },
  {
    term: 'Tasa de Consumo',
    definition:
      'La velocidad a la que tu negocio gasta dinero cada mes. Incluye todos los gastos operativos. Una tasa de consumo baja significa que tu dinero dura más tiempo.',
  },
  {
    term: 'Puntuación de Salud',
    definition:
      'Una calificación de 0 a 100 que indica qué tan saludable está tu negocio financieramente. Considera la pista financiera, márgenes de ganancia y tendencias de flujo de efectivo.',
  },
  {
    term: 'Saldo Neto',
    definition:
      'La diferencia entre tus ingresos totales y tus gastos totales. Un saldo neto positivo significa que estás ganando más de lo que gastas.',
  },
  {
    term: 'Margen de Ganancia',
    definition:
      'El porcentaje de ingresos que queda después de pagar todos los gastos. Si vendes por $100 y gastas $70, tu margen de ganancia es del 30%.',
  },
  {
    term: 'Flujo de Efectivo',
    definition:
      'El movimiento de dinero que entra y sale de tu negocio. Un flujo de efectivo positivo significa que entra más dinero del que sale.',
  },
];

import './help-page.scss';

export default function AyudaPage() {
  return (
    <div className="help-page">
      <header className="help-page__header">
        <h1 className="help-page__title">Glosario Financiero</h1>
        <p className="help-page__subtitle">
          Términos financieros explicados sin jerga técnica, diseñados para emprendedores.
        </p>
      </header>

      <div className="help-page__glossary">
        {glossaryTerms.map((item) => (
          <div key={item.term} className="help-page__term-card">
            <h2 className="help-page__term-title">
              {item.term}
            </h2>
            <p className="help-page__term-definition">{item.definition}</p>
          </div>
        ))}
      </div>

      <div className="help-page__support-card">
        <h2 className="help-page__support-title">¿Necesitas más ayuda?</h2>
        <p className="help-page__support-text">
          Esta sección se expandirá con tutoriales, videos y guías paso a paso para ayudarte
          a comprender mejor tus finanzas.
        </p>
      </div>
    </div>
  );
}
